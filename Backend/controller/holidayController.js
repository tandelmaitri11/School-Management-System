const {
  isYmd,
  getCountry,
  getYearHolidays,
  getOfficialHolidayByDate,
} = require("../services/officialHolidayService");

exports.getOfficialHolidays = async (req, res) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());
    const rows = await getYearHolidays(year, getCountry());
    return res.status(200).json({
      country: getCountry(),
      year,
      holidays: rows,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch official holidays" });
  }
};

exports.checkOfficialHoliday = async (req, res) => {
  try {
    const date = String(req.query.date || "").trim();
    if (!isYmd(date)) return res.status(400).json({ message: "date must be YYYY-MM-DD" });

    const row = await getOfficialHolidayByDate(date, getCountry());
    return res.status(200).json({
      source: "official-online-calendar",
      country: getCountry(),
      isHoliday: !!row,
      holiday: row || null,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to check official holiday" });
  }
};
