import Layout from "../components/Layout";
import { useEffect, useState, useRef, useContext } from "react";
import { supabase } from "../supabaseClient";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Link } from "react-router-dom";
import KanbanBoard from "../components/KanbanBoard";
import CandidateModal from "../components/CandidateModal";
import { AuthContext } from "../context/AuthContext";

export default function Candidates() {
  const t = (key) => key;
  const { user } = useContext(AuthContext);
  const [viewMode, setViewMode] = useState("table");
  const fileInputRef = useRef(null);
  const [data, setData] = useState([]);

  // --- CLIENT FEEDBACK STATE ---
  const [clientFeedbackModal, setClientFeedbackModal] = useState(null);
  const [clientStatus, setClientStatus] = useState("Pending");
  const [clientFeedback, setClientFeedback] = useState("");

  // --- RESUME VIEWER STATE ---
  const [resumeViewerUrl, setResumeViewerUrl] = useState(null);

  // --- VIEW CANDIDATE STATE ---
  const [viewCandidate, setViewCandidate] = useState(null);

  const [masterData, setMasterData] = useState({
    job_roles: [],
    clients: [],
    funnel_stages: [],
    contract_types: [],
    office_modes: [],
    recruiters: []
  });

  // persisted filter values that are actually sent to the server
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    role_id: "",
    recruiter_id: "",
    client_id: "",
    stage_id: "",
    experience: ""
  });

  // temporary values shown in the inputs; user can change these and then click apply/reset
  const [pendingFilters, setPendingFilters] = useState({
    search: "",
    role_id: "",
    recruiter_id: "",
    client_id: "",
    stage_id: "",
    experience: ""
  });

  const [sortBy, setSortBy] = useState("newest");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10; // items per page

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const { data: roles } = await supabase.from("job_roles").select("*");
        const { data: clients } = await supabase.from("clients").select("*");
        const { data: stages } = await supabase.from("funnel_stages").select("*");
        const { data: contractTypes } = await supabase.from("contract_types").select("*");
        const { data: officeModes } = await supabase.from("office_modes").select("*");
        const { data: recruiters } = await supabase.from("recruiters").select("*");

        setMasterData({
          job_roles: roles || [],
          clients: clients || [],
          funnel_stages: stages || [],
          contract_types: contractTypes || [],
          office_modes: officeModes || [],
          recruiters: recruiters || []
        });
      } catch (err) {
        console.error(err);
      }
    };

    loadMasterData();
  }, []);

  const fetchCandidates = async (page = currentPage) => {
    try {
      // Build the query with joins
      let query = supabase
        .from("candidates")
        .select(`
    *,
    job_roles:job_role_id(name),
    clients:client_id(name),
    funnel_stages:funnel_stage_id(name),
    office_modes:office_mode_id(name),
    contract_types:contract_type_id(name),
    recruiters!candidates_recruiter_id_fkey(name)
  `, { count: "exact" });

      // Apply filters
      if (appliedFilters.role_id) {
        query = query.eq("job_role_id", appliedFilters.role_id);
      }
      if (appliedFilters.recruiter_id) {
        query = query.eq("recruiter_id", appliedFilters.recruiter_id);
      }
      if (appliedFilters.client_id) {
        query = query.eq("client_id", appliedFilters.client_id);
      }
      if (appliedFilters.stage_id) {
        query = query.eq("funnel_stage_id", appliedFilters.stage_id);
      }
      if (appliedFilters.experience) {
        const exp = parseInt(appliedFilters.experience);
        if (!isNaN(exp)) {
          query = query.gte("experience", exp);
        }
      }
      if (appliedFilters.search) {
        query = query.ilike("name", `%${appliedFilters.search}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "name_asc":
          query = query.order("name", { ascending: true });
          break;
        case "name_desc":
          query = query.order("name", { ascending: false });
          break;
        case "exp_high":
          query = query.order("experience", { ascending: false });
          break;
        case "exp_low":
          query = query.order("experience", { ascending: true });
          break;
        default: // newest
          query = query.order("created_at", { ascending: false });
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error(error);
        return;
      }

      const formatted = (data || []).map(c => ({
        ...c,
        role: c.job_roles?.name,
        client: c.clients?.name,
        status: c.funnel_stages?.name,
        office_mode: c.office_modes?.name,
        contract_type: c.contract_types?.name,
        recruiter: c.recruiters?.name
      }));

      setData(formatted);
      setTotal(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCandidates(currentPage);
  }, [appliedFilters, sortBy, currentPage]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setPendingFilters(prev => ({ ...prev, [name]: value }));
    // immediately apply so user doesn't have to click
    setAppliedFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    const empty = {
      search: "",
      role_id: "",
      recruiter_id: "",
      client_id: "",
      stage_id: "",
      experience: ""
    };
    setPendingFilters(empty);
    setAppliedFilters(empty);
    setSortBy("newest");
    setCurrentPage(1);
  };

  const applyFilters = () => {
    // for manual trigger; page reset ensures results refetch
    setAppliedFilters(pendingFilters);
    setCurrentPage(1);
  };

  const handleStatusChange = async (candidateId, newStageId) => {
    try {
      const { error } = await supabase
        .from("candidates")
        .update({ funnel_stage_id: newStageId })
        .eq("id", candidateId);

      if (!error) {
        setData(prevData =>
          prevData.map(c =>
            c.id === candidateId
              ? {
                ...c,
                funnel_stage_id: newStageId,
                status:
                  masterData.funnel_stages.find(s => s.id == newStageId)?.name ||
                  c.status
              }
              : c
          )
        );
      } else {
        console.error(error);
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (!window.confirm(t("Are you sure you want to delete this candidate? This action cannot be undone."))) return;

    try {
      const { error } = await supabase
        .from("candidates")
        .delete()
        .eq("id", candidateId);

      if (!error) {
        setData(prevData => prevData.filter(c => c.id !== candidateId));
        // Refresh total count and pagination
        fetchCandidates(currentPage);
      } else {
        console.error("Delete Error:", error);
        alert(t("Failed to delete candidate"));
      }
    } catch (err) {
      console.error("Delete Error:", err);
      alert(t("Failed to delete candidate"));
    }
  };

  const exportExcel = () => {
    console.log("Current data before export:", data);

    // Helper to get contract type name from the data
    const getContractType = (candidate) => {
      if (candidate.contract_type) return candidate.contract_type;
      if (candidate.contract_type_id) {
        const found = masterData.contract_types.find(ct => ct.id === candidate.contract_type_id);
        return found ? found.name : 'N/A';
      }
      return 'N/A';
    };

    const exportData = data.map(c => ({
      ID: c.id,
      Name: c.name,
      Email: c.email || 'N/A',
      Phone: c.phone || 'N/A',
      Location: c.location || 'N/A',
      Experience: `${c.experience || 0} Yrs`,
      "Job Role": c.role || 'N/A',
      "Office Mode": c.office_mode || 'N/A',
      Client: c.client || 'N/A',
      "Funnel Stage": c.status || 'N/A',
      "Contract Type": getContractType(c) || c.contract_type || 'N/A',
      "Offer Status": c.offer_status || 'Pending',
      "Current CTC": c.current_ctc || 'N/A',
      "Expected CTC": c.expected_ctc || 'N/A',
      Recruiter: c.recruiter || 'N/A',
      "Added On": new Date(c.created_at).toLocaleDateString()
    }));

    console.log("Export data with contract types:", exportData);

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `Candidates_Export_${new Date().toLocaleDateString()}.xlsx`);
  };

  const getStatusColor = (statusName) => {
    if (!statusName) return "bg-gray-100 text-gray-600";
    const lower = statusName.toLowerCase();
    if (lower.includes('hired') || lower.includes('selected')) return "bg-green-100 text-green-700";
    if (lower.includes('reject')) return "bg-red-100 text-red-700";
    if (lower.includes('interview')) return "bg-blue-100 text-blue-700";
    if (lower.includes('offer')) return "bg-purple-100 text-purple-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const getClientStatusColor = (statusName) => {
    if (statusName === 'Approved') return "bg-green-100 text-green-700 border-green-200";
    if (statusName === 'Rejected') return "bg-red-100 text-red-700 border-red-200";
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  };

  const displayContractType = (candidate) => {
    // Try to display contract_type first, fallback to looking it up by contract_type_id
    if (candidate.contract_type) return candidate.contract_type;
    if (candidate.contract_type_id) {
      const found = masterData.contract_types?.find(ct => ct.id === candidate.contract_type_id);
      return found ? found.name : "-";
    }
    return "-";
  };

  // 🔄 ABBREVIATION MAPPINGS - Maps common abbreviations to database values
  const ABBREVIATION_MAPPINGS = {
    office_mode: {
      'WFO': 'On-site',
      'WFH': 'Remote',
      'WFM': 'Hybrid',
      'ONSITE': 'On-site'
    },
    client: {
      'INFOSYS': 'Infosys',
      'HCL': 'HCL',
      'TCS': 'TCS',
      'WIPRO': 'Wipro'
    }
  };

  // 🌐 REFERENCE DATA CREATION - Create missing reference data in database
  const createReferenceData = async (type, name) => {
    try {
      const tableMap = {
        job_role: "job_roles",
        office_mode: "office_modes",
        client: "clients",
        contract_type: "contract_types",
        recruiter: "recruiters"
      };

      const table = tableMap[type];
      if (!table) return null;

      const { data, error } = await supabase
        .from(table)
        .insert({ name })
        .select()
        .single();

      if (error) {
        console.error(error);
        return null;
      }

      return data.id;

    } catch (error) {
      console.error(error);
      return null;
    }
  };

  // Helper to parse a date string into YYYY-MM-DD
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    dateStr = String(dateStr).trim();

    // If it's already ISO (YYYY-MM-DD), return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // Split by dash or slash
    const parts = dateStr.split(/[-\/]/);
    if (parts.length === 3) {
      let [first, second, third] = parts;

      // If first part has 4 digits, it's YYYY-MM-DD or YYYY/MM/DD
      if (first.length === 4) {
        let year = first;
        let month = second.padStart(2, '0');
        let day = third.padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      // If third part has 4 digits, it's DD-MM-YYYY or DD/MM/YYYY
      else if (third.length === 4) {
        let day = first.padStart(2, '0');
        let month = second.padStart(2, '0');
        let year = third;
        return `${year}-${month}-${day}`;
      }
      // If third part has 2 digits, assume DD-MM-YY
      else if (third.length === 2) {
        let day = first.padStart(2, '0');
        let month = second.padStart(2, '0');
        let year = `20${third}`;
        return `${year}-${month}-${day}`;
      }
    }

    // Fallback: try native Date parsing (may work for some formats)
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }

    // If all else fails, return null (database will store NULL)
    return null;
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Excel Validation - Step 1 & 2: Header and Data Type Check
        const headers = XLSX.utils.sheet_to_json(ws, { header: 1 })[0] || [];
        console.log("Excel headers:", headers);

        const sampleRows = XLSX.utils.sheet_to_json(ws, { range: 1, limit: 10 }) || [];

        const requiredFields = [
          {
            field: 'name', aliases: ['NAME', 'Name'], validators: [
              (val) => {
                if (!val || val.toString().trim() === '') return true;
                const namePattern = /^[\w\s.'-]{2,50}$/;
                const locationKeywords = ['Remote', 'Hybrid', 'Onsite', 'WFO', 'WFH', 'WFM', 'Mumbai', 'Delhi', 'Bangalore', 'Hybrid', 'Pune'];
                const isInvalidLocation = locationKeywords.some(kw => val.toString().toLowerCase().includes(kw.toLowerCase()));
                return namePattern.test(val.toString().trim()) && !isInvalidLocation;
              }
            ]
          },
          {
            field: 'current_ctc', aliases: ['CURRENT CTC', 'Current CTC'], validators: [
              (val) => {
                if (!val) return true;
                const ctcPattern = /^[\d,\.kKmM\s]+$/i;
                return ctcPattern.test(val.toString().trim());
              }
            ]
          },
          {
            field: 'expected_ctc', aliases: ['EXPECTED CTC', 'Expected CTC'], validators: [
              (val) => {
                if (!val) return true;
                const ctcPattern = /^[\d,\.kKmM\s]+$/i;
                return ctcPattern.test(val.toString().trim());
              }
            ]
          },
          {
            field: 'experience', aliases: ['REL EXP (YEARS)', 'Experience', 'Exp'], validators: [
              (val) => {
                if (!val) return true;
                const numPattern = /^\d+$/;
                return numPattern.test(val.toString().trim());
              }
            ]
          }
        ];

        const errors = [];

        // Check required columns present
        requiredFields.forEach(({ field, aliases }) => {
          const found = aliases.some(alias => headers.some(h => h.toString().toUpperCase().includes(alias.toUpperCase())));
          if (!found) {
            errors.push(`Missing required column for ${field.toUpperCase()}. Expected one of: ${aliases.join(', ')}`);
          }
        });

        // Sample data validation
        requiredFields.forEach(({ field, aliases, validators }) => {
          const columnValues = sampleRows.map(row => {
            for (const alias of aliases) {
              const val = row[alias];
              if (val !== undefined && val !== null && val !== '') return val;
            }
            return null;
          }).filter(Boolean);

          if (columnValues.length === 0) return;

          let invalidCount = 0;
          const invalidSamples = [];
          columnValues.slice(0, 5).forEach((val, idx) => {  // Check first 5
            const isValid = validators.every(fn => fn(val));
            if (!isValid) {
              invalidCount++;
              invalidSamples.push(`Row ${idx + 2}: "${val}"`);
            }
          });

          const invalidRatio = invalidCount / Math.min(columnValues.length, 5);
          if (invalidRatio > 0.2) {  // >20% invalid
            errors.push(`Invalid data in ${field.toUpperCase()} column (${Math.round(invalidRatio * 100)}% bad): ${invalidSamples.slice(0, 3).join('; ')}`);
          }
        });

        const isValid = errors.length === 0;
        if (!isValid) {
          console.error("Excel validation failed:", errors);
          alert(`Invalid Excel data!\n\nErrors:\n${errors.join('\n')}\n\nPlease fix columns and try again.\nExpected:\n- NAME: names only (no locations like Remote/Hybrid)\n- CTC: numbers (10L, 20k etc)\n- Experience: numbers only`);
          return;
        }

        console.log("Excel validation passed!");

        const rawData = XLSX.utils.sheet_to_json(ws);

        // Debug: Log the first row to see all column names
        if (rawData.length > 0) {
          console.log("Excel columns found:", Object.keys(rawData[0]));
          console.log("First row data:", rawData[0]);
          console.log("Master data contract types available:", masterData.contract_types);
        }

        const findIdByName = async (array, name, type) => {
          if (!name) return null;
          const trimmedName = String(name).toLowerCase().trim();

          // Skip N/A values
          if (trimmedName === 'n/a' || trimmedName === '-') return null;

          // Normalize function: handle spacing and hyphenation differences
          const normalize = (str) => {
            return str
              .toLowerCase()
              .trim()
              .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
              .replace(/[\s\-]+/g, '-')  // Replace spaces and hyphens with single hyphen
              .replace(/-+/g, '-');  // Remove double hyphens
          };

          const normalizedSearch = normalize(trimmedName);

          // Try exact match first
          const found = array.find(item =>
            item.name && item.name.toLowerCase().trim() === trimmedName
          );

          if (found) {
            console.log(`✓ Matched "${name}" to ID ${found.id}`);
            return found.id;
          }

          // Try normalized match (handles "Full time" vs "Full-Time", etc.)
          const normalizedMatch = array.find(item =>
            item.name && normalize(item.name) === normalizedSearch
          );

          if (normalizedMatch) {
            console.log(`✓ Matched "${name}" to ID ${normalizedMatch.id}`);
            return normalizedMatch.id;
          }

          // Try case-insensitive match
          const caseInsensitiveMatch = array.find(item =>
            item.name && item.name.toLowerCase().trim() === trimmedName
          );

          if (caseInsensitiveMatch) {
            console.log(`✓ Matched "${name}" to ID ${caseInsensitiveMatch.id}`);
            return caseInsensitiveMatch.id;
          }

          // Try partial match as fallback
          const partialMatch = array.find(item =>
            item.name && (trimmedName.includes(item.name.toLowerCase().trim()) ||
              item.name.toLowerCase().trim().includes(trimmedName))
          );

          if (partialMatch) {
            console.log(`✓ Partial matched "${name}" to ID ${partialMatch.id}`);
            return partialMatch.id;
          }

          // Try abbreviation mapping before giving up (non-recursive to avoid stack overflow)
          if (type && ABBREVIATION_MAPPINGS[type]) {
            const mappedName = ABBREVIATION_MAPPINGS[type][trimmedName.toUpperCase()];
            if (mappedName) {
              console.log(`📍 Using abbreviation mapping: "${name}" → "${mappedName}"`);
              // Direct lookup instead of recursion
              const directMatch = array.find(item =>
                item.name && item.name.toLowerCase().trim() === mappedName.toLowerCase().trim()
              );
              if (directMatch) return directMatch.id;
            }
          }

          // 🆕 CREATE NEW REFERENCE DATA IF NOT FOUND
          if (type) {
            console.log(`📝 No match found for "${name}", attempting to create new ${type}...`);
            const newId = await createReferenceData(type, name);
            if (newId) {
              // Add new item to array so subsequent uses find it
              array.push({ id: newId, name: name });
              return newId;
            }
          }

          console.warn(`✗ Could not match or create "${name}" for type ${type}`, array.map(a => a.name));
          return null;
        };

        // Helper to get column value with multiple possible column names
        const getColumnValue = (row, ...columnNames) => {
          for (const colName of columnNames) {
            if (row[colName] !== undefined && row[colName] !== null && row[colName] !== '') {
              return row[colName];
            }
          }
          return null;
        };

        // Process candidates with async/await to handle new reference data creation
        // Validates a parsed row; returns array of error messages (empty if valid)
        const validateRow = (r) => {
          const errs = [];
          // Relaxed name validation - allow periods and common name characters
          if (!r.name || !/^[\w\s.'\-]+$/.test(r.name)) {
            errs.push('invalid name');
          }
          if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) {
            errs.push('invalid email');
          }
          // Relax phone validation
          if (r.phone && !/^[\+]?[\d\s\-\(\)]+$/.test(r.phone)) {
            errs.push('invalid phone');
          }
          if (isNaN(parseInt(r.experience))) {
            errs.push('invalid experience');
          }
          return errs;
        };

        const parsedCandidates = await Promise.all(rawData.map(async (row, idx) => {
          const contractTypeValue = getColumnValue(row, 'Contract Type', 'TYPE OF CONTRACT', 'ContractType', 'CONTRACTTYPE', 'CONTRACT TYPE');
          const contractTypeId = await findIdByName(masterData.contract_types, contractTypeValue, 'contract_type');

          const jobRoleValue = getColumnValue(row, 'JOB ROLE', 'Job Role');
          const jobRoleId = await findIdByName(masterData.job_roles, jobRoleValue, 'job_role');

          const clientValue = getColumnValue(row, 'CLIENT', 'Client');
          const clientId = await findIdByName(masterData.clients, clientValue, 'client');

          const officeModeValue = getColumnValue(row, 'OFFICE MODE', 'Office Mode');
          const officeModeId = await findIdByName(masterData.office_modes, officeModeValue, 'office_mode');

          const funnelStageValue = String(getColumnValue(row, 'RECRUITMENT FUNNEL', 'Funnel Stage') || '').split('-')[1]?.trim() || getColumnValue(row, 'RECRUITMENT FUNNEL', 'Funnel Stage');
          const funnelStageId = await findIdByName(masterData.funnel_stages, funnelStageValue);

          const recruiterValue = getColumnValue(row, 'RECRUITER', 'Recruiter');
          const recruiterId = await findIdByName(masterData.recruiters, recruiterValue, 'recruiter');

          // Handle submission date: Excel may store it as a number (serial date) or a string
          const excelDate = getColumnValue(row, 'SUBMISSION DATE', 'Submission Date');
          let submissionDate = null;
          if (excelDate) {
            if (typeof excelDate === "number") {
              // Convert Excel serial date to JavaScript Date
              const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
              submissionDate = jsDate.toISOString().split("T")[0];
            } else {
              // Parse string date using our helper
              submissionDate = parseDateString(excelDate);
            }
          }

          const parsedRow = {
            name: getColumnValue(row, 'NAME', 'Name') || "",
            email: getColumnValue(row, 'EMAIL', 'Email') || "",
            phone: getColumnValue(row, 'PHONE', 'Phone') || "",
            location: getColumnValue(row, 'CURRENT LOCATION', 'Location') || "",
            experience: parseInt(getColumnValue(row, 'REL EXP (YEARS)', 'Experience')) || 0,
            job_role_id: jobRoleId || masterData.job_roles[0]?.id || null,
            client_id: clientId || masterData.clients[0]?.id || null,
            funnel_stage_id: funnelStageId || masterData.funnel_stages[0]?.id || null,
            office_mode_id: officeModeId || masterData.office_modes[0]?.id || null,
            contract_type_id: contractTypeId,
            offer_status: getColumnValue(row, 'OFFER STATUS', 'Offer Status') || 'Pending',
            job_location: getColumnValue(row, 'JOB LOCATION', 'Job Location') || "",
            submission_date: submissionDate,
            current_ctc: getColumnValue(row, 'CURRENT CTC', 'Current CTC') || "",
            expected_ctc: getColumnValue(row, 'EXPECTED CTC', 'Expected CTC') || "",
            recruiter_id: recruiterId || null
          };

          if (contractTypeValue) {
            console.log(`Row ${idx + 1} (${row.Name || row.name}): Contract Type = "${contractTypeValue}" → ID = ${contractTypeId}`);
          }

          // validate row
          const rowErrors = validateRow(parsedRow);
          if (rowErrors.length) {
            throw new Error(`Row ${idx + 1} failed validation: ${rowErrors.join(', ')}`);
          }

          return parsedRow;
        })).then(candidates => candidates.filter(c => c.name));

        console.log("Final parsed candidates for import:", JSON.stringify(parsedCandidates, null, 2));

        const { error } = await supabase
          .from("candidates")
          .insert(parsedCandidates);

        if (error) {
          console.error(error);
          alert("Import failed: " + error.message);
        } else {
          alert("Candidates imported successfully");

          // refresh table immediately
          await fetchCandidates(1);

          setCurrentPage(1);
        }
      } catch (error) {
        console.error("Import error:", error);
        alert(t("Failed to import Excel file: ") + error.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Candidates</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage and track your entire talent pool</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {user?.role !== 'client' && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-white border border-gray-200/80 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 shadow-sm"
            >
              <input type="file" ref={fileInputRef} hidden onChange={handleImport} accept="*/*" />
              Import
            </button>
          )}

          <div className="bg-gray-100 p-1 flex rounded-xl border border-gray-200">
            <button onClick={() => setViewMode("table")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === "table" ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}>List View</button>
            <button onClick={() => setViewMode("kanban")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === "kanban" ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}>Kanban</button>
          </div>

          {user?.role !== 'client' && (
            <>
              <button onClick={exportExcel} className="flex items-center gap-2 bg-white border border-gray-200/80 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 shadow-sm">{t("Export")}</button>
              <Link to="/add" className="flex items-center gap-2 bg-teal-600 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md">{t("Add Candidate")}</Link>
            </>
          )}
        </div>
      </div>

      <div className="bg-yellow-50 p-5 rounded-2xl shadow-sm border border-yellow-200 mb-6">
        <div className="flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V18l-3-3v-4a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <h2 className="text-lg font-semibold text-yellow-700">{t("Filter Candidates")}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <select name="role_id" className="w-full border border-gray-200 bg-white px-4 py-2.5 rounded-xl text-sm" value={pendingFilters.role_id} onChange={handleFilterChange}>
            <option value="">{t("All Roles")}</option>
            {masterData.job_roles?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select name="recruiter_id" className="w-full border border-gray-200 bg-gray-50/50 px-4 py-2.5 rounded-xl text-sm" value={pendingFilters.recruiter_id} onChange={handleFilterChange}>
            <option value="">All Recruiters</option>
            {masterData.recruiters?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          {user?.role !== 'client' && (
            <select name="client_id" className="w-full border border-gray-200 bg-gray-50/50 px-4 py-2.5 rounded-xl text-sm" value={pendingFilters.client_id} onChange={handleFilterChange}>
              <option value="">{t("All Clients")}</option>
              {masterData.clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          <select name="stage_id" className="w-full border border-gray-200 bg-gray-50/50 px-4 py-2.5 rounded-xl text-sm" value={pendingFilters.stage_id} onChange={handleFilterChange}>
            <option value="">{t("All Pipeline Stages")}</option>
            {masterData.funnel_stages?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select name="experience" className="w-full border border-gray-200 bg-gray-50/50 px-4 py-2.5 rounded-xl text-sm" value={pendingFilters.experience} onChange={handleFilterChange}>
            <option value="">{t("Any Experience")}</option>
            <option value="1">1+ years</option>
            <option value="3">3+ years</option>
            <option value="5">5+ years</option>
          </select>

          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input name="search" placeholder={t("Search by name...")} className="w-full border border-gray-200 bg-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 text-sm" value={pendingFilters.search} onChange={handleFilterChange} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="space-x-2">
            <button onClick={handleResetFilters} className="text-sm text-gray-600 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">{t("Reset")}</button>
            <button onClick={applyFilters} className="text-sm bg-yellow-600 text-white px-4 py-2 rounded-xl hover:bg-yellow-700">{t("Apply")}</button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{t("Sort By")}</span>
            <select onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }} value={sortBy} className="border border-gray-200 bg-white px-4 py-2.5 rounded-xl text-sm">
              <option value="newest">{t("Recently Added")}</option>
              <option value="oldest">{t("Oldest First")}</option>
              <option value="name_asc">{t("Name A–Z")}</option>
              <option value="name_desc">{t("Name Z–A")}</option>
              <option value="exp_high">{t("Experience High→Low")}</option>
              <option value="exp_low">{t("Experience Low→High")}</option>
            </select>
          </div>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <KanbanBoard data={data} masterData={masterData} handleStatusChange={handleStatusChange} onCandidateClick={setViewCandidate} />
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-max">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Candidate Info</th>
                  <th className="px-6 py-4">Client & Location</th>
                  <th className="px-6 py-4">CTC Details</th>
                  <th className="px-6 py-4">Resume</th>
                  <th className="px-6 py-4">{t("RECRUITMENT FUNNEL")}</th>
                  <th className="px-6 py-4">Recruiter</th>
                  <th className="px-6 py-4">Contract Type</th>
                  <th className="px-6 py-4">Experience</th>
                  <th className="px-6 py-4">Skills</th>
                  <th className="px-6 py-4">Client Feedback</th>
                  {user?.role === 'admin' && <th className="px-6 py-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {data.length > 0 ? (
                  data.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setViewCandidate(c)}>
                      <td className="px-6 py-5">
                        <div className="font-bold text-gray-800 text-sm">{c.name}</div>
                        <div className="font-semibold text-teal-600 text-[11px] mt-1 tracking-wide uppercase">{c.role}</div>
                        {c.location && (
                          <div className="text-[11px] font-medium text-gray-400 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {c.location}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-medium text-gray-800">{c.client || "-"}</div>
                        <div className="text-[11px] font-medium text-gray-500 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {c.job_location || "Remote"}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Curr: <span className="text-gray-700 font-bold">{c.current_ctc || "-"}</span></div>
                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mt-1">Exp: <span className="text-teal-600 font-bold">{c.expected_ctc || "-"}</span></div>
                      </td>
                      <td className="px-6 py-5">
                        {c.resume_url ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); setResumeViewerUrl(c.resume_url); }}
                            className="text-teal-600 font-bold hover:underline text-xs bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 transition-colors hover:bg-teal-100 inline-flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            View
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[11px] font-medium italic">Not Provided</span>
                        )}
                      </td>
                      <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                        <select className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusColor(c.status)}`} value={c.funnel_stage_id || ""} onChange={(e) => handleStatusChange(c.id, e.target.value)}>
                          {masterData.funnel_stages?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-5">{c.recruiter}</td>
                      <td className="px-6 py-5">{displayContractType(c)}</td>
                      <td className="px-6 py-5">{c.experience ? `${c.experience} Years` : "-"}</td>
                      <td className="px-6 py-5">
                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide"><span className="text-gray-700 font-bold">{c.primary_skills || ""}</span></div>
                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mt-1"><span className="text-teal-600 font-bold">{c.secondary_skills || ""}</span></div>
                      </td>
                      {/* REPLACED CLIENT FEEDBACK TD WITH STOP PROPAGATION */}
                      <td
                        className="px-6 py-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={`px-2.5 py-1 rounded text-[10px] font-bold inline-block border uppercase tracking-wider ${getClientStatusColor(c.client_status)}`}>
                          {c.client_status || 'Pending'}
                        </div>

                        {c.client_feedback && (
                          <div className="text-[11px] text-gray-500 mt-1.5 max-w-[140px] truncate" title={c.client_feedback}>
                            {c.client_feedback}
                          </div>
                        )}

                        {(user?.role === 'client' || user?.role === 'admin') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setClientFeedbackModal(c);
                              setClientStatus(c.client_status || 'Pending');
                              setClientFeedback(c.client_feedback || '');
                            }}
                            className="mt-2 text-[10px] text-blue-500 font-bold hover:underline flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Provide Review
                          </button>
                        )}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-5 text-center flex flex-wrap items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Link to={`/edit/${c.id}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit Candidate">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </Link>
                          <button onClick={() => handleDeleteCandidate(c.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Delete Candidate">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="11" className="px-6 py-24 text-center text-gray-400 font-semibold">No candidates found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {data.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages > 0 ? totalPages : 1}</span>
            {total > 0 && (<span> (<span className="font-medium">{total}</span> total candidates)</span>)}
          </div>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                      }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg ${currentPage === pageNum
                        ? "bg-teal-600 text-white"
                        : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return (
                    <span key={pageNum} className="px-2 py-1.5 text-gray-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}
              <button
                onClick={() => {
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* CLIENT FEEDBACK MODAL */}
      {clientFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-[500px] p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Candidate Feedback</h2>
              <button
                onClick={() => setClientFeedbackModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">

              {/* STATUS */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Status
                </label>
                <div className="flex gap-3">
                  {['Pending', 'Approved', 'Rejected'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        console.log("Status selected:", status);
                        setClientStatus(status);
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${clientStatus === status
                        ? status === 'Approved'
                          ? 'bg-green-100 border-green-500 text-green-700'
                          : status === 'Rejected'
                            ? 'bg-red-100 border-red-500 text-red-700'
                            : 'bg-yellow-100 border-yellow-500 text-yellow-700'
                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* FEEDBACK */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Your Feedback / Comments
                </label>
                <textarea
                  className="w-full border border-gray-200 p-4 rounded-xl h-32 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium resize-none bg-gray-50/50"
                  placeholder="Enter your detailed feedback here..."
                  value={clientFeedback}
                  onChange={(e) => {
                    console.log("Typing:", e.target.value);
                    setClientFeedback(e.target.value);
                  }}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 mt-8">

                <button
                  onClick={() => setClientFeedbackModal(null)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    console.log("CLICKED:", clientFeedbackModal, clientStatus, clientFeedback);

                    try {
                      if (!clientFeedbackModal?.id) {
                        alert("Candidate ID missing ❌");
                        return;
                      }

                      const { error } = await supabase
                        .from("candidates")
                        .update({
                          client_status: clientStatus,
                          client_feedback: clientFeedback
                        })
                        .eq("id", Number(clientFeedbackModal.id));

                      console.log("UPDATE RESULT:", error);

                      if (!error) {
                        alert("Feedback saved successfully ✅");

                        setClientFeedbackModal(null);

                        // refresh data
                        fetchCandidates(currentPage);

                      } else {
                        console.error(error);
                        alert("Failed to submit feedback ❌");
                      }

                    } catch (err) {
                      console.error("ERROR:", err);
                    }
                  }}
                  className="px-8 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-200 transition-all"
                >
                  Submit Feedback
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* RESUME VIEWER MODAL */}
      {resumeViewerUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 md:p-8">
          <div className="bg-white w-full max-w-[1000px] h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Document Viewer
              </h2>
              <div className="flex gap-2">
                <a
                  href={resumeViewerUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1 text-sm font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download
                </a>
                <button
                  onClick={() => setResumeViewerUrl(null)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 p-2 md:p-4">
              {resumeViewerUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={resumeViewerUrl}
                  className="w-full h-full bg-white rounded-xl shadow-inner border border-gray-200"
                  title="Resume Viewer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-xl shadow-inner border border-gray-200 p-8 text-center">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Document Requires Download</h3>
                  <p className="text-gray-500 max-w-sm mb-6 text-sm">This file type cannot be previewed natively in the browser. Please download it to view.</p>
                  <a href={resumeViewerUrl} download target="_blank" rel="noreferrer" className="bg-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200/50">
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE INFO MODAL */}
      {viewCandidate && (
        <CandidateModal
          candidate={viewCandidate}
          onClose={() => setViewCandidate(null)}
        />
      )}
    </Layout>
  );
}