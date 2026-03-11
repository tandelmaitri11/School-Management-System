const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const isValidPhoneOrEmpty = (v) => !String(v || "").trim() || /^\d{10}$/.test(String(v || "").trim());

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    phone: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: isValidPhoneOrEmpty,
        message: "phone must be exactly 10 digits",
      },
    },
    mobile: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: isValidPhoneOrEmpty,
        message: "mobile must be exactly 10 digits",
      },
    },
    contactNumber: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: isValidPhoneOrEmpty,
        message: "contactNumber must be exactly 10 digits",
      },
    },
    password: { type: String, required: true },
    role: { type: String, default: "Admin" },
  },
  { timestamps: true }
);

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("Admin", adminSchema);
