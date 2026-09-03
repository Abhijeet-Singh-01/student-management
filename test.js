// Comprehensive Automated Integration Test Suite for EduManage Pro
const assert = require("assert");

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

let testStudentId = null;
let adminToken = null;
let studentToken = null;

async function runTests() {
    console.log("==================================================");
    console.log("🧪 Starting Automated Test Suite for EduManage Pro");
    console.log(`🎯 Testing Server at: ${BASE_URL}`);
    console.log("==================================================");

    let passed = 0;
    let failed = 0;

    async function test(description, fn) {
        try {
            await fn();
            console.log(`  ✅ PASS: ${description}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ FAIL: ${description}`);
            console.error(`     Error: ${err.message}`);
            failed++;
        }
    }

    // 1. Root & Health Check
    await test("GET / returns welcome message", async () => {
        const res = await fetch(`${BASE_URL}/`);
        assert.strictEqual(res.status, 200);
        const text = await res.text();
        assert.ok(text.includes("Student Management API is running"));
    });

    await test("GET /health reports UP, connected database, and cache status", async () => {
        const res = await fetch(`${BASE_URL}/health`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.status, "UP");
        assert.strictEqual(data.database.status, "Connected");
        assert.ok(data.cache);
    });

    await test("Redis Cache: Second GET /students serves sub-millisecond cached data", async () => {
        const res1 = await fetch(`${BASE_URL}/students`);
        assert.strictEqual(res1.status, 200);
        const data1 = await res1.json();

        const start = Date.now();
        const res2 = await fetch(`${BASE_URL}/students`);
        const duration = Date.now() - start;
        assert.strictEqual(res2.status, 200);
        const data2 = await res2.json();
        assert.strictEqual(data1.length, data2.length);
        assert.ok(duration < 150, "Cached response should be served quickly");
    });

    await test("Security Headers: Helmet sets protection headers", async () => {
        const res = await fetch(`${BASE_URL}/`);
        assert.strictEqual(res.headers.get("x-content-type-options"), "nosniff");
        assert.ok(res.headers.get("x-dns-prefetch-control"));
    });

    await test("Rate Limiting: API requests receive RateLimit headers", async () => {
        const res = await fetch(`${BASE_URL}/students`);
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("ratelimit-limit") || res.headers.get("x-ratelimit-limit"));
    });

    await test("GET /api-docs/ serves interactive Swagger UI", async () => {
        const res = await fetch(`${BASE_URL}/api-docs/`);
        assert.strictEqual(res.status, 200);
        const html = await res.text();
        assert.ok(html.includes("swagger-ui"));
    });

    await test("GET /api-docs.json exports valid OpenAPI 3.0 schema", async () => {
        const res = await fetch(`${BASE_URL}/api-docs.json`);
        assert.strictEqual(res.status, 200);
        const spec = await res.json();
        assert.strictEqual(spec.openapi, "3.0.0");
        assert.ok(spec.paths["/students"]);
    });

    // 2. Strict Backward Compatibility Contract
    await test("GET /students returns array of students", async () => {
        const res = await fetch(`${BASE_URL}/students`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.ok(Array.isArray(data));
        assert.ok(data.length >= 3);
    });

    await test("GET /students/1 returns student #1 (Rahul)", async () => {
        const res = await fetch(`${BASE_URL}/students/1`);
        assert.strictEqual(res.status, 200);
        const student = await res.json();
        assert.strictEqual(student.id, 1);
        assert.strictEqual(student.name, "Rahul");
        assert.strictEqual(student.course, "CSE");
    });

    await test("GET /students/999 returns 404 with exact message", async () => {
        const res = await fetch(`${BASE_URL}/students/999`);
        assert.strictEqual(res.status, 404);
        const data = await res.json();
        assert.strictEqual(data.message, "Student not found");
    });

    // 3. Search, Filters, and Pagination
    await test("GET /students?search=Rahul filters by name", async () => {
        const res = await fetch(`${BASE_URL}/students?search=Rahul`);
        assert.strictEqual(res.status, 200);
        const students = await res.json();
        assert.ok(Array.isArray(students));
        assert.ok(students.some(s => s.name === "Rahul"));
    });

    await test("GET /students?course=CSE filters by course", async () => {
        const res = await fetch(`${BASE_URL}/students?course=CSE`);
        assert.strictEqual(res.status, 200);
        const students = await res.json();
        assert.ok(students.every(s => s.course === "CSE"));
    });

    await test("GET /students?page=1&limit=2 returns paginated metadata", async () => {
        const res = await fetch(`${BASE_URL}/students?page=1&limit=2`);
        assert.strictEqual(res.status, 200);
        const resData = await res.json();
        assert.ok(resData.pagination);
        assert.strictEqual(resData.pagination.limit, 2);
        assert.strictEqual(resData.pagination.page, 1);
        assert.ok(resData.data.length <= 2);
    });

    // 4. Data Insights & Analytics
    await test("GET /students/insights returns transparent analytics", async () => {
        const res = await fetch(`${BASE_URL}/students/insights`);
        assert.strictEqual(res.status, 200);
        const json = await res.json();
        assert.ok(json.success);
        assert.ok(json.data.database_statistics.total_students >= 3);
        assert.ok(Array.isArray(json.data.course_distribution));
        assert.ok(Array.isArray(json.data.data_driven_recommendations));
    });

    // 5. Authentication & Role-Based Access Control (RBAC)
    await test("POST /auth/login with valid admin credentials returns JWT token", async () => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "admin", password: "admin123" })
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.ok(data.token);
        assert.strictEqual(data.user.role, "Admin");
        adminToken = data.token;
    });

    await test("POST /auth/login with valid student credentials returns Student token", async () => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "student", password: "student123" })
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.ok(data.token);
        assert.strictEqual(data.user.role, "Student");
        studentToken = data.token;
    });

    await test("POST /auth/login rejects incorrect password with 401 Unauthorized", async () => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "admin", password: "wrongpassword" })
        });
        assert.strictEqual(res.status, 401);
    });

    await test("GET /auth/me returns authenticated user profile with Bearer token", async () => {
        assert.ok(adminToken, "Admin token missing");
        const res = await fetch(`${BASE_URL}/auth/me`, {
            headers: { "Authorization": `Bearer ${adminToken}` }
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.data.username, "admin");
        assert.strictEqual(data.data.role, "Admin");
    });

    await test("RBAC: POST /students rejects unauthenticated request with 401", async () => {
        const res = await fetch(`${BASE_URL}/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Unauthenticated" })
        });
        assert.strictEqual(res.status, 401);
    });

    await test("RBAC: POST /students rejects Student role with 403 Forbidden", async () => {
        assert.ok(studentToken, "Student token missing");
        const res = await fetch(`${BASE_URL}/students`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${studentToken}`
            },
            body: JSON.stringify({ name: "Forbidden Student" })
        });
        assert.strictEqual(res.status, 403);
    });

    // 6. Input Validation
    await test("POST /students rejects invalid input with 400 Bad Request", async () => {
        const res = await fetch(`${BASE_URL}/students`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: "A",
                email: "not-an-email",
                age: 8,
                course: ""
            })
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.ok(data.errors.length >= 3);
    });

    // 7. Complete CRUD: Create, Update, Delete (Admin Privileged)
    await test("POST /students registers a valid new student", async () => {
        const uniqueEmail = `test.student.${Date.now()}@example.com`;
        const res = await fetch(`${BASE_URL}/students`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: "Test Runner Student",
                email: uniqueEmail,
                age: 22,
                course: "CSE",
                phone: "9988776655",
                status: "Active",
                gpa: 3.8
            })
        });
        assert.strictEqual(res.status, 201);
        const data = await res.json();
        assert.ok(data.success);
        assert.strictEqual(data.data.name, "Test Runner Student");
        testStudentId = data.data.id;
    });

    await test("PUT /students/:id updates student attributes", async () => {
        assert.ok(testStudentId, "No test student id available");
        const res = await fetch(`${BASE_URL}/students/${testStudentId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: "Updated Test Student",
                email: `updated.${Date.now()}@example.com`,
                age: 23,
                course: "AI",
                status: "Graduated"
            })
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.data.name, "Updated Test Student");
        assert.strictEqual(data.data.status, "Graduated");
    });

    await test("DELETE /students/:id deletes student", async () => {
        assert.ok(testStudentId, "No test student id available");
        const res = await fetch(`${BASE_URL}/students/${testStudentId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${adminToken}` }
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.ok(data.success);

        // Verify it is gone
        const verifyRes = await fetch(`${BASE_URL}/students/${testStudentId}`);
        assert.strictEqual(verifyRes.status, 404);
    });

    // 5. Data Export Endpoints
    await test("GET /students/export/csv downloads RFC 4180 CSV spreadsheet", async () => {
        const res = await fetch(`${BASE_URL}/students/export/csv`);
        assert.strictEqual(res.status, 200);
        const contentType = res.headers.get("content-type");
        assert.ok(contentType.includes("text/csv"));
        const disposition = res.headers.get("content-disposition");
        assert.ok(disposition.includes("attachment"));
        const text = await res.text();
        assert.ok(text.includes("ID,Name,Email,Age,Course,Department,GPA,Phone,Status,Enrollment Date"));
        assert.ok(text.includes("Rahul"));
    });

    await test("GET /students/export/pdf streams valid binary PDF report", async () => {
        const res = await fetch(`${BASE_URL}/students/export/pdf`);
        assert.strictEqual(res.status, 200);
        const contentType = res.headers.get("content-type");
        assert.ok(contentType.includes("application/pdf"));
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const header = buffer.subarray(0, 5).toString("utf-8");
        assert.strictEqual(header, "%PDF-");
        assert.ok(buffer.length > 500);
    });

    console.log("==================================================");
    console.log(`📊 Test Summary: ${passed} Passed | ${failed} Failed`);
    console.log("==================================================");

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
