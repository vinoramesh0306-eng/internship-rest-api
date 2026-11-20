const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize SQLite database & run schema
const dbPath = path.join(__dirname, "internships.db");
const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.exec(schemaSql, (err) => {
    if (err) console.error("Schema error:", err.message);
  });
});

function validateInternship(body, isUpdate = false) {
  const errors = [];
  const requiredFields = ["title", "company", "domain", "location", "mode", "stipend", "duration", "deadline"];

  if (!isUpdate) {
    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === "") {
        errors.push(`${field} is required`);
      }
    }
  }

  if (body.mode && !["Remote", "Hybrid", "On-site"].includes(body.mode)) {
    errors.push("mode must be one of: Remote, Hybrid, On-site");
  }

  return errors;
}

// GET /api/internships?page=1&limit=5
app.get("/api/internships", (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  db.get("SELECT COUNT(*) AS total FROM internships", (countErr, countRow) => {
    if (countErr) {
      return res.status(500).json({ error: "Database error", details: countErr.message });
    }

    db.all(
      "SELECT * FROM internships ORDER BY id DESC LIMIT ? OFFSET ?",
      [limit, offset],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: "Database error", details: err.message });
        }

        const total = countRow.total;
        res.json({
          data: rows,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }
    );
  });
});

// GET /api/internships/:id
app.get("/api/internships/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid internship ID" });
  }

  db.get("SELECT * FROM internships WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!row) return res.status(404).json({ error: "Internship not found" });
    res.json({ data: row });
  });
});

// POST /api/internships
app.post("/api/internships", (req, res) => {
  const errors = validateInternship(req.body, false);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const { title, company, domain, location, mode, stipend, duration, deadline, skills } = req.body;
  const skillsText = Array.isArray(skills) ? skills.join(", ") : String(skills || "");

  const sql = `
    INSERT INTO internships (title, company, domain, location, mode, stipend, duration, deadline, skills)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [title, company, domain, location, mode, stipend, duration, deadline, skillsText];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: "Failed to create internship" });

    db.get("SELECT * FROM internships WHERE id = ?", [this.lastID], (getErr, created) => {
      if (getErr) return res.status(500).json({ error: "Created but failed to fetch record" });
      res.status(201).json({ data: created });
    });
  });
});

// PUT /api/internships/:id
app.put("/api/internships/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid internship ID" });
  }

  const errors = validateInternship(req.body, false);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const { title, company, domain, location, mode, stipend, duration, deadline, skills } = req.body;
  const skillsText = Array.isArray(skills) ? skills.join(", ") : String(skills || "");

  const sql = `
    UPDATE internships
    SET title = ?, company = ?, domain = ?, location = ?, mode = ?, stipend = ?, duration = ?, deadline = ?, skills = ?
    WHERE id = ?
  `;
  const params = [title, company, domain, location, mode, stipend, duration, deadline, skillsText, id];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: "Failed to update internship" });
    if (this.changes === 0) return res.status(404).json({ error: "Internship not found" });

    db.get("SELECT * FROM internships WHERE id = ?", [id], (getErr, updated) => {
      if (getErr) return res.status(500).json({ error: "Updated but failed to fetch record" });
      res.json({ data: updated });
    });
  });
});

// DELETE /api/internships/:id
app.delete("/api/internships/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid internship ID" });
  }

  db.run("DELETE FROM internships WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: "Failed to delete internship" });
    if (this.changes === 0) return res.status(404).json({ error: "Internship not found" });
    res.json({ message: "Internship deleted", id });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
