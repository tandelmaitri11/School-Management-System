const Timetable = require("../models/timetable");
const { getOfficialHolidayByDate } = require("./officialHolidayService");

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ALIAS = {
  mon: "Monday",
  monday: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  wed: "Wednesday",
  wednesday: "Wednesday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  fri: "Friday",
  friday: "Friday",
  sat: "Saturday",
  saturday: "Saturday",
  sun: "Sunday",
  sunday: "Sunday",
};

const normalize = (v) => String(v || "").trim();
const normalizeUpper = (v) => normalize(v).toUpperCase();
const normalizeDayName = (d) => DAY_ALIAS[normalize(d).toLowerCase()] || normalize(d);

const isYmd = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));

const getDayNameFromYmd = (ymd) => {
  const [y, m, d] = String(ymd || "").split("-").map(Number);
  if (!y || !m || !d) return "";
  const weekdayIndex = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return WEEKDAY_NAMES[weekdayIndex] || "";
};

const getEnvHolidaySet = () =>
  new Set(
    String(process.env.OFFICIAL_HOLIDAYS || "")
      .split(",")
      .map((x) => x.trim())
      .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x))
  );

const buildBlocked = (code, reason, meta = {}) => ({
  allowed: false,
  code,
  reason,
  ...meta,
});

const buildAllowed = (meta = {}) => ({
  allowed: true,
  code: "ALLOWED",
  reason: "",
  ...meta,
});

const validateTeacherAttendanceDate = async ({ date }) => {
  if (!isYmd(date)) {
    return buildBlocked("INVALID_DATE", "date must be YYYY-MM-DD");
  }

  const dayName = getDayNameFromYmd(date);
  if (dayName === "Sunday") {
    return buildBlocked("SUNDAY_BLOCKED", "Teacher attendance cannot be submitted on Sunday", {
      dayName,
    });
  }

  const envHolidaySet = getEnvHolidaySet();
  if (envHolidaySet.has(date)) {
    return buildBlocked("ENV_HOLIDAY_BLOCKED", "Teacher attendance cannot be submitted on official holiday", {
      dayName,
    });
  }

  try {
    const holiday = await getOfficialHolidayByDate(date);
    if (holiday) {
      return buildBlocked(
        "OFFICIAL_HOLIDAY_BLOCKED",
        `Teacher attendance cannot be submitted on official holiday (${holiday.name || date})`,
        { dayName, holiday }
      );
    }
  } catch (err) {
    // Keep system operational if upstream holiday service is unavailable.
  }

  return buildAllowed({ dayName });
};

const validateStudentAttendanceDate = async ({ classId, section, stream = "", date }) => {
  if (!isYmd(date)) {
    return buildBlocked("INVALID_DATE", "date must be YYYY-MM-DD");
  }

  const dayName = getDayNameFromYmd(date);
  if (dayName === "Sunday") {
    return buildBlocked("SUNDAY_BLOCKED", "Attendance cannot be submitted on Sunday", {
      dayName,
    });
  }

  const envHolidaySet = getEnvHolidaySet();
  if (envHolidaySet.has(date)) {
    return buildBlocked("ENV_HOLIDAY_BLOCKED", "Attendance cannot be submitted on official holiday", {
      dayName,
    });
  }

  try {
    const holiday = await getOfficialHolidayByDate(date);
    if (holiday) {
      return buildBlocked(
        "OFFICIAL_HOLIDAY_BLOCKED",
        `Attendance cannot be submitted on official holiday (${holiday.name || date})`,
        { dayName, holiday }
      );
    }
  } catch (err) {
    // Keep system operational if upstream holiday service is unavailable.
  }

  const timetable = await Timetable.findOne({
    classId,
    section: normalizeUpper(section),
    stream: normalize(stream),
  })
    .select("meta.workingDays")
    .lean();

  const workingDays = Array.isArray(timetable?.meta?.workingDays)
    ? timetable.meta.workingDays.map(normalizeDayName).filter(Boolean)
    : [];

  if (workingDays.length > 0 && !workingDays.includes(dayName)) {
    return buildBlocked(
      "NON_WORKING_DAY_BLOCKED",
      `Attendance cannot be submitted on holiday/non-working day (${dayName})`,
      { dayName, workingDays }
    );
  }

  return buildAllowed({ dayName, workingDays });
};

module.exports = {
  isYmd,
  validateTeacherAttendanceDate,
  validateStudentAttendanceDate,
};
