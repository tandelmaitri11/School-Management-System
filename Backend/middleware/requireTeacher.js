module.exports = (req, res, next) => {
  if (req.user?.role !== "Teacher") {
    return res.status(403).json({ success: false, message: "Teacher only" });
  }
  next();
};
