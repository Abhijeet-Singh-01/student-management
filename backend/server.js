const app = require("./app");
const { initDb } = require("./db");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Ensure database table and indexes exist
    await initDb();
    console.log("Database initialized and verified.");

    app.listen(PORT, () => {
      console.log(`Student Management API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message || error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
