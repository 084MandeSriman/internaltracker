import express from "express";
import multer from "multer";
import db from "../db.js";
import { verifyToken } from "../middleware/auth.js";
import { sendEmail } from "../services/emailService.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.get("/", verifyToken, (req, res) => {
  const { search, role_id, client_id, stage_id, experience, recruiter_id, sortBy, page = 1 } = req.query;

  const limit = 10;
  const offset = (parseInt(page) - 1) * limit;

  let query = `
    SELECT 
      c.*,
      jr.name AS role,
      cl.name AS client,
      fs.name AS status,
      om.name AS office_mode,
      ct.name AS contract_type,
      r.name AS recruiter
    FROM candidates c
    LEFT JOIN job_roles jr ON c.job_role_id = jr.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN funnel_stages fs ON c.funnel_stage_id = fs.id
    LEFT JOIN office_modes om ON c.office_mode_id = om.id
    LEFT JOIN contract_types ct ON c.contract_type_id = ct.id
    LEFT JOIN recruiters r ON c.recruiter_id = r.id
    WHERE 1=1
  `;
  
  let countQuery = "SELECT COUNT(*) as total FROM candidates WHERE 1=1";
  const params = [];
  const countParams = [];

  if (search) {
    query += " AND c.name LIKE ?";
    countQuery += " AND name LIKE ?";
    params.push(`%${search}%`);
    countParams.push(`%${search}%`);
  }

  if (role_id) {
    query += " AND c.job_role_id=?";
    countQuery += " AND job_role_id=?";
    params.push(role_id);
    countParams.push(role_id);
  }

  if (client_id) {
    query += " AND c.client_id=?";
    countQuery += " AND client_id=?";
    params.push(client_id);
    countParams.push(client_id);
  }

  if (stage_id) {
    query += " AND c.funnel_stage_id=?";
    countQuery += " AND funnel_stage_id=?";
    params.push(stage_id);
    countParams.push(stage_id);
  }

  if (experience) {
    query += " AND c.experience >= ?";
    countQuery += " AND experience >= ?";
    params.push(experience);
    countParams.push(experience);
  }

  if (recruiter_id) {
    query += " AND c.recruiter_id = ?";
    countQuery += " AND recruiter_id = ?";
    params.push(recruiter_id);
    countParams.push(recruiter_id);
  }

  // Sorting
  switch (sortBy) {
    case "oldest":
      query += " ORDER BY c.id ASC";
      break;
    case "name_asc":
      query += " ORDER BY c.name ASC";
      break;
    case "name_desc":
      query += " ORDER BY c.name DESC";
      break;
    case "exp_high":
      query += " ORDER BY c.experience DESC";
      break;
    case "exp_low":
      query += " ORDER BY c.experience ASC";
      break;
    default:
      query += " ORDER BY c.id DESC"; // newest
  }

  // Get total count first
  db.query(countQuery, countParams, (countErr, countResult) => {
    if (countErr) return res.status(500).json(countErr);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    const currentPage = parseInt(page);
    
    query += " LIMIT " + parseInt(limit) + " OFFSET " + parseInt(offset);

    db.query(query, params, (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({
        candidates: result,
        total: total,
        page: currentPage,
        totalPages: totalPages
      });
    });
  });
});

router.put("/:id/status", verifyToken, (req, res) => {
  db.query(
    "UPDATE candidates SET status=? WHERE id=?",
    [req.body.status, req.params.id],
    () => res.json({ message: "Updated" })
  );
});

router.delete("/:id", verifyToken, (req, res) => {
  db.query("DELETE FROM candidates WHERE id=?", [req.params.id]);
  res.json({ message: "Deleted" });
});

router.post("/", verifyToken, upload.single("resume"), (req, res) => {
  const resume = req.file?.path || null;
  
  const { 
    name, email, phone, location, experience, 
    skills,
    job_role_id, client_id, office_mode_id, funnel_stage_id, contract_type_id,
    expected_ctc, current_ctc, job_location, submission_date, recruiter_id
  } = req.body;

  db.query(
    `INSERT INTO candidates (name, email, phone, location, experience, primary_skills, job_role_id, client_id, office_mode_id, funnel_stage_id, contract_type_id, expected_ctc, current_ctc, job_location, submission_date, recruiter_id, resume)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [name, email, phone, location, experience || 0, skills, job_role_id, client_id, office_mode_id, funnel_stage_id, contract_type_id, expected_ctc, current_ctc, job_location, submission_date, recruiter_id, resume],
    (err, result) => {
      if (err) {
        console.error("Error inserting candidate:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Candidate Added", id: result.insertId });
    }
  );
});

router.post("/:id/send-interview", verifyToken, async (req, res) => {
  const { subject, message } = req.body;

  db.query(
    "SELECT * FROM candidates WHERE id=?",
    [req.params.id],
    async (err, result) => {
      if (err || !result.length)
        return res.status(404).json({ message: "Candidate not found" });

      const candidate = result[0];

      await sendEmail(candidate.email, subject, message);

      res.json({ message: "Email sent successfully" });
    }
  );
});

router.post("/bulk", verifyToken, (req, res) => {
  const candidates = req.body;
  
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ message: "No candidates provided" });
  }

  const insertQuery = `
    INSERT INTO candidates (name, email, phone, location, experience, primary_skills, 
      job_role_id, client_id, office_mode_id, funnel_stage_id, contract_type_id, 
      expected_ctc, current_ctc, job_location, submission_date, recruiter_id)
    VALUES ?`;

  const values = candidates.map(c => [
    c.name || null, c.email || null, c.phone || null, c.location || null, 
    c.experience || 0, c.primary_skills || null,
    c.job_role_id || null, c.client_id || null, c.office_mode_id || null, 
    c.funnel_stage_id || null, c.contract_type_id || null,
    c.expected_ctc || null, c.current_ctc || null, c.job_location || null,
    c.submission_date || null, c.recruiter_id || null
  ]);

  db.query(insertQuery, [values], (err, result) => {
    if (err) {
      console.error("Bulk insert error:", err);
      return res.status(500).json({ message: "Failed to import candidates", error: err.message });
    }
    res.json({ message: `Successfully imported ${result.affectedRows} candidates` });
  });
});

router.post("/:id/send-offer", verifyToken, async (req, res) => {
  const { subject, message } = req.body;

  db.query(
    "SELECT * FROM candidates WHERE id=?",
    [req.params.id],
    async (err, result) => {
      if (!result.length)
        return res.status(404).json({ message: "Candidate not found" });

      const candidate = result[0];

      await sendEmail(candidate.email, subject, message);

      res.json({ message: "Offer email sent" });
    }
  );
});

export default router;