import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const MONTH_INDEX = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const SHORT_TO_LONG = {
  jan: "january",
  feb: "february",
  mar: "march",
  apr: "april",
  may: "may",
  jun: "june",
  jul: "july",
  aug: "august",
  sep: "september",
  sept: "september",
  oct: "october",
  nov: "november",
  dec: "december",
};

// ✅ Parse "January 2026" OR "Jan 2026" OR "01 2026" into sortable key
const parseMonthYear = (monthStr) => {
  if (!monthStr) return { year: 0, month: 0, key: 0, label: "" };

  const raw = String(monthStr).trim();
  const parts = raw.split(/\s+/);
  const p0 = (parts[0] || "").toLowerCase();
  const year = Number(parts[1] || 0);

  let monthIndex = 0;

  if (/^\d{1,2}$/.test(p0)) {
    const n = Math.max(1, Math.min(12, Number(p0)));
    monthIndex = n - 1;
  } else {
    const long = SHORT_TO_LONG[p0] || p0;
    monthIndex = MONTH_INDEX[long] ?? 0;
  }

  const key = year * 100 + (monthIndex + 1);

  const monthName = new Date(2000, monthIndex, 1).toLocaleString("en-US", { month: "long" });
  const label = year ? `${monthName} ${year}` : raw;

  return { year: year || 0, month: monthIndex, key, label };
};

export default function TeacherSalaryHistory() {
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Month dropdown should be "All" by default (always)
  const [monthFilter, setMonthFilter] = useState("All");
  const [search, setSearch] = useState("");

  const teacherId = localStorage.getItem("teacherId");
  const baseUrl = api?.defaults?.baseURL || "";

  useEffect(() => {
    const fetchSalaryHistory = async () => {
      if (!teacherId) return;
      try {
        const res = await api.get(`/api/teacher-salary/teacher/${teacherId}/salary`);
        setSalaryHistory(res.data || []);
      } catch (err) {
        console.error("Error fetching salary history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSalaryHistory();
  }, [teacherId]);

  const openSlip = (salaryId) => {
    window.open(`${baseUrl}/api/teacher-salary/slip/${salaryId}?view=1`, "_blank");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Paid":
        return "badge text-bg-success";
      case "Pending":
        return "badge text-bg-warning";
      case "Approved":
        return "badge text-bg-primary";
      case "Rejected":
        return "badge text-bg-danger";
      default:
        return "badge text-bg-secondary";
    }
  };

  const getPayoutClass = (status) => {
    switch (status) {
      case "Paid":
        return "badge text-bg-success";
      case "Processing":
        return "badge text-bg-primary";
      case "Failed":
        return "badge text-bg-danger";
      default:
        return "badge text-bg-secondary";
    }
  };

  // ✅ Normalize + sort (latest month first)
  const normalizedSorted = useMemo(() => {
    const list = (salaryHistory || []).map((r) => {
      const parsed = parseMonthYear(r?.month);
      return {
        ...r,
        __monthKey: parsed.key,
        __year: parsed.year,
        __monthLabel: parsed.label,
      };
    });

    list.sort((a, b) => {
      if ((b.__monthKey || 0) !== (a.__monthKey || 0)) return (b.__monthKey || 0) - (a.__monthKey || 0);
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });

    return list;
  }, [salaryHistory]);

  // ⭐ Latest record (global)
  const latestSalary = useMemo(() => normalizedSorted[0] || null, [normalizedSorted]);

  // ✅ Month options: All + sorted months (latest first)
  const monthOptions = useMemo(() => {
    const uniq = Array.from(new Set((normalizedSorted || []).map((r) => r.__monthLabel).filter(Boolean)));
    uniq.sort((a, b) => parseMonthYear(b).key - parseMonthYear(a).key);
    return ["All", ...uniq];
  }, [normalizedSorted]);

  // ✅ Filtered list
  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (normalizedSorted || [])
      .filter((r) => (monthFilter === "All" ? true : r.__monthLabel === monthFilter))
      .filter((r) => {
        if (!q) return true;
        const month = (r.__monthLabel || "").toLowerCase();
        const status = (r?.status || "").toLowerCase();
        const payout = (r?.payoutStatus || "").toLowerCase();
        const amount = String(r?.paidAmount ?? "").toLowerCase();
        return month.includes(q) || status.includes(q) || payout.includes(q) || amount.includes(q);
      });
  }, [normalizedSorted, monthFilter, search]);

  // 📁 Group by year (from filtered list)
  const groupedByYear = useMemo(() => {
    const groups = {};
    for (const r of filteredHistory) {
      const y = r.__year || 0;
      if (!groups[y]) groups[y] = [];
      groups[y].push(r);
    }

    const orderedYears = Object.keys(groups)
      .map(Number)
      .filter((y) => y > 0)
      .sort((a, b) => b - a);

    if (groups[0]?.length) orderedYears.push(0);

    return { groups, orderedYears };
  }, [filteredHistory]);

  const stats = useMemo(() => {
    const total = filteredHistory.length;
    const paid = filteredHistory.filter((r) => r?.payoutStatus === "Paid").length;
    const processing = filteredHistory.filter((r) => r?.payoutStatus === "Processing").length;
    const failed = filteredHistory.filter((r) => r?.payoutStatus === "Failed").length;
    return { total, paid, processing, failed };
  }, [filteredHistory]);

  return (
    <div className="container-xxl py-4">
      {/* Header */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div
          className="p-4"
          style={{
            background: "linear-gradient(135deg, rgba(13,110,253,1) 0%, rgba(111,66,193,1) 100%)",
          }}
        >
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="text-white">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div
                  className="rounded-4 d-flex align-items-center justify-content-center"
                  style={{
                    width: 46,
                    height: 46,
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  <i className="bi bi-cash-stack fs-4" />
                </div>
                <div>
                  <h3 className="mb-0 fw-bold">My Salary History</h3>
                  <div className="opacity-75">Sorted by month (latest first) • Grouped by year</div>
                </div>
              </div>
            </div>

            <span className="badge bg-light text-dark border rounded-pill px-3 py-2">Read Only</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <div className="text-muted mt-2">Loading salary records...</div>
          </div>
        </div>
      ) : salaryHistory.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5">
            <div
              className="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width: 64, height: 64 }}
            >
              <i className="bi bi-inbox fs-3 text-muted" />
            </div>
            <div className="fs-5 fw-semibold">No salary records found</div>
            <div className="text-muted">Once admin processes salary, your slips will appear here.</div>
          </div>
        </div>
      ) : (
        <>
          
          {/* Filters */}
          <div className="card border-0 shadow-sm rounded-4 mb-3">
            <div className="card-body">
              <div className="d-flex flex-column flex-lg-row gap-2 align-items-lg-center justify-content-between">
                <div className="d-flex gap-2 flex-wrap">
                  <div className="input-group" style={{ minWidth: 260 }}>
                    <span className="input-group-text bg-light border-0">🔎</span>
                    <input
                      className="form-control border-0 bg-light"
                      placeholder="Search month / status / amount..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small fw-semibold">Month</span>
                    <select
                      className="form-select"
                      style={{ width: 220 }}
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                    >
                      {monthOptions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setMonthFilter("All");
                      setSearch("");
                    }}
                  >
                    Reset
                  </button>
                </div>

                <div className="text-muted small">
                  Showing <b>{filteredHistory.length}</b> record(s)
                  {monthFilter !== "All" && (
                    <>
                      {" "}
                      • Month: <b>{monthFilter}</b>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Row */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="text-muted small">Records</div>
                  <div className="fs-3 fw-bold">{stats.total}</div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="text-muted small">Paid</div>
                  <div className="fs-3 fw-bold text-success">{stats.paid}</div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="text-muted small">Processing</div>
                  <div className="fs-3 fw-bold text-primary">{stats.processing}</div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="text-muted small">Failed</div>
                  <div className="fs-3 fw-bold text-danger">{stats.failed}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grouped by Year */}
          {filteredHistory.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body text-center py-5">
                <div className="fs-5 fw-semibold">No matching records</div>
                <div className="text-muted">Try changing month filter or search keyword.</div>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {groupedByYear.orderedYears.map((year) => {
                const items = groupedByYear.groups[year] || [];
                const yearLabel = year === 0 ? "Others" : year;

                return (
                  <div key={year} className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="px-4 py-3 bg-light border-bottom d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-dark rounded-pill px-3 py-2">{yearLabel}</span>
                        <span className="text-muted small">{items.length} record(s)</span>
                      </div>

                      <button
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      >
                        <i className="bi bi-arrow-up-short me-1" />
                        Top
                      </button>
                    </div>

                    <div className="card-body p-0">
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th className="ps-4" style={{ width: 60 }}>
                                #
                              </th>
                              <th>Month</th>
                              <th>Paid Amount</th>
                              <th>Status</th>
                              <th>Payout</th>
                              <th>Paid Date</th>
                              <th className="text-end pe-4">Slip</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((record, index) => {
                              const isLatest = latestSalary?._id === record._id;

                              return (
                                <tr key={record._id} className={isLatest ? "table-success" : ""}>
                                  <td className="ps-4 fw-semibold">{index + 1}</td>

                                  <td>
                                    <div className="d-flex align-items-center gap-2">
                                      <div className="fw-semibold">{record.__monthLabel || record.month}</div>
                                      {isLatest && <span className="badge bg-success rounded-pill">Latest</span>}
                                    </div>
                                    <div className="text-muted small">Salary period</div>
                                  </td>

                                  <td className="fw-bold">₹ {record.paidAmount}</td>

                                  <td>
                                    <span className={`${getStatusClass(record.status)} rounded-pill px-3 py-2`}>
                                      {record.status}
                                    </span>
                                  </td>

                                  <td>
                                    <span
                                      className={`${getPayoutClass(record.payoutStatus || "Pending")} rounded-pill px-3 py-2`}
                                    >
                                      {record.payoutStatus || "Pending"}
                                    </span>
                                  </td>

                                  <td className="text-nowrap">
                                    {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "-"}
                                  </td>

                                  <td className="text-end pe-4">
                                    <button
                                      className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                      onClick={() => openSlip(record._id)}
                                    >
                                      <i className="bi bi-eye me-1" />
                                      View Slip
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="px-4 py-3 border-top bg-white d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                      <div className="text-muted small">Tip: Open slip → download/print from the PDF viewer.</div>
                      <button
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      >
                        <i className="bi bi-arrow-up-short me-1" />
                        Back to top
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
