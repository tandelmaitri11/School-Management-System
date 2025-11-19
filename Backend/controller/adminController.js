const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ➕ Create Admin (optional: initial admin)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(409).json({ error: "Email already exists!" });

    const newAdmin = new Admin({ name, email, password });
    await newAdmin.save();

    res.status(201).json({ message: "Admin created successfully!" });
  } catch (err) {
    console.error("Admin creation error:", err);
    res.status(500).json({ error: "Server error, try again later." });
  }
};

// 📝 Get all admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.status(200).json(admins);
  } catch (err) {
    console.error("Get admins error:", err);
    res.status(500).json({ error: "Server error, try again later." });
  }
};

// ✏️ Update admin
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ error: "Admin not found!" });

    if (name) admin.name = name;
    if (email) admin.email = email;
    if (password) admin.password = await bcrypt.hash(password, 10);

    await admin.save();
    res.status(200).json({ message: "Admin updated successfully!" });
  } catch (err) {
    console.error("Update admin error:", err);
    res.status(500).json({ error: "Server error, try again later." });
  }
};

// 🔐 Change password with old password verification
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ error: "Admin not found!" });

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) return res.status(400).json({ error: "Old password is incorrect!" });

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Server error, try again later." });
  }
};

// ❌ Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ error: "Admin not found!" });

    await admin.deleteOne();
    res.status(200).json({ message: "Admin deleted successfully!" });
  } catch (err) {
    console.error("Delete admin error:", err);
    res.status(500).json({ error: "Server error, try again later." });
  }
};
