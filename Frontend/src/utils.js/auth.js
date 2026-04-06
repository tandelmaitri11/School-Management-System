export const getUser = () => JSON.parse(localStorage.getItem("user") || "{}");
export const getStudentId = () => localStorage.getItem("studentId");
export const getTeacherId = () => localStorage.getItem("teacherId");