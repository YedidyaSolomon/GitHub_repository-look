import seed from "./seed.json";
import { MOCK_DEMO_ACCOUNTS } from "./credentials";

export type MockRow = Record<string, unknown>;

export interface MockDatabase {
  profiles: MockRow[];
  businesses: MockRow[];
  specialists: MockRow[];
  specialist_work_hours: MockRow[];
  services: MockRow[];
  bookings: MockRow[];
  transactions: MockRow[];
  subscriptions: MockRow[];
}

const SESSION_KEY = "therapy-mock-session";

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

let db: MockDatabase = deepClone(seed) as unknown as MockDatabase;

/** Email (lowercase) -> password for sign-in and new sign-ups */
const passwordByEmail: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const acc of Object.values(MOCK_DEMO_ACCOUNTS)) {
    m[acc.email.toLowerCase()] = acc.password;
  }
  return m;
})();

const pgListeners: Array<() => void> = [];

const authListeners = new Set<(event: string, session: SessionShape | null) => void>();

export type SessionShape = {
  user: { id: string; email?: string };
  access_token: string;
};

export function resetMockDatabase() {
  db = deepClone(seed) as unknown as MockDatabase;
  for (const acc of Object.values(MOCK_DEMO_ACCOUNTS)) {
    passwordByEmail[acc.email.toLowerCase()] = acc.password;
  }
  notifyPostgres();
}

export function getMockDb(): MockDatabase {
  return db;
}

export function setMockDb(next: MockDatabase) {
  db = next;
  notifyPostgres();
}

export function registerPassword(email: string, password: string) {
  passwordByEmail[email.trim().toLowerCase()] = password;
}

export function verifyPassword(email: string, password: string): boolean {
  return passwordByEmail[email.trim().toLowerCase()] === password;
}

export function readMockSession(): SessionShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { userId } = JSON.parse(raw) as { userId: string };
    const profile = db.profiles.find((p) => p.id === userId);
    return {
      user: { id: userId, email: profile?.email as string | undefined },
      access_token: "mock-token",
    };
  } catch {
    return null;
  }
}

export function writeMockSession(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
}

export function clearMockSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function emitAuth(event: string, session: SessionShape | null) {
  authListeners.forEach((fn) => {
    try {
      fn(event, session);
    } catch {
      /* ignore */
    }
  });
}

export function onAuthStateChange(
  fn: (event: string, session: SessionShape | null) => void,
) {
  authListeners.add(fn);
  queueMicrotask(() => {
    fn("INITIAL_SESSION", readMockSession());
  });
  const subscription = {
    unsubscribe: () => {
      authListeners.delete(fn);
    },
  };
  return { data: { subscription } };
}

export function subscribePostgres(listener: () => void) {
  pgListeners.push(listener);
  return () => {
    const i = pgListeners.indexOf(listener);
    if (i >= 0) pgListeners.splice(i, 1);
  };
}

export function notifyPostgres() {
  pgListeners.forEach((l) => {
    try {
      l();
    } catch {
      /* ignore */
    }
  });
}

export function bookingTimeKey(t: string): string {
  const p = String(t).trim();
  const parts = p.split(":");
  const h = parts[0] ?? "00";
  const m = (parts[1] ?? "00").slice(0, 2);
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

export function statusBlocksBooking(status: unknown): boolean {
  const s = String(status ?? "").toLowerCase();
  return s !== "cancelled" && s !== "canceled";
}
