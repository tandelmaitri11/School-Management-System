const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper function to hash passwords
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Get users with optional query filters
const getUser = async (req, res) => {
  try {
    const { id, name, email, role } = req.query;
    const query = {};
    if (id) query._id = id;
    if (name) query.name = name;
    if (email) query.email = email;
    if (role) query.role = role;

    const users = await User.find(query, "_id name email role studentClass createdAt updatedAt");
    res.status(200).json(users);
  } catch (err) {
    console.error("GetUser Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Register a new user (Student/Teacher)
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, studentClass, subject } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ warning: "Email already exists" });

    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      ...(role === "Student" && { studentClass }),
      ...(role === "Teacher" && { subject }),
    });

    await newUser.save();
    res.status(201).json({ message: `${role} registered successfully!` });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

// User login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentClass: user.studentClass,
        subject: user.subject,
      },
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
};

// Add admin
const addadmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await hashPassword(password);

    const newAdmin = new User({ name, email, password: hashedPassword, role: "Admin" });
    await newAdmin.save();

    res.status(201).json({ message: "Admin added successfully!", admin: newAdmin });
  } catch (err) {
    console.error("AddAdmin Error:", err);
    res.status(500).json({ error: "Failed to add admin" });
  }
};

// Get admin profile (without password)
const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json(admin);
  } catch (err) {
    console.error("GetAdminProfile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update admin profile
const updateAdminProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const admin = await User.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.name = name || admin.name;
    admin.email = email || admin.email;

    if (password && password.trim() !== "") {
      admin.password = await hashPassword(password);
    }

    await admin.save();
    res.json({ name: admin.name, email: admin.email });
  } catch (err) {
    console.error("UpdateAdminProfile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Change admin password
const changeAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const admin = await User.findById(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

    admin.password = await hashPassword(newPassword);
    await admin.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("ChangeAdminPassword Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Dashboard data
const getDashboardData = async (req, res) => {
  try {
    const studentCount = await User.countDocuments({ role: "Student" });
    const teacherCount = await User.countDocuments({ role: "Teacher" });
    res.json({ students: studentCount, teachers: teacherCount });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

// Get all teachers
const getTeacher = async (req, res) => {
  try {
    const teachers = await User.find({ role: "Teacher" }).select("name email role");
    res.json(teachers);
  } catch (err) {
    console.error("GetTeacher Error:", err);
    res.status(500).json({ message: "Error fetching teachers", error: err.message });
  }
};

module.exports = {
  getUser,
  registerUser,
  loginUser,
  addadmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getDashboardData,
  getTeacher,
};
