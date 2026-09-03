require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function migrate() {
    console.log("🚀 Starting database migration & enhancement...");
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Ensure students table exists with base columns
        await client.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                age INT NOT NULL,
                course VARCHAR(50) NOT NULL
            );
        `);

        // 2. Safely add rich columns to students without touching existing rows
        await client.query(`
            ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
            ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
            ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE;
            ALTER TABLE students ADD COLUMN IF NOT EXISTS department_id INTEGER;
            ALTER TABLE students ADD COLUMN IF NOT EXISTS gpa NUMERIC(3,2) DEFAULT 3.50;
            ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);

        // 3. Departments table
        await client.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                code VARCHAR(10) UNIQUE NOT NULL,
                description TEXT
            );
        `);

        // 4. Courses table
        await client.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                code VARCHAR(20) UNIQUE NOT NULL,
                title VARCHAR(100) NOT NULL,
                credits INT DEFAULT 3,
                department_id INT REFERENCES departments(id) ON DELETE SET NULL
            );
        `);

        // 5. Enrollments table
        await client.query(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id SERIAL PRIMARY KEY,
                student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                semester VARCHAR(20) DEFAULT 'Fall 2026',
                grade VARCHAR(5) DEFAULT 'A',
                status VARCHAR(20) DEFAULT 'Enrolled',
                enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_student_course_semester UNIQUE(student_id, course_id, semester)
            );
        `);

        // 5b. Users table for JWT authentication and RBAC
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'Student' CHECK (role IN ('Admin', 'Student')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 6. High performance B-tree indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
            CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
            CREATE INDEX IF NOT EXISTS idx_students_course ON students(course);
            CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
            CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);
        `);

        // 7. Seed Departments if empty
        const deptCount = await client.query("SELECT COUNT(*) FROM departments");
        if (parseInt(deptCount.rows[0].count, 10) === 0) {
            console.log("🌱 Seeding academic departments...");
            await client.query(`
                INSERT INTO departments (name, code, description) VALUES
                ('Computer Science & Engineering', 'CSE', 'Core computing, algorithms, and software architecture'),
                ('Artificial Intelligence & Data Science', 'AI', 'Machine learning, neural networks, and modern data analytics'),
                ('Information Technology', 'IT', 'Cloud infrastructure, networking, and enterprise web solutions'),
                ('Electronics & Communication', 'ECE', 'Embedded systems, IoT, and signal processing')
                ON CONFLICT (code) DO NOTHING;
            `);
        }

        // 8. Seed Courses if empty
        const courseCount = await client.query("SELECT COUNT(*) FROM courses");
        if (parseInt(courseCount.rows[0].count, 10) === 0) {
            console.log("🌱 Seeding academic courses...");
            await client.query(`
                INSERT INTO courses (code, title, credits, department_id) VALUES
                ('CS101', 'Data Structures & Algorithms', 4, 1),
                ('CS102', 'Database Management Systems', 3, 1),
                ('AI201', 'Machine Learning Fundamentals', 4, 2),
                ('IT301', 'Cloud Infrastructure & DevOps', 3, 3),
                ('EC201', 'Embedded Systems & IoT', 3, 4)
                ON CONFLICT (code) DO NOTHING;
            `);
        }

        // 9. Link existing students (Rahul, Aman, Priya) to departments if not yet linked
        await client.query(`
            UPDATE students SET department_id = 1, phone = '9876543210', gpa = 3.85 WHERE id = 1 AND (department_id IS NULL OR phone IS NULL);
            UPDATE students SET department_id = 2, phone = '9876543211', gpa = 3.70 WHERE id = 2 AND (department_id IS NULL OR phone IS NULL);
            UPDATE students SET department_id = 3, phone = '9876543212', gpa = 3.90 WHERE id = 3 AND (department_id IS NULL OR phone IS NULL);
        `);

        // 10. Seed sample enrollments if empty
        const enrollCount = await client.query("SELECT COUNT(*) FROM enrollments");
        if (parseInt(enrollCount.rows[0].count, 10) === 0) {
            console.log("🌱 Seeding course enrollments...");
            await client.query(`
                INSERT INTO enrollments (student_id, course_id, semester, grade, status) VALUES
                (1, 1, 'Fall 2026', 'A', 'Enrolled'),
                (1, 2, 'Fall 2026', 'A+', 'Enrolled'),
                (2, 3, 'Fall 2026', 'A', 'Enrolled'),
                (3, 4, 'Fall 2026', 'A+', 'Enrolled')
                ON CONFLICT (student_id, course_id, semester) DO NOTHING;
            `);
        }

        // 11. Seed default admin & student accounts
        const userCount = await client.query("SELECT COUNT(*) FROM users");
        if (parseInt(userCount.rows[0].count, 10) === 0) {
            console.log("🌱 Seeding default user accounts (admin & student)...");
            const adminHash = await bcrypt.hash("admin123", 10);
            const studentHash = await bcrypt.hash("student123", 10);
            await client.query(`
                INSERT INTO users (username, email, password_hash, role)
                VALUES
                ('admin', 'admin@edumanage.local', $1, 'Admin'),
                ('student', 'student@edumanage.local', $2, 'Student')
                ON CONFLICT (username) DO NOTHING;
            `, [adminHash, studentHash]);
        }

        await client.query("COMMIT");
        console.log("✅ Database migration and seeding finished successfully!");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Migration error:", err.message);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
