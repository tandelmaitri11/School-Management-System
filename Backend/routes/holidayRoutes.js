const express = require("express");
const router = express.Router();
const {
  getOfficialHolidays,
  checkOfficialHoliday,
} = require("../controller/holidayController");

router.get("/", getOfficialHolidays);
router.get("/official/check", checkOfficialHoliday);

module.exports = router;
