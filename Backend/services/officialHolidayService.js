const https = require("https");

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const cache = new Map();

const isYmd = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));

const fetchJson = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`Holiday API failed with status ${res.statusCode}`));
          }
          try {
            resolve(JSON.parse(body));
          } catch (err) {
            reject(new Error("Holiday API returned invalid JSON"));
          }
        });
      })
      .on("error", reject);
  });

const normalizeHolidayRows = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((r) => ({
      date: String(r?.date || "").trim(),
      name: String(r?.localName || r?.name || "").trim(),
      source: "nager-date",
    }))
    .filter((r) => isYmd(r.date));

const getCountry = () => String(process.env.HOLIDAY_COUNTRY || "IN").toUpperCase();

const getYearHolidays = async (year, country = getCountry()) => {
  const safeYear = Number(year);
  if (!Number.isInteger(safeYear) || safeYear < 2000 || safeYear > 2100) return [];

  const key = `${country}-${safeYear}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.fetchedAt < CACHE_TTL_MS) {
    return hit.rows;
  }

  const url = `https://date.nager.at/api/v3/PublicHolidays/${safeYear}/${country}`;
  const rows = normalizeHolidayRows(await fetchJson(url));
  cache.set(key, { rows, fetchedAt: now });
  return rows;
};

const getOfficialHolidayByDate = async (ymd, country = getCountry()) => {
  if (!isYmd(ymd)) return null;
  const year = Number(String(ymd).slice(0, 4));
  const rows = await getYearHolidays(year, country);
  return rows.find((r) => r.date === ymd) || null;
};

module.exports = { isYmd, getCountry, getYearHolidays, getOfficialHolidayByDate };
