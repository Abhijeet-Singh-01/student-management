require("dotenv").config();

const express = require("express");
const pool = require("./db");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Student Management API is running");
});

app.get("/students", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const offset = (page - 1) * limit;

        const result = await pool.query(
            "SELECT id, name, email, age, course FROM students ORDER BY id LIMIT $1 OFFSET $2",
            [limit, offset]
        );

        res.json({
            page: page,
            limit: limit,
            students: result.rows
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Failed to fetch students"
        });
    }
});

app.get("/students/search", async (req, res) => {
    try {
        const name = req.query.name;

        const result = await pool.query(
            "SELECT id, name, email, age, course FROM students WHERE name ILIKE $1 ORDER BY id",
            [`%${name}%`]
        );

        res.json(result.rows);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Failed to search students"
        });
    }
});

app.get("/students/filter", async (req, res) => {
    try {
        const { course, age } = req.query;

        let query = "SELECT id, name, email, age, course FROM students WHERE 1=1";
        let values = [];

        if (course) {
            values.push(course);
            query += ` AND course ILIKE $${values.length}`;
        }

        if (age) {
            values.push(age);
            query += ` AND age = $${values.length}`;
        }

        query += " ORDER BY id";

        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Failed to filter students"
        });
    }
});

app.get("/students/stats", async (req, res) => {
    try {
        const totalResult = await pool.query(
            "SELECT COUNT(*) AS total FROM students"
        );

        const averageResult = await pool.query(
            "SELECT AVG(age) AS average_age FROM students"
        );

        const courseResult = await pool.query(
            "SELECT course, COUNT(*) AS count FROM students GROUP BY course ORDER BY course"
        );

        res.json({
            totalStudents: parseInt(totalResult.rows[0].total),
            averageAge: parseFloat(averageResult.rows[0].average_age),
            courses: courseResult.rows
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Failed to fetch student statistics"
        });
    }
});

app.get("/students/:id", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, email, age, course FROM students WHERE id = $1",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Failed to fetch student"
        });
    }
});

app.post("/students", async (req, res) => {
    try {
        const { name, email, age, course } = req.body;

        if (!name || !email || !age || !course) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        if (age <= 0) {
            return res.status(400).json({
                error: "age must be greater than 0"
            });
        }

        const result = await pool.query(
            "INSERT INTO students (name, email, age, course) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, age, course]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Failed to create student"
        });
    }
});

app.put("/students/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { name, email, age, course } = req.body;

        if (!name || !email || !age || !course) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        if (age <= 0) {
            return res.status(400).json({
                error: "age must be greater than 0"
            });
        }

        const result = await pool.query(
            "UPDATE students SET name = $1, email = $2, age = $3, course = $4 WHERE id = $5 RETURNING *",
            [name, email, age, course, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Failed to update student"
        });
    }
});

app.delete("/students/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const result = await pool.query(
            "DELETE FROM students WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json({
            message: "Student deleted successfully",
            student: result.rows[0]
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Failed to delete student"
        });
    }
});

app.use((err, req, res, next) => {
    console.log(err);

    res.status(500).json({
        error: "Something went wrong on the server"
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`server running on port ${PORT}`);
    });
}

module.exports = app;