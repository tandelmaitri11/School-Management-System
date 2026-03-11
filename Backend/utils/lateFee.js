const toMoney = (n) => Math.max(0, Math.round(Number(n || 0) * 100) / 100);

const toDayStart = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const daysBetween = (fromDate, toDate) => {
  const ms = toDayStart(toDate).getTime() - toDayStart(fromDate).getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
};

const resolveDueDate = ({ fees, classFee, now = new Date() }) => {
  if (fees?.dueDate) return new Date(fees.dueDate);

  const dueDayRaw = Number(classFee?.dueDay);
  if (!Number.isFinite(dueDayRaw) || dueDayRaw <= 0) return null;

  const dueDay = Math.max(1, Math.min(31, Math.floor(dueDayRaw)));
  const anchor = fees?.createdAt ? new Date(fees.createdAt) : new Date(now);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(dueDay, lastDay);

  const dueDate = new Date(year, month, day);
  dueDate.setHours(23, 59, 59, 999);
  return dueDate;
};

const calculateLateFeeState = ({ fees, classFee, now = new Date() }) => {
  const totalFees = toMoney(fees?.totalFees);
  const paidAmount = toMoney(fees?.paidAmount);
  const baseRemaining = toMoney(Math.max(0, totalFees - paidAmount));

  const dueDate = resolveDueDate({ fees, classFee, now });
  const graceDays = Math.max(0, Math.floor(Number(classFee?.graceDays || 0)));
  const lateFeeType = String(classFee?.lateFeeType || "flat");
  const lateFeeValue = toMoney(classFee?.lateFeeValue);
  const lateFeeCap = toMoney(classFee?.lateFeeCap);

  let lateFeeAccrued = 0;
  let overdueDays = 0;

  if (baseRemaining > 0 && dueDate && lateFeeValue > 0) {
    const graceEnd = new Date(dueDate);
    graceEnd.setDate(graceEnd.getDate() + graceDays);

    overdueDays = daysBetween(graceEnd, now);
    if (overdueDays > 0) {
      if (lateFeeType === "daily") lateFeeAccrued = toMoney(overdueDays * lateFeeValue);
      else if (lateFeeType === "percent") lateFeeAccrued = toMoney(baseRemaining * (lateFeeValue / 100));
      else lateFeeAccrued = lateFeeValue;
    }
  }

  if (lateFeeCap > 0) lateFeeAccrued = Math.min(lateFeeAccrued, lateFeeCap);

  const totalDue = toMoney(baseRemaining + lateFeeAccrued);
  return {
    totalFees,
    paidAmount,
    baseRemaining,
    dueDate,
    overdueDays,
    lateFeeAccrued,
    totalDue,
    feeStatus: totalDue <= 0 ? "Paid" : "Pending",
  };
};

module.exports = {
  calculateLateFeeState,
  resolveDueDate,
  toMoney,
};
