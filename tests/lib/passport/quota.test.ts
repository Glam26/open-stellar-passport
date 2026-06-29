import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { checkAndRecordQuota, getQuotaStatus, quotaMap } from "../../../lib/passport/quota";

describe("Passport Daily Quota", () => {
  beforeEach(() => {
    quotaMap.clear();
    process.env.PASSPORT_DAILY_QUOTA = "100";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow issuance within quota", () => {
    vi.setSystemTime(new Date("2026-06-27T12:00:00Z"));
    const result = checkAndRecordQuota("admin1");
    expect(result.ok).toBe(true);

    const status = getQuotaStatus("admin1");
    expect(status.issued).toBe(1);
    expect(status.remaining).toBe(99);
  });

  it("should return exact quota hit when exceeding", () => {
    vi.setSystemTime(new Date("2026-06-27T12:00:00Z"));
    process.env.PASSPORT_DAILY_QUOTA = "2";

    expect(checkAndRecordQuota("admin2").ok).toBe(true);
    expect(checkAndRecordQuota("admin2").ok).toBe(true);

    const result = checkAndRecordQuota("admin2");
    expect(result).toEqual({
      ok: false,
      error: "daily_quota_exceeded",
      quota: 2,
      issued: 2,
      resetsAt: "2026-06-28T00:00:00.000Z",
    });
  });

  it("should reset quota at UTC midnight", () => {
    vi.setSystemTime(new Date("2026-06-27T23:59:59Z"));
    process.env.PASSPORT_DAILY_QUOTA = "1";

    expect(checkAndRecordQuota("admin3").ok).toBe(true);
    expect(checkAndRecordQuota("admin3").ok).toBe(false);

    // move to midnight
    vi.setSystemTime(new Date("2026-06-28T00:00:00Z"));
    expect(checkAndRecordQuota("admin3").ok).toBe(true);
    
    const status = getQuotaStatus("admin3");
    expect(status.issued).toBe(1);
    expect(status.remaining).toBe(0);
    expect(status.resetsAt).toBe("2026-06-29T00:00:00.000Z");
  });

  it("should track multi-admin independently", () => {
    vi.setSystemTime(new Date("2026-06-27T12:00:00Z"));
    process.env.PASSPORT_DAILY_QUOTA = "5";

    checkAndRecordQuota("adminA");
    checkAndRecordQuota("adminA");
    checkAndRecordQuota("adminB");

    const statusA = getQuotaStatus("adminA");
    const statusB = getQuotaStatus("adminB");

    expect(statusA.issued).toBe(2);
    expect(statusA.remaining).toBe(3);

    expect(statusB.issued).toBe(1);
    expect(statusB.remaining).toBe(4);
  });
});
