// API service for communicating with Express backend

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Helper to handle fetch responses and error parsing
 */
async function handleResponse(response) {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `HTTP Error ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Fetch paginated list of students with optional search & filter
 */
export async function fetchStudents({ page = 1, limit = 10, search = "", course = "", age = "" } = {}) {
  const params = new URLSearchParams();
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  if (search && search.trim()) params.append("search", search.trim());
  if (course && course.trim()) params.append("course", course.trim());
  if (age !== "" && age !== null && age !== undefined) params.append("age", age);

  const res = await fetch(`${BASE_URL}/students?${params.toString()}`);
  return handleResponse(res);
}

/**
 * Fetch a single student by ID
 */
export async function fetchStudentById(id) {
  const res = await fetch(`${BASE_URL}/students/${id}`);
  return handleResponse(res);
}

/**
 * Create a new student
 */
export async function createStudent(studentData) {
  const res = await fetch(`${BASE_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData)
  });
  return handleResponse(res);
}

/**
 * Update an existing student
 */
export async function updateStudent(id, studentData) {
  const res = await fetch(`${BASE_URL}/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData)
  });
  return handleResponse(res);
}

/**
 * Delete a student by ID
 */
export async function deleteStudent(id) {
  const res = await fetch(`${BASE_URL}/students/${id}`, {
    method: "DELETE"
  });
  return handleResponse(res);
}

/**
 * Fetch system statistics
 */
export async function fetchStudentStats() {
  const res = await fetch(`${BASE_URL}/students/stats`);
  return handleResponse(res);
}
