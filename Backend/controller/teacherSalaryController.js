const TeacherInfo = require("../models/teacherinfo");
const TeacherSalary = require("../models/tecahersalary");


// ✅ Fetch all teachers (full details for frontend card)
exports.getTeachers = async (req, res) => {
    try {
        const teachers = await TeacherInfo.find().select(
            "teacherName email mobile salary fatherName gender experience education address bloodGroup dob joiningDate picture"
        );

        res.json(teachers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// ✅ Pay salary
exports.paySalary = async (req, res) => {
    try {
        const salary = new TeacherSalary(req.body);
        await salary.save();
        res.json({ message: "Salary Paid", salary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// ✅ Check salary already paid for selected month
exports.checkSalary = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { month } = req.query;

        const record = await TeacherSalary.findOne({ teacher: teacherId, month });

        res.json({ paid: !!record });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// ✅ Get all salary records (Approve Salary Page data)
exports.getAllSalary = async (req, res) => {
    try {
        const data = await TeacherSalary.find()
            .populate("teacher", "teacherName email mobile salary picture")
            .sort({ createdAt: -1 });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// ✅ Update status (Approved / Rejected)
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updated = await TeacherSalary.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate("teacher", "teacherName email mobile salary");

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Get salary history for one teacher
exports.getSalaryByTeacher = async (req, res) => {
    try {
        const history = await TeacherSalary.find({ teacher: teacherId })
            .populate("teacher", "teacherName email mobile salary picture")
            .sort({ createdAt: -1 });
        res.json(history);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
