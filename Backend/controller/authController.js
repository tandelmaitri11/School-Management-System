const bcrypt = require("bcryptjs");
const Student = require("../models/studentregister");
const Teacher = require("../models/techerregister");
const Admin = require("../models/admin");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Helper function to generate unique IDs
const generateId = async (Model, prefix) => {
  const last = await Model.findOne().sort({ createdAt: -1 });
  let number = 1;
  if (last) {
    const lastId = last.studentId || last.teacherId;
    const lastNumber = parseInt(lastId.slice(3)); // STU0001 -> 1
    number = lastNumber + 1;
  }
  return `${prefix}${number.toString().padStart(4, "0")}`;
};

// ------------------- REGISTER USER -------------------
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, studentClass } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    const existingStudent = await Student.findOne({ email });
    const existingTeacher = await Teacher.findOne({ email });

    if (existingStudent)
      return res.status(409).json({ error: "Email already exists as Student!" });
    if (existingTeacher)
      return res.status(409).json({ error: "Email already exists as Teacher!" });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role.toLowerCase() === "student") {
      if (studentClass === undefined || studentClass === "")
        return res.status(400).json({ error: "Student class is required!" });

      const classNumber = Number(studentClass);
      if (!Number.isInteger(classNumber) || classNumber < 1 || classNumber > 12)
        return res
          .status(400)
          .json({ error: "Student class must be an integer between 1 and 12" });

      const studentId = await generateId(Student, "STU");

      const newStudent = new Student({
        name,
        email,
        password: hashedPassword,
        role,
        studentClass: classNumber,
        studentId,
      });

      await newStudent.save();

      return res.status(201).json({
        message: "Student registered successfully!",
        studentId: newStudent.studentId,
      });
    } else if (role.toLowerCase() === "teacher") {
      const teacherId = await generateId(Teacher, "TEA");

      const newTeacher = new Teacher({
        name,
        email,
        password: hashedPassword,
        role,
        teacherId,
      });

      await newTeacher.save();

      return res.status(201).json({
        message: "Teacher registered successfully!",
        teacherId: newTeacher.teacherId,
      });
    }

    return res.status(400).json({ error: "Invalid role!" });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Server error, please try again later." });
  }
};

// ------------------- LOGIN USER -------------------
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ error: "Email and password are required!" });

    let user = await Student.findOne({ email });
    let userType = "Student";

    if (!user) {
      user = await Teacher.findOne({ email });
      userType = "Teacher";
    }

    if (!user) {
      user = await Admin.findOne({ email });
      userType = "Admin";
    }

    if (!user) return res.status(404).json({ error: "User not found!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials!" });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    let userInfo = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    if (userType === "Student") {
      userInfo.studentId = user.studentId;
      userInfo.studentClass = user.studentClass;
    }

    if (userType === "Teacher") {
      userInfo.teacherId = user.teacherId;
    }

    res.status(200).json({
      message: `${userType} login successful!`,
      token,
      user: userInfo,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error, please try again later." });
  }
};

// ===========================================================
// 🔹 NEW: FORGOT PASSWORD FLOW (EMAIL OTP + RESET PASSWORD)
// ===========================================================

// helper to find user by email (any role)
const findUserByEmail = async (email) => {
  let user =
    (await Student.findOne({ email })) ||
    (await Teacher.findOne({ email })) ||
    (await Admin.findOne({ email }));
  return user;
};

// helper to send email
const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_EMAIL,
    to,
    subject,
    text,
  });
};

// ===========================================================
// 🔹 FORGOT PASSWORD FLOW (Simple Gmail OTP + Reset)
// ===========================================================

const otpStore = {}; // temporary in-memory OTP storage

// ✅ Step 1: Send OTP
// ✅ Step 1: Send OTP (with styled email template)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 minutes expiry

    // Setup transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    // HTML email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background-color: #007bff; color: white; text-align: center; padding: 20px;">
          <img src="https://i.ibb.co/0tq8f6Z/school-logo.png" alt="School Logo" width="70" height="70" style="border-radius: 50%; background: white; padding: 5px; margin-bottom: 10px;">
          <h2 style="margin: 0;">MySchooly</h2>
          <p style="margin: 0; font-size: 14px;">Your Trusted School Management System</p>
        </div>

        <div style="padding: 20px;">
          <h3 style="color: #333;">Hello ${user.name || "User"},</h3>
          <p style="font-size: 15px; color: #555;">
            You requested to reset your password. Use the following One-Time Password (OTP) to verify your identity:
          </p>

          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; background: #007bff; color: white; font-size: 24px; letter-spacing: 8px; padding: 10px 20px; border-radius: 8px;">
              ${otp}
            </span>
          </div>

          <p style="font-size: 14px; color: #666;">
            This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.
          </p>

          <p style="font-size: 13px; color: #888;">If you did not request this, please ignore this email.</p>
        </div>

        <div style="background-color: #f9f9f9; text-align: center; padding: 12px; font-size: 13px; color: #777;">
          © ${new Date().getFullYear()} MySchooly. All rights reserved.
        </div>
      </div>
    `;

    // Send the email
    await transporter.sendMail({
      from: `"MySchooly Support" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "MySchooly Password Reset OTP",
      html: htmlContent,
    });

    console.log("OTP sent to:", email);
    res.json({ message: "OTP sent to your email successfully" });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ message: "Server error while sending OTP" });
  }
};


// ✅ Step 2: Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore[email];

    if (!record) return res.status(400).json({ message: "OTP not found" });
    if (record.expires < Date.now())
      return res.status(400).json({ message: "OTP expired" });
    if (record.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Step 3: Reset Password
// ✅ Step 3: Reset Password + Send Confirmation Email
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const record = otpStore[email];

    if (!record) return res.status(400).json({ message: "OTP not found" });
    if (record.expires < Date.now())
      return res.status(400).json({ message: "OTP expired" });
    if (record.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    delete otpStore[email];

    // Setup transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    // Styled success email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background-color: #198754; color: white; text-align: center; padding: 20px;">
          <img src="https://i.ibb.co/0tq8f6Z/school-logo.png" alt="School Logo" width="70" height="70" style="border-radius: 50%; background: white; padding: 5px; margin-bottom: 10px;">
          <h2 style="margin: 0;">MySchooly</h2>
          <p style="margin: 0; font-size: 14px;">Your Trusted School Management System</p>
        </div>

        <div style="padding: 20px;">
          <h3 style="color: #333;">Password Reset Successful 🎉</h3>
          <p style="font-size: 15px; color: #555;">
            Hi <strong>${user.name || "User"}</strong>, your password has been successfully updated.
          </p>

          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; background: #198754; color: white; font-size: 18px; padding: 10px 20px; border-radius: 8px;">
              Login Now
            </span>
          </div>

          <p style="font-size: 14px; color: #666;">
            You can now log in to your <strong>MySchooly</strong> account using your new password.
          </p>
          <p style="font-size: 13px; color: #999;">
            If you didn’t make this change, please contact your school administrator immediately.
          </p>
        </div>

        <div style="background-color: #f9f9f9; text-align: center; padding: 12px; font-size: 13px; color: #777;">
          © ${new Date().getFullYear()} MySchooly. All rights reserved.
        </div>
      </div>
    `;

    // Send confirmation email
    await transporter.sendMail({
      from: `"MySchooly Support" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Your Password Has Been Reset Successfully",
      html: htmlContent,
    });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

