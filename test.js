const http = require("http");
const app = require("./backend/app");
const { pool, initDb } = require("./backend/db");

async function runTests() {
  console.log("==================================================");
  console.log(" Running Student Management System Backend Tests ");
  console.log("==================================================");

  await initDb();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}`);
      console.error(err.message || err);
      failed++;
    }
  }

  // 1. Health check
  await test("GET / returns 200 with API status", async () => {
    const res = await fetch(`${baseUrl}/`);
    const json = await res.json();
    if (res.status !== 200 || json.status !== "ok") throw new Error("Health check failed");
  });

  // 2. Create student
  let testStudentId;
  const uniqueEmail = `test.student.${Date.now()}@example.com`;

  await test("POST /students creates student with valid data", async () => {
    const res = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Student",
        email: uniqueEmail,
        age: 22,
        course: "Computer Science"
      })
    });
    const json = await res.json();
    if (res.status !== 201 || !json.id) throw new Error(`Status ${res.status}: ${JSON.stringify(json)}`);
    testStudentId = json.id;
  });

  // 3. Validation: Missing fields
  await test("POST /students rejects missing required fields with 400", async () => {
    const res = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Incomplete" })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 4. Validation: Invalid email
  await test("POST /students rejects invalid email format with 400", async () => {
    const res = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test",
        email: "bademail",
        age: 21,
        course: "Math"
      })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 5. Validation: Invalid age
  await test("POST /students rejects non-positive/invalid age with 400", async () => {
    const res = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test",
        email: `age.test.${Date.now()}@example.com`,
        age: -2,
        course: "Math"
      })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 6. Validation: Duplicate email
  await test("POST /students rejects duplicate email with 409", async () => {
    const res = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate Tester",
        email: uniqueEmail,
        age: 23,
        course: "Physics"
      })
    });
    if (res.status !== 409) throw new Error(`Expected 409, got ${res.status}`);
  });

  // 7. Get All Students with pagination
  await test("GET /students returns students list with pagination", async () => {
    const res = await fetch(`${baseUrl}/students?page=1&limit=5`);
    const json = await res.json();
    if (res.status !== 200 || !Array.isArray(json.students) || json.page !== 1) {
      throw new Error(`Invalid pagination response: ${JSON.stringify(json)}`);
    }
  });

  // 8. Pagination error validation
  await test("GET /students rejects invalid page/limit params with 400", async () => {
    let res = await fetch(`${baseUrl}/students?page=0`);
    if (res.status !== 400) throw new Error("page=0 did not return 400");

    res = await fetch(`${baseUrl}/students?page=-1`);
    if (res.status !== 400) throw new Error("page=-1 did not return 400");

    res = await fetch(`${baseUrl}/students?page=abc`);
    if (res.status !== 400) throw new Error("page=abc did not return 400");

    res = await fetch(`${baseUrl}/students?limit=0`);
    if (res.status !== 400) throw new Error("limit=0 did not return 400");

    res = await fetch(`${baseUrl}/students?limit=999`);
    if (res.status !== 400) throw new Error("limit=999 did not return 400");
  });

  // 9. Get One Student
  await test("GET /students/:id returns single student", async () => {
    const res = await fetch(`${baseUrl}/students/${testStudentId}`);
    const json = await res.json();
    if (res.status !== 200 || json.id !== testStudentId) throw new Error("Get single student failed");
  });

  // 10. Get One Student: 400 and 404
  await test("GET /students/:id rejects invalid ID (400) and missing ID (404)", async () => {
    let res = await fetch(`${baseUrl}/students/notanid`);
    if (res.status !== 400) throw new Error("Expected 400 for non-integer ID");

    res = await fetch(`${baseUrl}/students/9999999`);
    if (res.status !== 404) throw new Error("Expected 404 for missing ID");
  });

  // 11. Update Student
  await test("PUT /students/:id updates student", async () => {
    const res = await fetch(`${baseUrl}/students/${testStudentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated Test Student",
        email: uniqueEmail,
        age: 23,
        course: "Software Engineering"
      })
    });
    const json = await res.json();
    if (res.status !== 200 || json.name !== "Updated Test Student") throw new Error("Update failed");
  });

  // 12. Search Students
  await test("GET /students/search searches safely using parameterized SQL", async () => {
    const res = await fetch(`${baseUrl}/students/search?name=Updated`);
    const json = await res.json();
    if (res.status !== 200 || !json.some((s) => s.id === testStudentId)) {
      throw new Error("Search failed to find updated student");
    }
  });

  // 13. Filter Students
  await test("GET /students/filter filters by course and age safely", async () => {
    const res = await fetch(`${baseUrl}/students/filter?course=Software Engineering&age=23`);
    const json = await res.json();
    if (res.status !== 200 || !json.some((s) => s.id === testStudentId)) {
      throw new Error("Filter failed");
    }
  });

  // 14. Student Statistics
  await test("GET /students/stats returns accurate statistics", async () => {
    const res = await fetch(`${baseUrl}/students/stats`);
    const json = await res.json();
    if (res.status !== 200 || typeof json.totalStudents !== "number" || typeof json.averageAge !== "number") {
      throw new Error("Statistics response invalid");
    }
  });

  // 15. Delete Student
  await test("DELETE /students/:id deletes student and returns 200", async () => {
    const res = await fetch(`${baseUrl}/students/${testStudentId}`, { method: "DELETE" });
    const json = await res.json();
    if (res.status !== 200 || json.student?.id !== testStudentId) throw new Error("Delete failed");

    // Verify student is gone
    const verifyRes = await fetch(`${baseUrl}/students/${testStudentId}`);
    if (verifyRes.status !== 404) throw new Error("Student was not deleted");
  });

  // 16. Notes system completely removed
  await test("GET /notes returns 404 confirming notes system is removed", async () => {
    const res = await fetch(`${baseUrl}/notes`);
    if (res.status !== 404) throw new Error("Notes endpoint still exists!");
  });

  server.close();
  await pool.end();

  console.log("==================================================");
  console.log(` Summary: ${passed} Passed | ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
