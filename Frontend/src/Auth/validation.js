// ✅ Register Validation
export function validateRegister(formData) {
  let errors = {};

  // Name
  if (!formData.name || !formData.name.trim()) {
    errors.name = "Name is required!";
  }

  // Email
  if (!formData.email) {
    errors.email = "Email is required!";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Invalid email format!";
  }

  // Password
  if (!formData.password) {
    errors.password = "Password is required!";
  } else if (formData.password.length < 6) {
    errors.password = "Password must be at least 6 characters!";
  }

  // Role
  if (!formData.role) {
    errors.role = "Role is required!";
  } else if (formData.role === "Admin") {
    errors.role = "You cannot self-register as Admin!";
  }

  // Student role checks
  if (formData.role === "Student") {
    if (!formData.studentClass || !formData.studentClass.trim()) {
      errors.studentClass = "Class is required for students!";
    }
  }

  // Teacher role checks
  // If you want subject to be optional, comment/remove this block
  // if (formData.role === "Teacher") {
  //   if (!formData.subject || !formData.subject.trim()) {
  //     errors.subject = "Subject is required for teachers!";
  //   }
  // }

  return errors;
}

// Login Validation
export function validateLogin(formData) {
  let errors = {};

  // Email
  if (!formData.email) {
    errors.email = "Email is required!";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Invalid email format!";
  }

  // Password
  if (!formData.password) {
    errors.password = "Password is required!";
  } else if (formData.password.length < 6) {
    errors.password = "Password must be at least 6 characters!";
  }

  return errors;
}
