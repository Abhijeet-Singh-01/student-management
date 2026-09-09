const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a student ID parameter
 */
function validateId(id) {
  const num = Number(id);
  if (!id || !Number.isInteger(num) || num <= 0) {
    return { valid: false, error: "ID must be a valid positive integer" };
  }
  return { valid: true, id: num };
}

/**
 * Validate query pagination parameters
 */
function validatePagination(page, limit) {
  let parsedPage = 1;
  let parsedLimit = 10;

  if (page !== undefined) {
    const p = Number(page);
    if (!Number.isInteger(p) || p <= 0) {
      return { valid: false, error: "Page must be a valid positive integer" };
    }
    parsedPage = p;
  }

  if (limit !== undefined) {
    const l = Number(limit);
    if (!Number.isInteger(l) || l <= 0 || l > 100) {
      return { valid: false, error: "Limit must be an integer between 1 and 100" };
    }
    parsedLimit = l;
  }

  return { valid: true, page: parsedPage, limit: parsedLimit };
}

/**
 * Validate student payload for Create / Update
 */
function validateStudent(data) {
  const { name, email, age, course } = data;

  // Check required fields presence
  if (
    name === undefined ||
    email === undefined ||
    age === undefined ||
    course === undefined
  ) {
    return { valid: false, error: "All fields are required" };
  }

  // Name validation
  if (typeof name !== "string" || !name.trim()) {
    return { valid: false, error: "Name is required and must be a valid string" };
  }
  if (name.trim().length < 2 || name.trim().length > 100) {
    return { valid: false, error: "Name must be between 2 and 100 characters" };
  }

  // Email validation
  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return { valid: false, error: "Invalid email format" };
  }

  // Age validation
  const ageNum = Number(age);
  if (age === "" || !Number.isInteger(ageNum) || ageNum <= 0 || ageNum > 120) {
    return { valid: false, error: "Age must be a valid positive integer between 1 and 120" };
  }

  // Course validation
  if (typeof course !== "string" || !course.trim()) {
    return { valid: false, error: "Course is required and must be a valid string" };
  }
  if (course.trim().length < 2 || course.trim().length > 100) {
    return { valid: false, error: "Course must be between 2 and 100 characters" };
  }

  return {
    valid: true,
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      age: ageNum,
      course: course.trim()
    }
  };
}

/**
 * Validate search parameter
 */
function validateSearch(query) {
  if (!query || typeof query !== "string" || !query.trim()) {
    return { valid: false, error: "Search term is required" };
  }
  return { valid: true, search: query.trim() };
}

/**
 * Validate filter parameters
 */
function validateFilter(query) {
  const { course, age } = query;
  let parsedAge = null;

  if (age !== undefined) {
    const a = Number(age);
    if (!Number.isInteger(a) || a <= 0) {
      return { valid: false, error: "Age must be a valid positive integer" };
    }
    parsedAge = a;
  }

  const parsedCourse = course && typeof course === "string" && course.trim() ? course.trim() : null;

  return {
    valid: true,
    course: parsedCourse,
    age: parsedAge
  };
}

module.exports = {
  validateId,
  validatePagination,
  validateStudent,
  validateSearch,
  validateFilter
};
