const { pool } = require("../db");
const {
  validateId,
  validatePagination,
  validateStudent,
  validateSearch,
  validateFilter
} = require("../validators/studentValidator");

/**
 * Get paginated students with optional search & filter
 * GET /students
 */
async function getAllStudents(req, res, next) {
  try {
    const paginationResult = validatePagination(req.query.page, req.query.limit);
    if (!paginationResult.valid) {
      return res.status(400).json({ error: paginationResult.error });
    }

    const { page, limit } = paginationResult;
    const offset = (page - 1) * limit;

    const { search, course, age } = req.query;

    const conditions = [];
    const values = [];

    // Optional search across name and email
    if (search && typeof search === "string" && search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length})`);
    }

    // Optional course filter
    if (course && typeof course === "string" && course.trim()) {
      values.push(`%${course.trim()}%`);
      conditions.push(`course ILIKE $${values.length}`);
    }

    // Optional age filter
    if (age !== undefined) {
      const ageNum = Number(age);
      if (!Number.isInteger(ageNum) || ageNum <= 0) {
        return res.status(400).json({ error: "Age must be a valid positive integer" });
      }
      values.push(ageNum);
      conditions.push(`age = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Total count for pagination metadata
    const countQuery = `SELECT COUNT(*) AS total FROM students ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const totalStudents = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalStudents / limit) || 1;

    // Fetch paginated records
    const dataValues = [...values, limit, offset];
    const dataQuery = `
      SELECT id, name, email, age, course, created_at
      FROM students
      ${whereClause}
      ORDER BY id DESC
      LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}
    `;

    const result = await pool.query(dataQuery, dataValues);

    res.json({
      page,
      limit,
      totalStudents,
      totalPages,
      students: result.rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single student by ID
 * GET /students/:id
 */
async function getStudentById(req, res, next) {
  try {
    const idValidation = validateId(req.params.id);
    if (!idValidation.valid) {
      return res.status(400).json({ error: idValidation.error });
    }

    const result = await pool.query(
      "SELECT id, name, email, age, course, created_at FROM students WHERE id = $1",
      [idValidation.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new student
 * POST /students
 */
async function createStudent(req, res, next) {
  try {
    const validation = validateStudent(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, email, age, course } = validation.data;

    // Check duplicate email
    const existing = await pool.query(
      "SELECT id FROM students WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const result = await pool.query(
      "INSERT INTO students (name, email, age, course) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, age, course]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

/**
 * Update a student
 * PUT /students/:id
 */
async function updateStudent(req, res, next) {
  try {
    const idValidation = validateId(req.params.id);
    if (!idValidation.valid) {
      return res.status(400).json({ error: idValidation.error });
    }

    const validation = validateStudent(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, email, age, course } = validation.data;

    // Check if student exists
    const existingStudent = await pool.query(
      "SELECT id FROM students WHERE id = $1",
      [idValidation.id]
    );
    if (existingStudent.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if another student has this email
    const duplicateEmail = await pool.query(
      "SELECT id FROM students WHERE LOWER(email) = LOWER($1) AND id != $2",
      [email, idValidation.id]
    );
    if (duplicateEmail.rows.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const result = await pool.query(
      "UPDATE students SET name = $1, email = $2, age = $3, course = $4 WHERE id = $5 RETURNING *",
      [name, email, age, course, idValidation.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a student
 * DELETE /students/:id
 */
async function deleteStudent(req, res, next) {
  try {
    const idValidation = validateId(req.params.id);
    if (!idValidation.valid) {
      return res.status(400).json({ error: idValidation.error });
    }

    const result = await pool.query(
      "DELETE FROM students WHERE id = $1 RETURNING *",
      [idValidation.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Student deleted successfully",
      student: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dedicated search endpoint
 * GET /students/search?name=... or ?q=... or ?email=...
 */
async function searchStudents(req, res, next) {
  try {
    const searchTerm = req.query.name || req.query.q || req.query.email;
    const validation = validateSearch(searchTerm);
    if (!validation.valid) {
      return res.status(400).json({ error: "Name is required" });
    }

    const queryPattern = `%${validation.search}%`;
    const result = await pool.query(
      "SELECT id, name, email, age, course, created_at FROM students WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY id ASC",
      [queryPattern]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

/**
 * Dedicated filter endpoint
 * GET /students/filter?course=...&age=...
 */
async function filterStudents(req, res, next) {
  try {
    const validation = validateFilter(req.query);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { course, age } = validation;
    let query = "SELECT id, name, email, age, course, created_at FROM students WHERE 1=1";
    const values = [];

    if (course) {
      values.push(`%${course}%`);
      query += ` AND course ILIKE $${values.length}`;
    }

    if (age !== null) {
      values.push(age);
      query += ` AND age = $${values.length}`;
    }

    query += " ORDER BY id ASC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

/**
 * Student statistics endpoint
 * GET /students/stats
 */
async function getStudentStats(req, res, next) {
  try {
    const totalResult = await pool.query("SELECT COUNT(*) AS total FROM students");
    const totalStudents = parseInt(totalResult.rows[0].total, 10) || 0;

    const averageResult = await pool.query("SELECT AVG(age) AS average_age FROM students");
    const rawAverage = averageResult.rows[0].average_age;
    const averageAge = rawAverage ? parseFloat(Number(rawAverage).toFixed(1)) : 0;

    const courseResult = await pool.query(
      "SELECT course, COUNT(*) AS count FROM students GROUP BY course ORDER BY count DESC, course ASC"
    );

    res.json({
      totalStudents,
      averageAge,
      courses: courseResult.rows.map(row => ({
        course: row.course,
        count: parseInt(row.count, 10)
      }))
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  searchStudents,
  filterStudents,
  getStudentStats
};
