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
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        const currentPage = page > 0 ? page : 1;
        const currentLimit = limit > 0 && limit <= 100 ? limit : 10;

        if (req.query.page && page < 1) {
            return res.status(400).json({
                error: "Page must be greater than 0"
            });
        }

        if (req.query.limit && (limit < 1 || limit > 100)) {
            return res.status(400).json({
                error: "Limit must be between 1 and 100"
            });
        }

        const offset = (currentPage - 1) * currentLimit;

        const result = await pool.query(
            "SELECT id, name, email, age, course FROM students ORDER BY id LIMIT $1 OFFSET $2",
            [currentLimit, offset]
        );

        res.json({
            page: currentPage,
            limit: currentLimit,
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
        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                error: "Name is required"
            });
        }

        const result = await pool.query(
            "SELECT id, name, email, age, course FROM students WHERE name ILIKE $1 ORDER BY id",
            [`%${name.trim()}%`]
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

         if(age !== undefined){
            const parseaAge = Number(age);

            if(!Number.isInteger(parseaAge) || parseaAge <=0){
                return res.status(400).json({
                    error:"Age must be a valid positive integer"
                });
            }
         }

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
            averageAge: averageResult.rows[0].average_age
                ? parseFloat(averageResult.rows[0].average_age
            )  :0,
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

        const id=Number(req.params.id);

        if(!Number.isInteger(id) || id<=0){
            return res.status(400).json({
                error : "ID must be a valid postive integer"
            });
        }
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

        const emailPattern =  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if(!emailPattern.test(email)){
            return res.status(400).json({
                error:"Invalid email format"
            });
        }

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


        const existingStudent=await pool.query(
            "SELECT id FROM students WHERE email = $1",
            [email]
        );

        if(existingStudent.rows.length > 0){
            return res.status(409).json({
                error:"Email already exists"
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

        const parseId=Number(id);

        if(!Number.isInteger(parseId) || parseId <=0){
            return res.status(400).json({
                error:"ID must be a valid positive integer"
            });
        }
        const { name, email, age, course } = req.body;

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!name || !email || !age || !course) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        if(!emailPattern.test(email)){
            return res.status(400).json({
                error:"Invalid email format"
            });
        }

        if(!Number.isInteger(Number(age)) || Number(age) <= 0){
            return res.status(400).json({
                error:"Age must be a valid positive integer"
            });
        }
        const result = await pool.query(
    "UPDATE students SET name = $1, email = $2, age = $3, course = $4 WHERE id = $5 RETURNING *",
    [name, email, age, course, parseId]
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
        const id = Number(req.params.id);

       if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error:"ID must be a valid positive integer"
            });
        }

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