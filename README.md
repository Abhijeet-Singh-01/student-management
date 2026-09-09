# Student Management System

A full-stack web application designed for educational institutions and administrators to manage student records, track academic programs, and analyze student demographics in real time.

---

## Overview

The **Student Management System** provides a centralized, secure platform for administrators to manage student enrollments. It connects a modern React web dashboard to a robust Node.js/Express REST API backed by a PostgreSQL relational database. 

With this system, administrators can quickly register new students, search and filter through student records, view detailed student profiles, update information with real-time validation, and monitor academic metrics like total enrollments, average student age, and department breakdown.

---

## Features

- **Student Directory & CRUD Operations**:
  - **Create**: Register new students with validated name, email, age, and course.
  - **Read All**: View all students in a responsive data table with pagination controls.
  - **Read One**: Inspect comprehensive student details in a dedicated profile view.
  - **Update**: Edit existing student records with pre-filled forms and duplicate email protection.
  - **Delete**: Remove student records safely with modal confirmation dialogs.

- **Search & Filtering**:
  - Live search across student names and email addresses using safe parameterized SQL (`ILIKE`).
  - Filter students by academic program / course.
  - Filter students by age.
  - Instant filter reset button.

- **Pagination**:
  - Configurable page size (5, 10, 20, 50 students per page).
  - Page navigation with Previous, Next, and direct page numbers.
  - Total records and total pages counter.
  - Robust validation against invalid, negative, or non-numeric page/limit inputs.

- **Real-Time Statistics Dashboard**:
  - Key Performance Indicators (KPIs): Total Enrolled Students, Average Student Age, and Active Programs count.
  - Visual course & department distribution breakdown with progress bars and percentage share.
  - Quick action shortcuts for common administrative workflows.

- **Input Validation & Error Handling**:
  - Client-side and server-side validation for all incoming inputs.
  - Strict format verification for email addresses and positive numeric checks for age (1–120).
  - Prevention of duplicate email addresses with `409 Conflict` responses.
  - Standard HTTP status codes (`200`, `201`, `400`, `404`, `409`, `500`).
  - Floating Toast alerts for instant success and error feedback.

---

## Tech Stack

- **Frontend**: React 19, Vite, Vanilla CSS with custom properties
- **Backend**: Node.js, Express 5, CORS, Dotenv
- **Database**: PostgreSQL 18 with `pg` connection pooling
- **Architecture**: REST API architecture with parameterized SQL queries

---

## Architecture

The system follows a clean 3-tier client-server architecture:

```
┌─────────────────────────┐
│     React Frontend      │  (Vite Dev Server :5173 / Production Build)
│   (Dashboard & UI)      │
└────────────┬────────────┘
             │  HTTP Requests (Fetch / JSON)
             ▼
┌─────────────────────────┐
│    Express REST API     │  (Node.js Server :3000)
│ (Routes & Controllers)  │
└────────────┬────────────┘
             │  Parameterized SQL Queries (pg Pool)
             ▼
┌─────────────────────────┐
│   PostgreSQL Database   │  (Port 5432 - studentdb)
│    (students Table)     │
└─────────────────────────┘
```

### How It Works:
1. **Frontend Request**: The React interface makes an asynchronous HTTP request using the native browser `fetch` API.
2. **Express Routing & Validation**: Express passes the request through validation middleware to ensure data integrity.
3. **Database Query**: The controller runs parameterized SQL queries against PostgreSQL using connection pooling, protecting against SQL injection vulnerabilities.
4. **Response**: Express sends a structured JSON response with appropriate HTTP status codes back to React to update the interface state.

---

## Project Structure

```
student-management/
├── backend/
│   ├── controllers/
│   │   └── studentController.js    # Business logic for all student actions
│   ├── db/
│   │   └── index.js                # PostgreSQL pool and auto-migration script
│   ├── middleware/
│   │   └── errorHandler.js         # Centralized error and 404 handler
│   ├── routes/
│   │   └── studentRoutes.js        # Express REST API endpoints routing
│   ├── validators/
│   │   └── studentValidator.js     # Request payload and parameter validation
│   ├── app.js                      # Express application setup and middleware
│   └── server.js                   # Server initialization and port listening
├── frontend/
│   ├── public/                     # Static assets and icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx    # Deletion confirmation dialog
│   │   │   ├── Dashboard.jsx       # Analytics cards and department breakdown
│   │   │   ├── Navbar.jsx          # Top navigation bar
│   │   │   ├── StudentDetailsModal.jsx # Single student profile modal
│   │   │   ├── StudentModal.jsx    # Add / Edit student form modal
│   │   │   ├── StudentTable.jsx    # Paginated data table with search and filters
│   │   │   └── Toast.jsx           # Success and error notifications
│   │   ├── services/
│   │   │   └── api.js              # Fetch client communicating with backend
│   │   ├── App.css                 # Responsive styling and animations
│   │   ├── App.jsx                 # Main state coordinator
│   │   ├── index.css               # CSS reset and variables
│   │   └── main.jsx                # React DOM root entrypoint
│   ├── index.html                  # HTML template
│   ├── package.json                # Frontend dependencies and Vite scripts
│   └── vite.config.js              # Vite server and API proxy configuration
├── .env.example                    # Sample environment variables
├── .gitignore                      # Git ignore rules for node_modules and secrets
├── db.js                           # Root DB export (backward-compatibility)
├── package.json                    # Root package scripts and dependencies
├── server.js                       # Root server entrypoint
└── test.js                         # Automated test suite (16 comprehensive tests)
```

---

## Database

The application uses PostgreSQL with a single normalized `students` table:

### `students` Table Schema

| Column       | Type                        | Constraints                           | Description                          |
|--------------|-----------------------------|---------------------------------------|--------------------------------------|
| `id`         | `SERIAL`                    | `PRIMARY KEY`                         | Auto-incrementing unique identifier  |
| `name`       | `VARCHAR(100)`              | `NOT NULL`                            | Student's full legal name            |
| `email`      | `VARCHAR(150)`              | `UNIQUE NOT NULL`                     | Student's unique email address       |
| `age`        | `INTEGER`                   | `NOT NULL, CHECK (age > 0)`           | Student's age (must be positive)     |
| `course`     | `VARCHAR(100)`              | `NOT NULL`                            | Department or study program          |
| `created_at` | `TIMESTAMP`                 | `DEFAULT CURRENT_TIMESTAMP`           | Date and time student was registered |

### Database Indexes
- `idx_students_course` on `course` (accelerates program filtering and stats aggregation)
- `idx_students_name` on `name` (accelerates search queries)

---

## API Endpoints

All endpoints return JSON and use standard HTTP response codes.

| Method   | Endpoint                  | Description                               | Query / Body Parameters                                    | Status Codes |
|----------|---------------------------|-------------------------------------------|------------------------------------------------------------|--------------|
| `GET`    | `/`                       | API health status check                   | None                                                       | `200`        |
| `GET`    | `/students`               | Get paginated students (supports filters) | `page` (int), `limit` (int), `search` (str), `course`, `age` | `200`, `400` |
| `GET`    | `/students/:id`           | Get a single student by ID                | `id` in URL                                                | `200`, `400`, `404` |
| `POST`   | `/students`               | Register a new student                    | Body: `{ "name", "email", "age", "course" }`               | `201`, `400`, `409` |
| `PUT`    | `/students/:id`           | Update an existing student                | Body: `{ "name", "email", "age", "course" }`               | `200`, `400`, `404`, `409` |
| `DELETE` | `/students/:id`           | Remove a student record                   | `id` in URL                                                | `200`, `400`, `404` |
| `GET`    | `/students/search`        | Search students by name or email          | `name` or `q` or `email`                                   | `200`, `400` |
| `GET`    | `/students/filter`        | Filter students by course and/or age      | `course`, `age`                                            | `200`, `400` |
| `GET`    | `/students/stats`         | Aggregate enrollment statistics           | None                                                       | `200`        |

---

## Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/Abhijeet-Singh-01/student-management.git
cd student-management
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
PORT=3000
DB_USER=postgres
DB_HOST=127.0.0.1
DB_NAME=studentdb
DB_PASSWORD=your_postgres_password
DB_PORT=5432
```

### 3. Install Dependencies
Install root and backend dependencies:
```bash
npm install
```

Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

### 4. Create the Database
Open PostgreSQL (`psql`) or your database GUI:
```sql
CREATE DATABASE studentdb;
```
*(The application will automatically create the `students` table and necessary indexes upon server startup).*

### 5. Run the Application

**To start the Backend API:**
```bash
npm start
# Server starts on http://localhost:3000
```

**To start the React Frontend:**
In a separate terminal:
```bash
npm run client
# Or:
cd frontend && npm run dev
# Vite runs on http://localhost:5173
```

Now open your browser and navigate to `http://localhost:5173`.

---

## Testing

The project includes an automated test suite verifying all 16 endpoint and validation rules:

```bash
npm test
```

### Test Suite Coverage:
- `GET /` health check
- `POST /students` successful creation
- `POST /students` validation: missing fields, invalid email format, negative age, duplicate email
- `GET /students` pagination and metadata calculation
- `GET /students` pagination validation: negative pages, page=0, non-numeric values, limit bounds
- `GET /students/:id` single record lookup, 404 for missing IDs, 400 for non-integer IDs
- `PUT /students/:id` updates and validation
- `GET /students/search` parameterized search
- `GET /students/filter` multi-criteria filtering
- `GET /students/stats` metrics calculation
- `DELETE /students/:id` deletion and cascade verification
- Confirmation that legacy `/notes` routes are completely eliminated (returns 404)

To build the React frontend for production:
```bash
npm run build:client
```
