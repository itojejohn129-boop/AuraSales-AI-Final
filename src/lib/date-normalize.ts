function toIsoDateUTC(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isValidYMD(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

function normalizeTwoDigitYear(twoDigitYear: number): number {
  return twoDigitYear >= 70 ? 1900 + twoDigitYear : 2000 + twoDigitYear;
}

function fromExcelSerial(serial: number): string | null {
  if (!Number.isFinite(serial)) return null;
  // Covers common spreadsheet ranges while avoiding random small/huge integers.
  if (serial < 60 || serial > 90000) return null;

  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const date = new Date(utcValue * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return toIsoDateUTC(date);
}

function fromUnixTimestamp(value: number): string | null {
  if (!Number.isFinite(value)) return null;
  // 10-digit seconds timestamp range check.
  if (value >= 1_000_000_000 && value <= 4_102_444_800) {
    const date = new Date(value * 1000);
    if (!Number.isNaN(date.getTime())) return toIsoDateUTC(date);
  }
  // 13-digit milliseconds timestamp range check.
  if (value >= 1_000_000_000_000 && value <= 4_102_444_800_000) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return toIsoDateUTC(date);
  }
  return null;
}

export function normalizeFlexibleDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toIsoDateUTC(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return fromExcelSerial(value) || fromUnixTimestamp(value);
  }

  let raw = String(value).trim();
  if (!raw) return null;

  // Handle values like "+043830-12-3" by extracting a leading serial candidate.
  const leadingNumeric = raw.match(/^[+\-]?(\d{4,6}(?:\.\d+)?)/);
  if (leadingNumeric) {
    const maybeSerial = Number(leadingNumeric[1]);
    const serialIso = fromExcelSerial(maybeSerial);
    if (serialIso) return serialIso;
  }

  // Plain numeric strings (Excel serial / unix ts)
  if (/^[+\-]?\d+(\.\d+)?$/.test(raw)) {
    const n = Number(raw);
    return fromExcelSerial(n) || fromUnixTimestamp(n);
  }

  // Compact YYYYMMDD
  if (/^\d{8}$/.test(raw)) {
    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(4, 6));
    const day = Number(raw.slice(6, 8));
    if (isValidYMD(year, month, day)) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
    }
  }

  // Find a year-first token inside messy text: YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
  const yearFirst = raw.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (yearFirst) {
    const year = Number(yearFirst[1]);
    const month = Number(yearFirst[2]);
    const day = Number(yearFirst[3]);
    if (isValidYMD(year, month, day)) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
    }
  }

  // Day/month/year or month/day/year with 2 or 4-digit year.
  const dmyMdy = raw.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (dmyMdy) {
    const first = Number(dmyMdy[1]);
    const second = Number(dmyMdy[2]);
    const yearRaw = Number(dmyMdy[3]);
    const year = dmyMdy[3].length === 2 ? normalizeTwoDigitYear(yearRaw) : yearRaw;

    // Heuristic:
    // - if first > 12 => day/month
    // - if second > 12 => month/day
    // - if both <= 12 => default to day/month (common invoice formats)
    const day = first > 12 ? first : second > 12 ? second : first;
    const month = first > 12 ? second : second > 12 ? first : second;

    if (isValidYMD(year, month, day)) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
    }
  }

  // Final fallback: native parser for full datetime strings with timezone.
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return toIsoDateUTC(parsed);
  }

  return null;
}

