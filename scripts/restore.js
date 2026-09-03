require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../src/config/db");

async function runRestore(targetFilePath) {
    console.log("♻️  Initiating database restore from snapshot...");
    const backupDir = path.join(__dirname, "..", "backups");

    let snapshotFile = targetFilePath;
    if (!snapshotFile) {
        if (!fs.existsSync(backupDir)) {
            console.error("❌ No backups directory found.");
            process.exit(1);
        }

        const files = fs.readdirSync(backupDir).filter(f => f.startsWith("snapshot-") && f.endsWith(".json"));
        if (files.length === 0) {
            console.error("❌ No snapshot files found in backups/ directory.");
            process.exit(1);
        }

        // Pick latest
        files.sort().reverse();
        snapshotFile = path.join(backupDir, files[0]);
    }

    console.log(`📖 Reading snapshot from: ${snapshotFile}`);
    const raw = fs.readFileSync(snapshotFile, "utf8");
    const snapshot = JSON.parse(raw);

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Restore Departments
        if (snapshot.tables.departments) {
            for (const d of snapshot.tables.departments) {
                await client.query(`
                    INSERT INTO departments (id, name, code, description)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        code = EXCLUDED.code,
                        description = EXCLUDED.description;
                `, [d.id, d.name, d.code, d.description]);
            }
            await client.query("SELECT setval(pg_get_serial_sequence('departments', 'id'), COALESCE((SELECT MAX(id) FROM departments), 1));");
        }

        // 2. Restore Courses
        if (snapshot.tables.courses) {
            for (const c of snapshot.tables.courses) {
                await client.query(`
                    INSERT INTO courses (id, code, title, credits, department_id)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO UPDATE SET
                        code = EXCLUDED.code,
                        title = EXCLUDED.title,
                        credits = EXCLUDED.credits,
                        department_id = EXCLUDED.department_id;
                `, [c.id, c.code, c.title, c.credits, c.department_id]);
            }
            await client.query("SELECT setval(pg_get_serial_sequence('courses', 'id'), COALESCE((SELECT MAX(id) FROM courses), 1));");
        }

        // 3. Restore Students
        if (snapshot.tables.students) {
            for (const s of snapshot.tables.students) {
                await client.query(`
                    INSERT INTO students (id, name, email, age, course, phone, status, enrollment_date, department_id, gpa)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        email = EXCLUDED.email,
                        age = EXCLUDED.age,
                        course = EXCLUDED.course,
                        phone = EXCLUDED.phone,
                        status = EXCLUDED.status,
                        enrollment_date = EXCLUDED.enrollment_date,
                        department_id = EXCLUDED.department_id,
                        gpa = EXCLUDED.gpa;
                `, [s.id, s.name, s.email, s.age, s.course, s.phone, s.status, s.enrollment_date, s.department_id, s.gpa]);
            }
            await client.query("SELECT setval(pg_get_serial_sequence('students', 'id'), COALESCE((SELECT MAX(id) FROM students), 1));");
        }

        // 4. Restore Users
        if (snapshot.tables.users) {
            for (const u of snapshot.tables.users) {
                await client.query(`
                    INSERT INTO users (id, username, email, password_hash, role)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO UPDATE SET
                        username = EXCLUDED.username,
                        email = EXCLUDED.email,
                        password_hash = EXCLUDED.password_hash,
                        role = EXCLUDED.role;
                `, [u.id, u.username, u.email, u.password_hash, u.role]);
            }
            await client.query("SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));");
        }

        await client.query("COMMIT");
        console.log("==================================================");
        console.log("✅ Database restoration completed successfully!");
        console.log("==================================================");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Restore failed:", err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    const specifiedPath = process.argv[2] || null;
    runRestore(specifiedPath);
}

module.exports = runRestore;
