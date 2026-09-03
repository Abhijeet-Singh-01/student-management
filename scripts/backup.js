require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../src/config/db");

async function runBackup() {
    console.log("💾 Initiating database backup snapshot...");
    const client = await pool.connect();

    try {
        const backupDir = path.join(__dirname, "..", "backups");
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const tables = ["departments", "courses", "students", "enrollments", "users"];
        const backupData = {
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            database: process.env.DB_NAME || "studentdb",
            tables: {},
            counts: {}
        };

        for (const table of tables) {
            const res = await client.query(`SELECT * FROM ${table} ORDER BY id ASC`);
            backupData.tables[table] = res.rows;
            backupData.counts[table] = res.rows.length;
            console.log(`  📦 Backed up ${table}: ${res.rows.length} records`);
        }

        const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `snapshot-${timestampStr}.json`;
        const filePath = path.join(backupDir, filename);

        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf8");

        console.log("==================================================");
        console.log(`✅ Backup successfully saved to: backups/${filename}`);
        console.log(`📊 Total Records: ${Object.values(backupData.counts).reduce((a, b) => a + b, 0)}`);
        console.log("==================================================");

        return filePath;
    } catch (err) {
        console.error("❌ Backup failed:", err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    runBackup();
}

module.exports = runBackup;
