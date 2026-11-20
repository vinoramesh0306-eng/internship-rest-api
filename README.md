# Internship REST API

A Node.js, Express, and SQLite REST API for managing internship listings with input validation and pagination.

## Project Structure

- `app.js` — Express server, validation, pagination, and CRUD endpoints
- `package.json` — Project metadata and dependencies (`express`, `sqlite3`)
- `schema.sql` — SQLite table schema for `internships`
- `seed.sql` — Sample internship records for testing
- `README.md` — Setup steps, database notes, and API examples

## Setup Instructions

1. Open a terminal in the project folder and install dependencies:
   ```bash
   npm install