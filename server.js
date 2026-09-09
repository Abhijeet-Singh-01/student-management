// Root server entry point - delegates to backend/server.js
const { app, startServer } = require("./backend/server");

if (require.main === module) {
  startServer();
}

module.exports = app;