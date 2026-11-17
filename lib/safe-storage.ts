/** Browser-local preferences are optional; they must never block public discovery. */
export function readStoredIds(key: string): number[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is number => Number.isSafeInteger(id) && id > 0)
      : [];
  } catch {
    return [];
  }
}

export function readStoredCount(key: string): number {
  try {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw.trim() === "") return 0;
    const value = Number(raw);
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function writeStoredValue(key: string, value: string): boolean {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
