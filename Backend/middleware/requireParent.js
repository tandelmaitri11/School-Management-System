module.exports = (req, res, next) => {
  if (req.user?.role !== "Parent") {
    return res.status(403).json({ success: false, message: "Parent only" });
  }
  next();
};
