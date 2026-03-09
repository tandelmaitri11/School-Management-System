const Class = require("../models/class");

const checkClassTeacher = async (req, res, next) => {
  const teacherId = req.user.id;
  const { classId } = req.body;

  const cls = await Class.findById(classId);

  if (!cls || cls.classTeacher.toString() !== teacherId) {
    return res.status(403).json({ message: "Not allowed" });
  }

  next();
};

module.exports = checkClassTeacher;
