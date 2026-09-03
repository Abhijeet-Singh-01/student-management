/**
 * OpenAPI 3.0.0 Specification for EduManage Pro
 */

const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "EduManage Pro API",
        version: "1.0.0",
        description: "Production-grade, enterprise Student Management and Academic Insights REST API with PostgreSQL.",
        contact: {
            name: "EduManage Engineering Team",
            email: "support@edumanage.local"
        }
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Local Development Server"
        }
    ],
    tags: [
        { name: "System", description: "Root greeting and service health diagnostics" },
        { name: "Authentication", description: "JWT login, account registration, and user profile" },
        { name: "Students", description: "Student lifecycle, search, pagination, and analytics" },
        { name: "Academic Lookups", description: "Reference departments and catalog courses" }
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Enter your JWT token obtained from POST /auth/login (e.g. admin / admin123)"
            }
        }
    },
    paths: {
        "/": {
            get: {
                tags: ["System"],
                summary: "API Welcome Greeting / Dashboard",
                description: "Serves web dashboard HTML to browser clients or greeting text to REST clients.",
                responses: {
                    200: {
                        description: "Greeting or Dashboard delivered successfully.",
                        content: {
                            "text/plain": {
                                example: "Student Management API is running"
                            },
                            "text/html": {
                                example: "<!DOCTYPE html>..."
                            }
                        }
                    }
                }
            }
        },
        "/health": {
            get: {
                tags: ["System"],
                summary: "System Health & Diagnostics",
                description: "Reports API status, PostgreSQL connection latency, uptime, and memory usage.",
                responses: {
                    200: {
                        description: "System is healthy and database is connected.",
                        content: {
                            "application/json": {
                                example: {
                                    status: "UP",
                                    timestamp: "2026-09-03T12:30:00.000Z",
                                    database: {
                                        status: "Connected",
                                        latency_ms: 12
                                    },
                                    uptime_seconds: 420,
                                    memory_usage_mb: 48
                                }
                            }
                        }
                    },
                    503: {
                        description: "Database is unreachable or system degraded.",
                        content: {
                            "application/json": {
                                example: {
                                    status: "DOWN",
                                    database: {
                                        status: "Disconnected",
                                        error: "connect ECONNREFUSED 127.0.0.1:5432"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/auth/register": {
            post: {
                tags: ["Authentication"],
                summary: "Register New User Account",
                description: "Registers a user account with hashed password and assigned role.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["username", "email", "password"],
                                properties: {
                                    username: { type: "string", example: "johndoe" },
                                    email: { type: "string", format: "email", example: "johndoe@example.com" },
                                    password: { type: "string", format: "password", example: "securepass123" },
                                    role: { type: "string", enum: ["Admin", "Student"], default: "Student", example: "Student" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "User registered successfully.",
                        content: {
                            "application/json": {
                                example: {
                                    success: true,
                                    message: "User account registered successfully.",
                                    data: { id: 3, username: "johndoe", email: "johndoe@example.com", role: "Student" }
                                }
                            }
                        }
                    },
                    400: { description: "Missing fields or invalid password length." }
                }
            }
        },
        "/auth/login": {
            post: {
                tags: ["Authentication"],
                summary: "User Login & Obtain JWT Token",
                description: "Authenticates with username/email and password, returning a signed 24-hour Bearer JWT token.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["username", "password"],
                                properties: {
                                    username: { type: "string", example: "admin" },
                                    password: { type: "string", format: "password", example: "admin123" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Login successful.",
                        content: {
                            "application/json": {
                                example: {
                                    success: true,
                                    message: "Login successful.",
                                    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                    user: { id: 1, username: "admin", email: "admin@edumanage.local", role: "Admin" }
                                }
                            }
                        }
                    },
                    401: { description: "Invalid credentials." }
                }
            }
        },
        "/auth/me": {
            get: {
                tags: ["Authentication"],
                summary: "Get Authenticated User Profile",
                description: "Retrieves the currently authenticated user's account details from the decoded JWT token.",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: "Current user profile.",
                        content: {
                            "application/json": {
                                example: {
                                    success: true,
                                    data: { id: 1, username: "admin", email: "admin@edumanage.local", role: "Admin" }
                                }
                            }
                        }
                    },
                    401: { description: "Authentication token missing." },
                    403: { description: "Invalid or expired token." }
                }
            }
        },
        "/students": {
            get: {
                tags: ["Students"],
                summary: "List Students (Search, Filter, Sort & Paginate)",
                description: "Fetches student records with optional multi-criteria filters, full-text search, field sorting, and pagination metadata.",
                parameters: [
                    { name: "search", in: "query", schema: { type: "string" }, description: "Case-insensitive substring search by student name or email (e.g. Rahul)" },
                    { name: "course", in: "query", schema: { type: "string" }, description: "Filter by enrolled course code (e.g. CSE, AI, IT, ECE)" },
                    { name: "department_id", in: "query", schema: { type: "integer" }, description: "Filter by department ID (1-4)" },
                    { name: "status", in: "query", schema: { type: "string", enum: ["Active", "Graduated", "Inactive"] }, description: "Filter by enrollment status" },
                    { name: "min_gpa", in: "query", schema: { type: "number", format: "float" }, description: "Minimum GPA threshold (0.00 - 4.00)" },
                    { name: "max_gpa", in: "query", schema: { type: "number", format: "float" }, description: "Maximum GPA threshold (0.00 - 4.00)" },
                    { name: "sort_by", in: "query", schema: { type: "string", enum: ["id", "name", "email", "age", "course", "gpa", "status", "created_at"], default: "id" }, description: "Field to sort records by" },
                    { name: "order", in: "query", schema: { type: "string", enum: ["ASC", "DESC"], default: "ASC" }, description: "Sort direction" },
                    { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Pagination page number (1-based)" },
                    { name: "limit", in: "query", schema: { type: "integer", default: 10 }, description: "Number of records per page (max 100)" }
                ],
                responses: {
                    200: {
                        description: "List of students returned successfully. If page/limit supplied, returns wrapped object with pagination metadata.",
                        content: {
                            "application/json": {
                                example: [
                                    {
                                        id: 1,
                                        name: "Rahul",
                                        email: "rahul@gmail.com",
                                        age: 20,
                                        course: "CSE",
                                        phone: "9876543210",
                                        status: "Active",
                                        gpa: "3.85",
                                        department_id: 1,
                                        department_name: "Computer Science & Engineering"
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            post: {
                tags: ["Students"],
                summary: "Register a New Student",
                description: "Validates input and creates a new student record in PostgreSQL.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name", "email", "age", "course"],
                                properties: {
                                    name: { type: "string", example: "Kavya Singhania" },
                                    email: { type: "string", format: "email", example: "kavya@gmail.com" },
                                    age: { type: "integer", minimum: 15, maximum: 100, example: 21 },
                                    course: { type: "string", example: "CSE" },
                                    phone: { type: "string", example: "9876543220" },
                                    gpa: { type: "number", minimum: 0, maximum: 4, example: 3.92 },
                                    status: { type: "string", enum: ["Active", "Graduated", "Inactive"], example: "Active" },
                                    department_id: { type: "integer", example: 1 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Student created successfully.",
                        content: {
                            "application/json": {
                                example: {
                                    success: true,
                                    message: "Student registered successfully.",
                                    data: {
                                        id: 11,
                                        name: "Kavya Singhania",
                                        email: "kavya@gmail.com",
                                        age: 21,
                                        course: "CSE",
                                        gpa: "3.92",
                                        status: "Active"
                                    }
                                }
                            }
                        }
                    },
                    400: {
                        description: "Validation failure (e.g. invalid email, age outside range).",
                        content: {
                            "application/json": {
                                example: {
                                    success: false,
                                    message: "Validation failed.",
                                    errors: ["A valid email address is required.", "Age must be an integer between 15 and 100."]
                                }
                            }
                        }
                    },
                    409: {
                        description: "Unique constraint conflict (email already in use).",
                        content: {
                            "application/json": {
                                example: {
                                    success: false,
                                    message: "A student with this email already exists."
                                }
                            }
                        }
                    }
                }
            }
        },
        "/students/{id}": {
            get: {
                tags: ["Students"],
                summary: "Get Single Student Details",
                description: "Retrieves complete student profile including department association and enrolled courses.",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Student ID (e.g. 1)" }
                ],
                responses: {
                    200: {
                        description: "Student profile found.",
                        content: {
                            "application/json": {
                                example: {
                                    id: 1,
                                    name: "Rahul",
                                    email: "rahul@gmail.com",
                                    age: 20,
                                    course: "CSE",
                                    phone: "9876543210",
                                    status: "Active",
                                    gpa: "3.85",
                                    department_id: 1,
                                    department_name: "Computer Science & Engineering",
                                    enrolled_courses: [
                                        { course_code: "CS101", title: "Data Structures & Algorithms", credits: 4, grade: "A" }
                                    ]
                                }
                            }
                        }
                    },
                    404: {
                        description: "Student not found.",
                        content: {
                            "application/json": {
                                example: { message: "Student not found" }
                            }
                        }
                    }
                }
            },
            put: {
                tags: ["Students"],
                summary: "Update Student",
                description: "Updates an existing student's attributes.",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Student ID" }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string", example: "Rahul Verma" },
                                    email: { type: "string", format: "email", example: "rahul.updated@gmail.com" },
                                    age: { type: "integer", example: 21 },
                                    course: { type: "string", example: "CSE" },
                                    phone: { type: "string", example: "9876543210" },
                                    gpa: { type: "number", example: 3.90 },
                                    status: { type: "string", enum: ["Active", "Graduated", "Inactive"], example: "Active" },
                                    department_id: { type: "integer", example: 1 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Student updated successfully.",
                        content: {
                            "application/json": {
                                example: {
                                    success: true,
                                    message: "Student updated successfully.",
                                    data: { id: 1, name: "Rahul Verma", email: "rahul.updated@gmail.com" }
                                }
                            }
                        }
                    },
                    404: {
                        description: "Student not found.",
                        content: {
                            "application/json": {
                                example: { message: "Student not found" }
                            }
                        }
                    }
                }
            },
            delete: {
                tags: ["Students"],
                summary: "Delete Student",
                description: "Deletes a student and cascades to related enrollments.",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Student ID" }
                ],
                responses: {
                    200: {
                        description: "Student deleted successfully.",
                        content: {
                            "application/json": {
                                example: {
                                    success: true,
                                    message: "Student deleted successfully.",
                                    deleted: { id: 1, name: "Rahul" }
                                }
                            }
                        }
                    },
                    404: {
                        description: "Student not found.",
                        content: {
                            "application/json": {
                                example: { message: "Student not found" }
                            }
                        }
                    }
                }
            }
        },
        "/students/insights": {
            get: {
                tags: ["Students"],
                summary: "Academic Performance Analytics & Insights",
                description: "Computes statistical summaries, GPA distributions, course enrollments, cohort standings, and actionable recommendations.",
                responses: {
                    200: {
                        description: "Analytics calculated and delivered.",
                        content: {
                            "application/json": {
                                example: {
                                    success: true,
                                    data: {
                                        database_statistics: {
                                            total_students: 10,
                                            active_students: 8,
                                            graduated_students: 2,
                                            inactive_students: 0,
                                            average_age: 21.6,
                                            average_gpa: 3.72,
                                            age_range: { min: 20, max: 24 }
                                        },
                                        course_distribution: [
                                            { course: "CSE", count: 3, percentage: 30 },
                                            { course: "AI", count: 3, percentage: 30 }
                                        ],
                                        performance_cohorts: {
                                            dean_list: { count: 3, percentage: 30 },
                                            good_standing: { count: 6, percentage: 60 }
                                        },
                                        actionable_recommendations: [
                                            "Strong academic performance: 90% of students maintain good or excellent standing."
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/students/export/csv": {
            get: {
                tags: ["Students"],
                summary: "Export Students as CSV",
                description: "Generates a downloadable CSV spreadsheet containing student records matching current search/filter parameters.",
                parameters: [
                    { name: "search", in: "query", schema: { type: "string" }, description: "Search by student name or email" },
                    { name: "course", in: "query", schema: { type: "string" }, description: "Filter by course code" },
                    { name: "department_id", in: "query", schema: { type: "integer" }, description: "Filter by department ID" },
                    { name: "status", in: "query", schema: { type: "string", enum: ["Active", "Graduated", "Inactive"] }, description: "Filter by status" },
                    { name: "sort_by", in: "query", schema: { type: "string" }, description: "Field to sort records by" },
                    { name: "order", in: "query", schema: { type: "string", enum: ["ASC", "DESC"] }, description: "Sort direction" }
                ],
                responses: {
                    200: {
                        description: "CSV file attachment downloaded.",
                        content: {
                            "text/csv": {
                                schema: { type: "string", format: "binary" }
                            }
                        }
                    }
                }
            }
        },
        "/students/export/pdf": {
            get: {
                tags: ["Students"],
                summary: "Export Students as PDF Academic Report",
                description: "Generates and streams a formatted PDF academic report with institutional header, summary statistics, and student performance table.",
                parameters: [
                    { name: "search", in: "query", schema: { type: "string" }, description: "Search by student name or email" },
                    { name: "course", in: "query", schema: { type: "string" }, description: "Filter by course code" },
                    { name: "department_id", in: "query", schema: { type: "integer" }, description: "Filter by department ID" },
                    { name: "status", in: "query", schema: { type: "string", enum: ["Active", "Graduated", "Inactive"] }, description: "Filter by status" }
                ],
                responses: {
                    200: {
                        description: "Binary PDF report streamed.",
                        content: {
                            "application/pdf": {
                                schema: { type: "string", format: "binary" }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/departments": {
            get: {
                tags: ["Academic Lookups"],
                summary: "List Academic Departments",
                description: "Retrieves list of departments with department codes, names, and faculty chairs.",
                responses: {
                    200: {
                        description: "Departments retrieved successfully.",
                        content: {
                            "application/json": {
                                example: {
                                    success: true,
                                    data: [
                                        { id: 1, name: "Computer Science & Engineering", code: "CSE", head_of_department: "Dr. A. Sharma" }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/v1/courses": {
            get: {
                tags: ["Academic Lookups"],
                summary: "List Catalog Courses",
                description: "Retrieves courses offered across all academic departments with credit ratings.",
                responses: {
                    200: {
                        description: "Courses retrieved successfully.",
                        content: {
                            "application/json": {
                                example: {
                                    success: true,
                                    data: [
                                        { id: 1, code: "CS101", title: "Data Structures & Algorithms", credits: 4, department_id: 1 }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

module.exports = swaggerSpec;
