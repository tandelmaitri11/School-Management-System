const mongoose = require("mongoose");
const Counter = require("./counter");

const isValidPhoneOrEmpty = (v) => !String(v || "").trim() || /^\d{10}$/.test(String(v || "").trim());

const parentSchema = new mongoose.Schema(
  {
    parentId: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
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
    role: { type: String, default: "Parent" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

parentSchema.pre("save", async function (next) {
  try {
    if (!this.parentId) {
      const lastParent = await this.constructor
        .findOne({ parentId: /^PAR/ })
        .sort({ parentId: -1 })
        .select("parentId");

      const maxSeq = lastParent ? parseInt(String(lastParent.parentId).slice(3), 10) : 0;

      await Counter.findOneAndUpdate(
        { name: "parent" },
        { $max: { seq: maxSeq } },
        { upsert: true }
      );

      const counter = await Counter.findOneAndUpdate(
        { name: "parent" },
        { $inc: { seq: 1 } },
        { new: true }
      );

      this.parentId = "PAR" + String(counter.seq).padStart(4, "0");
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.models.Parent || mongoose.model("Parent", parentSchema);
