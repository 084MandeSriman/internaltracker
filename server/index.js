import express from "express";
import cors from "cors";
import mysql from "mysql2";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import crypto from "crypto";
import nodemailer from "nodemailer";
import path from "path";
import { sendSetPasswordEmail } from "./services/emailService.js";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
    console.log("✅ 'uploads' folder created successfully.");
}

const upload = multer({ storage: storage });
// 🔐 VERIFY TOKEN MIDDLEWARE
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(403).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });

    req.user = decoded;
    next();
  });
};

// 🔐 ADMIN CHECK
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only access" });
  }
  next();
};

// 🔐 HR CHECK
const verifyHR = (req, res, next) => {
  if (req.user.role !== "hr" && req.user.role !== "admin") {
    return res.status(403).json({ message: "HR only access" });
  }
  next();
};

// 🔐 CLIENT CHECK
const verifyClient = (req, res, next) => {
  if (req.user.role !== "client" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Client only access" });
  }
  next();
};

// 📝 AUDIT LOG MIDDLEWARE
const logAudit = (action, entity_name) => {
  return (req, res, next) => {
    // We execute the DB insert after the request finishes to not block the response
    res.on("finish", () => {
      // We only care about successful writes (POST, PUT, DELETE) right now
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const user_id = req.user ? req.user.id : null;
        if (!user_id) return; // Can't log if not authenticated

        let entity_id = null;
        if (req.params.id) {
          entity_id = req.params.id;
        } else if (res.locals.insertedId) {
          entity_id = res.locals.insertedId;
        }

        const details = JSON.stringify({
          body: req.body,
          query: req.query,
          method: req.method,
          url: req.originalUrl
        });

        // Insert into audit_logs table. Assuming 'db' is available globally or within scope.
        // We will do this via the db object below.
        if (global.db) {
          global.db.query(
            "INSERT INTO audit_logs (user_id, action, entity_name, entity_id, details) VALUES (?, ?, ?, ?, ?)",
            [user_id, action, entity_name, entity_id, details],
            (err) => {
              if (err) console.error("Failed to log audit action:", err);
            }
          );
        }
      }
    });
    next();
  };
};

dotenv.config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error("DB Connection Failed:", err);
  } else {
    console.log("MySQL Connected");
    global.db = db; // Make available for audit logs
    
    // Auto-add missing columns one by one
    const columnsToAdd = [
      { name: 'primary_skills', type: 'TEXT' },
      { name: 'secondary_skills', type: 'TEXT' },
      { name: 'current_ctc', type: 'VARCHAR(50)' },
      { name: 'job_location', type: 'VARCHAR(100)' },
      { name: 'submission_date', type: 'DATE' }
    ];

    // Add each column individually with error handling
    columnsToAdd.forEach(({ name, type }) => {
      db.query(`ALTER TABLE candidates ADD COLUMN ${name} ${type}`, (err) => {
        if (err) {
          // Ignore "Duplicate column" errors
          if (!err.message.includes('Duplicate column')) {
            console.log(`Note: Column ${name}:`, err.message);
          }
        } else {
          console.log(`✅ Added column: ${name}`);
        }
      });
    });
    
    console.log("✅ Skills columns migration completed");
  }
});

// 📋 MASTER TABLES APIs
app.get("/master-data", verifyToken, async (req, res) => {
  try {
    const [roles] = await db.promise().query("SELECT * FROM job_roles");
    const [clients] = await db.promise().query("SELECT * FROM clients");
    const [funnelStages] = await db.promise().query("SELECT * FROM funnel_stages");
    const [contractTypes] = await db.promise().query("SELECT * FROM contract_types");
    const [officeModes] = await db.promise().query("SELECT * FROM office_modes");
    const [recruiters] = await db.promise().query("SELECT id, name FROM recruiters");

    res.json({
      job_roles: roles,
      clients: clients,
      funnel_stages: funnelStages,
      contract_types: contractTypes,
      office_modes: officeModes,
      recruiters: recruiters
    });
  } catch (err) {
    console.error("Error fetching master data:", err);
    res.status(500).json({ message: "Server error fetching master data", error: err });
  }
});

// 🏢 ADD CLIENT API
app.post("/clients", verifyToken, (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Client name is required" });
  }

  db.query(
    "INSERT INTO clients (name) VALUES (?)",
    [name],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: "Client already exists" });
        }
        return res.status(500).json({ message: "Error adding client", error: err });
      }
      res.json({ message: "Client added successfully", id: result.insertId, name });
    }
  );
});


app.get("/admin/users", verifyToken, verifyAdmin, (req, res) => {
  db.query(`
    SELECT u.id, u.name, u.email, u.role, u.client_id, c.name as client_name 
    FROM users u 
    LEFT JOIN clients c ON u.client_id = c.id
    ORDER BY u.id DESC
  `, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.put("/admin/users/:id", verifyToken, verifyAdmin, logAudit('UPDATE_USER', 'users'), async (req, res) => {
  const { name, email, role, client_id } = req.body;
  try {
    let finalClientId = client_id || null;
    if (role !== 'client') {
      finalClientId = null;
    }
    await db.promise().query(
      "UPDATE users SET name=?, email=?, role=?, client_id=? WHERE id=?",
      [name, email, role, finalClientId, req.params.id]
    );
    res.json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating user", error: err });
  }
});

app.delete("/admin/users/:id", verifyToken, verifyAdmin, logAudit('DELETE_USER', 'users'), async (req, res) => {
  try {
    await db.promise().query("DELETE FROM users WHERE id=?", [req.params.id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({ message: "Cannot delete user. They have associated records (e.g., login logs, candidates, etc)." });
    }
    res.status(500).json({ message: "Error deleting user", error: err });
  }
});

app.post("/register", async (req, res) => {
  const { name, email, role, client } = req.body;

  try {
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    let query = "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)";
    let values = [name, email, hashedPassword, role];

    if (role === "client" && client) {
      const [existingClients] = await db.promise().query("SELECT id FROM clients WHERE name = ?", [client]);
      let clientId;

      if (existingClients.length > 0) {
        clientId = existingClients[0].id;
      } else {
        const [newClient] = await db.promise().query("INSERT INTO clients (name) VALUES (?)", [client]);
        clientId = newClient.insertId;
      }

      query = "INSERT INTO users (name,email,password,role,client_id) VALUES (?,?,?,?,?)";
      values = [name, email, hashedPassword, role, clientId];
    }

    const [result] = await db.promise().query(query, values);

    const token = jwt.sign(
      { id: result.insertId, email, purpose: "set_password" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    try {
      await sendSetPasswordEmail(email, name, token);
      res.json({ message: "User created and setup email sent. ✅" });
    } catch (emailErr) {
      console.error("Failed to send email:", emailErr);
      res.status(201).json({ message: "User created successfully, but the setup email failed to send. Please contact an admin." });
    }

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "A user with this email already exists." });
    }
    res.status(500).json({ message: "Server error", error: err });
  }
});

app.post("/set-password", async (req, res) => {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "set_password") {
      return res.status(400).json({ message: "Invalid token" });
    }

    const hashed = await bcrypt.hash(password, 10);

    db.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashed, decoded.id],
      (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
        res.json({ message: "Password updated successfully" });
      }
    );
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});



app.post("/candidates/:id/send-interview", verifyToken, verifyHR, async (req, res) => {
  const { subject, message } = req.body;

  db.query(
    "SELECT * FROM candidates WHERE id=?",
    [req.params.id],
    async (err, result) => {
      if (err) return res.status(500).json(err);
      if (!result.length) return res.status(404).json({ message: "Candidate not found" });

      const candidate = result[0];

      try {
        await transporter.sendMail({
          from: `"Galacticos HR" <${process.env.EMAIL_USER}>`,
          to: candidate.email,
          subject: subject,
          html: message.replace(/\n/g, "<br>")
        });

        res.json({ message: "Interview email sent successfully" });
      } catch (emailErr) {
        console.error("Email Error:", emailErr);
        res.status(500).json({ message: "Failed to send email" });
      }
    }
  );
});

app.post("/candidates/:id/send-rejection", verifyToken, verifyHR, async (req, res) => {
  const { subject, message } = req.body;

  db.query("SELECT * FROM candidates WHERE id=?", [req.params.id], async (err, result) => {
    if (!result.length) return res.status(404).json({ message: "Candidate not found" });

    const candidate = result[0];

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: candidate.email,
      subject,
      html: message.replace(/\n/g, "<br>")
    });

    res.json({ message: "Rejection email sent" });
  });
});


app.post("/candidates/:id/send-offer", verifyToken, verifyHR, async (req, res) => {
  const { subject, message } = req.body;

  db.query("SELECT * FROM candidates WHERE id=?", [req.params.id], async (err, result) => {
    if (!result.length) return res.status(404).json({ message: "Candidate not found" });

    const candidate = result[0];

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: candidate.email,
      subject,
      html: message.replace(/\n/g, "<br>")
    });

    res.json({ message: "Offer email sent" });
  });
});

// 📊 DASHBOARD STATS API
app.get("/dashboard/stats", verifyToken, async (req, res) => {
  try {
    const isClient = req.user.role === 'client';
    const clientId = req.user.client_id;
    const params = isClient ? [clientId] : [];
    const clientCondition = isClient ? 'WHERE client_id = ?' : '';
    const andClientCondition = isClient ? 'AND c.client_id = ?' : '';

    // 1. Total Candidates
    const [[{ total_candidates }]] = await db.promise().query(`SELECT COUNT(*) AS total_candidates FROM candidates ${clientCondition}`, params);

    // 2. Open Positions / Job Roles count
    const [[{ open_positions }]] = await db.promise().query("SELECT COUNT(*) AS open_positions FROM job_roles");

    // 3. Candidates per role
    const [candidates_per_role] = await db.promise().query(`
      SELECT r.name as role, COUNT(c.id) as count
      FROM job_roles r
      LEFT JOIN candidates c ON c.job_role_id = r.id ${andClientCondition}
      GROUP BY r.id
    `, params);

    // 4. Funnel stats
    const [funnel_stats] = await db.promise().query(`
      SELECT f.name as stage, COUNT(c.id) as count
      FROM funnel_stages f
      LEFT JOIN candidates c ON c.funnel_stage_id = f.id ${andClientCondition}
      GROUP BY f.id
    `, params);

    // 5. Recent Candidates
    const [recent_candidates] = await db.promise().query(`
      SELECT c.name, r.name as role, f.name as status
      FROM candidates c
      LEFT JOIN job_roles r ON c.job_role_id = r.id
      LEFT JOIN funnel_stages f ON c.funnel_stage_id = f.id
      ${isClient ? 'WHERE c.client_id = ?' : ''}
      ORDER BY c.id DESC LIMIT 5
    `, params);

    // 6. Placements per client (Only for Admin/HR)
    let placements_per_client = [];
    if (!isClient) {
      const [pc] = await db.promise().query(`
        SELECT cl.name as client, COUNT(c.id) as count
        FROM clients cl
        LEFT JOIN candidates c ON c.client_id = cl.id 
        LEFT JOIN funnel_stages f ON c.funnel_stage_id = f.id
        WHERE f.name LIKE '%Hired%' OR f.name LIKE '%Select%' OR f.name LIKE '%Offer%'
        GROUP BY cl.id
        ORDER BY count DESC
      `);
      placements_per_client = pc;
    }

    // 7. Stuck in Interview > 7 days
    const [[{ stuck_candidates }]] = await db.promise().query(`
      SELECT COUNT(*) AS stuck_candidates 
      FROM candidates c
      JOIN funnel_stages f ON c.funnel_stage_id = f.id
      WHERE f.name LIKE '%Interview%' AND DATEDIFF(NOW(), c.updated_at) > 7 ${andClientCondition}
    `, params);

    // 8. Hiring Trends
    const [[{ hired_this_month }]] = await db.promise().query(`
      SELECT COUNT(*) AS hired_this_month 
      FROM candidates c
      JOIN funnel_stages f ON c.funnel_stage_id = f.id
      WHERE f.name LIKE '%Hired%' AND MONTH(c.updated_at) = MONTH(CURRENT_DATE()) AND YEAR(c.updated_at) = YEAR(CURRENT_DATE()) ${andClientCondition}
    `, params);

    // 9. Conversion Rate (Screening -> Selected)
    const [[{ total_screened }]] = await db.promise().query(`SELECT COUNT(*) AS total_screened FROM candidates ${clientCondition}`, params);
    const [[{ total_hired }]] = await db.promise().query(`
      SELECT COUNT(*) AS total_hired
      FROM candidates c
      JOIN funnel_stages f ON c.funnel_stage_id = f.id
      WHERE (f.name LIKE '%Hired%' OR f.name LIKE '%Offer%') ${andClientCondition}
    `, params);
    const conversion_rate = total_screened > 0 ? ((total_hired / total_screened) * 100).toFixed(1) : 0;

    res.json({
      total_candidates,
      open_positions,
      candidates_per_role,
      funnel_stats,
      recent_candidates,
      placements_per_client,
      stuck_candidates,
      hired_this_month,
      conversion_rate
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
});

// 📅 INTERVIEWS API
app.get("/interviews", verifyToken, (req, res) => {
  db.query(`
    SELECT i.*, c.name as candidate_name, c.role as candidate_role 
    FROM interviews i 
    JOIN candidates c ON i.candidate_id = c.id 
    ORDER BY i.scheduled_at ASC
  `, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/interviews", verifyToken, verifyHR, (req, res) => {
  const { candidate_id, interviewer_name, scheduled_at, meet_link } = req.body;
  if (!candidate_id || !scheduled_at) {
    return res.status(400).json({ message: "candidate_id and scheduled_at are required" });
  }

  db.query(
    "INSERT INTO interviews (candidate_id, interviewer_name, scheduled_at, meet_link) VALUES (?, ?, ?, ?)",
    [candidate_id, interviewer_name, scheduled_at, meet_link],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Interview scheduled successfully", id: result.insertId });
    }
  );
});

app.get("/candidates", verifyToken, (req, res) => {
  const { search, role_id, stage_id, client_id, location, experience, sortBy, page = 1 } = req.query;

  const limit = 10;
  const offset = (parseInt(page) - 1) * limit;

  let query = `
    SELECT 
      c.id, c.name, c.email, c.phone, c.location, c.experience, 
      c.primary_skills, c.secondary_skills,
      c.offer_status, c.expected_ctc, c.current_ctc, c.job_location, c.submission_date, c.created_at,
      c.resume_url, c.client_status, c.client_feedback,
      r.name AS role, r.id AS role_id,
      cl.name AS client, cl.id AS client_id,
      o.name AS office_mode, o.id AS office_mode_id,
      f.name AS status, f.id AS funnel_stage_id,
      ct.name AS contract_type, ct.id AS contract_type_id,
      rec.name AS recruiter
    FROM candidates c
    LEFT JOIN job_roles r ON c.job_role_id = r.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN office_modes o ON c.office_mode_id = o.id
    LEFT JOIN funnel_stages f ON c.funnel_stage_id = f.id
    LEFT JOIN contract_types ct ON c.contract_type_id = ct.id
    LEFT JOIN recruiters rec ON c.recruiter_id = rec.id
    WHERE 1=1
  `;
  
  // Build count query
  let countQuery = "SELECT COUNT(*) as total FROM candidates c WHERE 1=1";
  const params = [];
  const countParams = [];

  if (search) {
    query += " AND c.name LIKE ?";
    countQuery += " AND c.name LIKE ?";
    params.push(`%${search}%`);
    countParams.push(`%${search}%`);
  }

  if (role_id) {
    query += " AND c.job_role_id=?";
    countQuery += " AND c.job_role_id=?";
    params.push(role_id);
    countParams.push(role_id);
  }

  if (stage_id) {
    query += " AND c.funnel_stage_id=?";
    countQuery += " AND c.funnel_stage_id=?";
    params.push(stage_id);
    countParams.push(stage_id);
  }

  if (req.user.role === 'client') {
    query += " AND c.client_id=?";
    countQuery += " AND c.client_id=?";
    params.push(req.user.client_id);
    countParams.push(req.user.client_id);
  } else if (client_id) {
    query += " AND c.client_id=?";
    countQuery += " AND c.client_id=?";
    params.push(client_id);
    countParams.push(client_id);
  }

  if (location) {
    query += " AND c.location LIKE ?";
    countQuery += " AND c.location LIKE ?";
    params.push(`%${location}%`);
    countParams.push(`%${location}%`);
  }

  if (experience) {
    query += " AND c.experience >= ?";
    countQuery += " AND c.experience >= ?";
    params.push(experience);
    countParams.push(experience);
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

app.post("/candidates", verifyToken, verifyHR, upload.single("resume"), (req, res) => {
  const {
    name, email, phone, location, experience,
    primary_skills, secondary_skills,
    job_role_id, client_id, office_mode_id,
    funnel_stage_id, contract_type_id,
    offer_status, expected_ctc, current_ctc,
    job_location, submission_date, recruiter_id
  } = req.body;

  const resume_url = req.file ? req.file.path.replace(/\\/g, "/") : null;

  const sql = `
    INSERT INTO candidates 
    (name, email, phone, location, experience, primary_skills, secondary_skills, job_role_id, client_id, office_mode_id, funnel_stage_id, contract_type_id, offer_status, expected_ctc, current_ctc, job_location, submission_date, recruiter_id, resume_url)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  db.query(sql,
    [name, email, phone, location, experience || 0, primary_skills, secondary_skills, job_role_id, client_id, office_mode_id, funnel_stage_id, contract_type_id, offer_status || 'Pending', expected_ctc, current_ctc, job_location, submission_date, recruiter_id, resume_url],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Candidate Added" });
    }
  );
});

// 📥 EXCEL BULK IMPORT API
app.post("/candidates/bulk", verifyToken, verifyHR, (req, res) => {
  const candidates = req.body; // Expects an array of candidate objects

  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ message: "No data provided for bulk import" });
  }

  const sql = `
    INSERT INTO candidates 
    (name, email, phone, location, experience, job_role_id, client_id, office_mode_id, funnel_stage_id, contract_type_id, offer_status, current_ctc, expected_ctc, recruiter_id)
    VALUES ?
  `;

  const values = candidates.map(c => [
    c.name,
    c.email,
    c.phone,
    c.location,
    c.experience,
    c.job_role_id,
    c.client_id,
    c.office_mode_id,
    c.funnel_stage_id,
    c.contract_type_id,
    c.offer_status || 'Pending',
    c.current_ctc || '',
    c.expected_ctc || '',
    c.recruiter_id
  ]);

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error("Bulk Insert Error:", err);
      return res.status(500).json({ message: "Failed to import batch", error: err });
    }
    res.json({ message: `Successfully imported ${result.affectedRows} candidates.` });
  });
});

// 📚 ADD NEW REFERENCE DATA ENDPOINTS (Auto-create missing data during import)

// Add new job role
app.post("/reference/job-roles", verifyToken, verifyHR, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Job role name required" });

  db.query("INSERT INTO job_roles (name) VALUES (?)", [name], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: "Job role already exists" });
      }
      return res.status(500).json({ message: "Failed to add job role", error: err });
    }
    res.json({ id: result.insertId, name: name, message: "Job role added successfully" });
  });
});

// Add new client
app.post("/reference/clients", verifyToken, verifyHR, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Client name required" });

  db.query("INSERT INTO clients (name) VALUES (?)", [name], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: "Client already exists" });
      }
      return res.status(500).json({ message: "Failed to add client", error: err });
    }
    res.json({ id: result.insertId, name: name, message: "Client added successfully" });
  });
});

// Add new office mode
app.post("/reference/office-modes", verifyToken, verifyHR, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Office mode name required" });

  db.query("INSERT INTO office_modes (name) VALUES (?)", [name], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: "Office mode already exists" });
      }
      return res.status(500).json({ message: "Failed to add office mode", error: err });
    }
    res.json({ id: result.insertId, name: name, message: "Office mode added successfully" });
  });
});

// Add new contract type
app.post("/reference/contract-types", verifyToken, verifyHR, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Contract type name required" });

  db.query("INSERT INTO contract_types (name) VALUES (?)", [name], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: "Contract type already exists" });
      }
      return res.status(500).json({ message: "Failed to add contract type", error: err });
    }
    res.json({ id: result.insertId, name: name, message: "Contract type added successfully" });
  });
});

app.put("/candidates/:id/status", verifyToken, verifyHR, logAudit('UPDATE_CANDIDATE_STATUS', 'candidates'), (req, res) => {
  const { funnel_stage_id, rejection_reason } = req.body;

  db.query(
    "UPDATE candidates SET funnel_stage_id=?, rejection_reason=? WHERE id=?",
    [funnel_stage_id, rejection_reason || null, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Status updated successfully" });
    }
  );
});


app.get("/candidates/:id", verifyToken, verifyHR, (req, res) => {
  const query = `
    SELECT 
      c.*,
      r.name AS role,
      cl.name AS client,
      o.name AS office_mode,
      f.name AS status,
      ct.name AS contract_type,
      rec.name AS recruiter
    FROM candidates c
    LEFT JOIN job_roles r ON c.job_role_id = r.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN office_modes o ON c.office_mode_id = o.id
    LEFT JOIN funnel_stages f ON c.funnel_stage_id = f.id
    LEFT JOIN contract_types ct ON c.contract_type_id = ct.id
    LEFT JOIN recruiters rec ON c.recruiter_id = rec.id
    WHERE c.id = ?
  `;

  db.query(query, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.length) return res.status(404).json({ message: "Candidate not found" });

    // Check client authorization
    if (req.user.role === 'client' && result[0].client_id !== req.user.client_id) {
      return res.status(403).json({ message: "Client only access" });
    }

    res.json(result[0]);
  });
});

app.put("/candidates/:id", verifyToken, verifyAdmin, upload.single("resume"), logAudit('UPDATE_CANDIDATE', 'candidates'), (req, res) => {
  const {
    name, email, phone, location, experience,
    job_role_id, client_id, office_mode_id,
    funnel_stage_id, contract_type_id,
    offer_status, expected_ctc, current_ctc, job_location, recruiter_id
  } = req.body;

  const resume_url = req.file ? req.file.path.replace(/\\/g, "/") : null;

  let sql = `
    UPDATE candidates 
    SET name=?, email=?, phone=?, location=?, experience=?, job_role_id=?, client_id=?, office_mode_id=?, funnel_stage_id=?, contract_type_id=?, offer_status=?, expected_ctc=?, current_ctc=?, job_location=?, recruiter_id=?
  `;
  const params = [
    name, email, phone, location, experience, job_role_id, client_id, office_mode_id, funnel_stage_id, contract_type_id, offer_status || 'Pending', expected_ctc, current_ctc, job_location, recruiter_id
  ];

  // Add resume_url to the query if a new file was uploaded
  if (resume_url) {
    sql += ", resume_url = ?";
    params.push(resume_url);
  }

  sql += " WHERE id = ?";
  params.push(req.params.id);

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Candidate updated successfully" });
  });
});

app.put("/candidates/:id/client-feedback", verifyToken, verifyClient, logAudit('UPDATE_CLIENT_FEEDBACK', 'candidates'), (req, res) => {
  const { client_status, client_feedback } = req.body;
  if (!['Pending', 'Approved', 'Rejected'].includes(client_status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  // Make sure the client only updates their assigned candidates
  db.query(
    "UPDATE candidates SET client_status=?, client_feedback=? WHERE id=? AND client_id=?",
    [client_status, client_feedback || null, req.params.id, req.user.client_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0) return res.status(404).json({ message: "Candidate not found or unauthorized" });
      res.json({ message: "Feedback submitted successfully" });
    }
  );
});

app.delete("/candidates/:id", verifyToken, verifyAdmin, logAudit('DELETE_CANDIDATE', 'candidates'), (req, res) => {
  db.query(
    "DELETE FROM candidates WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Candidate deleted" });
    }
  );
});

// ==========================================
// 💬 COMMENTS APIs
// ==========================================

// Create candidate_comments table if not exists
db.query(`
  CREATE TABLE IF NOT EXISTS candidate_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) console.error("Error creating candidate_comments table:", err);
  else console.log("candidate_comments table ready");
});

// ➕ Add Comment API
app.post("/candidates/:id/comments", verifyToken, (req, res) => {
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ message: "Comment required" });

  db.query(
    "INSERT INTO candidate_comments (candidate_id, user_id, comment) VALUES (?, ?, ?)",
    [req.params.id, req.user.id, comment],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Comment added" });
    }
  );
});

// 📥 Get Comments API
app.get("/candidates/:id/comments", verifyToken, (req, res) => {
  db.query(`
    SELECT cc.*, u.name as user_name, u.role
    FROM candidate_comments cc
    JOIN users u ON cc.user_id = u.id
    WHERE cc.candidate_id=?
    ORDER BY cc.created_at DESC
  `, [req.params.id], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});


app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const ip_address = req.ip || req.connection?.remoteAddress || 'unknown';

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, results) => {

      // 1️⃣ Check database error
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      // 2️⃣ Check if user exists
      if (!results || results.length === 0) {
        db.query("INSERT INTO login_logs (user_id, ip_address, status) VALUES (?, ?, ?)", [null, ip_address, "FAILED_USER_NOT_FOUND"]);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = results[0];

      // 3️⃣ Compare password
      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        db.query("INSERT INTO login_logs (user_id, ip_address, status) VALUES (?, ?, ?)", [user.id, ip_address, "FAILED_PASSWORD"]);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      db.query("INSERT INTO login_logs (user_id, ip_address, status) VALUES (?, ?, ?)", [user.id, ip_address, "SUCCESS"]);

      // 4️⃣ Create JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role, client_id: user.client_id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // 5️⃣ Send token
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
          client_id: user.client_id
        }
      });
    }
  );
});


// ==========================================
// 🛡️ ADMIN & SECURITY APIS
// ==========================================

// 📊 Admin Analytics
app.get("/admin/analytics", verifyToken, verifyAdmin, async (req, res) => {
  try {
    // 1. Rejection Reasons
    const [rejection_analytics] = await db.promise().query(`
      SELECT rejection_reason, COUNT(*) as count 
      FROM candidates 
      WHERE rejection_reason IS NOT NULL 
      GROUP BY rejection_reason
    `);

    // 2. Avg Time to Hire (in days)
    const [[{ avg_time_to_hire }]] = await db.promise().query(`
      SELECT AVG(DATEDIFF(updated_at, created_at)) as avg_time_to_hire 
      FROM candidates c
      JOIN funnel_stages f ON c.funnel_stage_id = f.id
      WHERE f.name LIKE '%Hired%' OR f.name LIKE '%Offer%'
    `);

    // 3. Funnel Drop-off %
    const [funnel_counts] = await db.promise().query(`
      SELECT f.name as stage, COUNT(c.id) as count
      FROM funnel_stages f
      LEFT JOIN candidates c ON c.funnel_stage_id = f.id
      GROUP BY f.id
      ORDER BY f.id
    `);

    // 4. Best Recruiter Performance (Candidates successfully hired)
    const [best_recruiters] = await db.promise().query(`
      SELECT r.name, COUNT(c.id) as hires
      FROM recruiters r
      JOIN candidates c ON c.recruiter_id = r.id
      JOIN funnel_stages f ON c.funnel_stage_id = f.id
      WHERE f.name LIKE '%Hired%' OR f.name LIKE '%Offer%'
      GROUP BY r.id
      ORDER BY hires DESC
      LIMIT 5
    `);

    res.json({
      rejection_analytics,
      avg_time_to_hire: avg_time_to_hire ? Math.round(avg_time_to_hire) : 0,
      funnel_counts,
      best_recruiters
    });
  } catch (err) {
    console.error("Admin Analytics Error:", err);
    res.status(500).json({ message: "Error fetching admin analytics" });
  }
});

// 📜 Audit Logs
app.get("/admin/audit-logs", verifyToken, verifyAdmin, (req, res) => {
  db.query(`
    SELECT a.*, u.name as user_name 
    FROM audit_logs a 
    LEFT JOIN users u ON a.user_id = u.id 
    ORDER BY a.created_at DESC LIMIT 100
  `, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// 🔐 Login Logs
app.get("/admin/login-logs", verifyToken, verifyAdmin, (req, res) => {
  db.query(`
    SELECT l.*, u.name as user_name, u.email 
    FROM login_logs l 
    LEFT JOIN users u ON l.user_id = u.id 
    ORDER BY l.login_time DESC LIMIT 100
  `, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// 👥 Update User Role (Admin Only)
app.put("/admin/users/:id/role", verifyToken, verifyAdmin, logAudit('UPDATE_USER_ROLE', 'users'), (req, res) => {
  const { role } = req.body;
  if (!['admin', 'hr', 'client'].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  db.query("UPDATE users SET role=? WHERE id=?", [role, req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Role updated successfully" });
  });
});

// 🏢 Subscriptions Management
app.get("/admin/subscriptions", verifyToken, verifyAdmin, (req, res) => {
  db.query(`
    SELECT s.*, c.name as client_name 
    FROM subscriptions s 
    JOIN clients c ON s.client_id = c.id
  `, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/admin/subscriptions", verifyToken, verifyAdmin, logAudit('CREATE_SUBSCRIPTION', 'subscriptions'), (req, res) => {
  const { client_id, plan_name, end_date } = req.body;
  db.query(
    "INSERT INTO subscriptions (client_id, plan_name, end_date) VALUES (?, ?, ?)",
    [client_id, plan_name, end_date || null],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Subscription added", id: result.insertId });
    }
  );
});

// 🔑 Password Reset flows

app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000); // 1 hour

  db.query("UPDATE users SET reset_token=?, reset_token_expiry=? WHERE email=?", [token, expiry, email], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });

    // In a real app, send email here. We simulate by returning the token.
    console.log(`[SIMULATED EMAIL] Reset link for ${email}: http://localhost:5173/reset-password?token=${token}`);
    res.json({ message: "If the email is registered, a reset link will be sent" });
  });
});

app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: "Missing required fields" });

  db.query("SELECT id FROM users WHERE reset_token=? AND reset_token_expiry > NOW()", [token], async (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(400).json({ message: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.query("UPDATE users SET password=?, reset_token=NULL, reset_token_expiry=NULL WHERE id=?", [hashedPassword, results[0].id], (updateErr) => {
      if (updateErr) return res.status(500).json(updateErr);
      res.json({ message: "Password updated successfully" });
    });
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));