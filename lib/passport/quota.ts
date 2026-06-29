export const quotaMap = new Map<string, { count: number; date: string }>();

function getUTCDayString(date: Date): string {
  return date.toISOString().split("T")[0]; // yyyy-mm-dd
}

function getNextUTCMidnight(date: Date): string {
  const next = new Date(date);
  next.setUTCHours(24, 0, 0, 0);
  return next.toISOString();
}

export function checkAndRecordQuota(adminAddress: string, now: Date = new Date()) {
  const quotaStr = process.env.PASSPORT_DAILY_QUOTA || "100";
  const quota = parseInt(quotaStr, 10);
  const today = getUTCDayString(now);
  const resetsAt = getNextUTCMidnight(now);

  let record = quotaMap.get(adminAddress);
  if (!record || record.date !== today) {
    record = { count: 0, date: today };
    quotaMap.set(adminAddress, record);
  }

  if (record.count >= quota) {
    return {
      ok: false,
      error: "daily_quota_exceeded",
      quota,
      issued: record.count,
      resetsAt,
    };
  }

  record.count += 1;
  return { ok: true };
}

export function getQuotaStatus(adminAddress: string, now: Date = new Date()) {
  const quotaStr = process.env.PASSPORT_DAILY_QUOTA || "100";
  const quota = parseInt(quotaStr, 10);
  const today = getUTCDayString(now);
  const resetsAt = getNextUTCMidnight(now);

  const record = quotaMap.get(adminAddress);
  let count = 0;
  if (record && record.date === today) {
    count = record.count;
  }

  return {
    quota,
    issued: count,
    remaining: Math.max(0, quota - count),
    resetsAt,
  };
}
