import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db.js";

import crypto from "crypto";
import { sendSetPasswordEmail } from "../services/emailService.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, role, client } = req.body;

  try {
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const hashed = await bcrypt.hash(tempPassword, 10);

    let query = "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)";
    let values = [name, email, hashed, role];

    if (role === "client" && client) {
      query = "INSERT INTO users (name,email,password,role,client_id) VALUES (?,?,?,?,?)";
      values = [name, email, hashed, role, client];
    }

    db.query(query, values, async (err, result) => {
      if (err) return res.status(500).json({ message: "Error creating user", error: err });

      const token = jwt.sign(
        { id: result.insertId, email, purpose: "set_password" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      try {
        await sendSetPasswordEmail(email, name, token);
        res.json({ message: "User created and setup email sent" });
      } catch (emailErr) {
        console.error("Failed to send email:", emailErr);
        res.status(500).json({ message: "User created but email failed to send" });
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

router.post("/set-password", async (req, res) => {
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

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = result[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role });
  });
});

export default router;