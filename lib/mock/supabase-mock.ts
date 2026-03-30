/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * In-browser mock Supabase client. Tables and auth match app expectations.
 * Do not import this directly from features — use `lib/supabase.ts` only.
 */
import {
  getMockDb,
  setMockDb,
  notifyPostgres,
  readMockSession,
  registerPassword,
  verifyPassword,
  writeMockSession,
  clearMockSession,
  emitAuth,
  bookingTimeKey,
  statusBlocksBooking,
  subscribePostgres,
  onAuthStateChange,
  type MockDatabase,
  type MockRow,
  type SessionShape,
} from "./db-state";
import { isMockMode } from "./flags";

function err(msg: string, code = ""): any {
  return { message: msg, code, details: "", hint: "", statusCode: 400 };
}

function newId(prefix: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function matchesFilter(row: MockRow, col: string, val: unknown, op: "eq" | "in"): boolean {
  const cell = row[col];
  if (op === "eq") return cell === val;
  if (op === "in" && Array.isArray(val)) return val.includes(cell);
  return false;
}

function filterRows(rows: MockRow[], filters: { col: string; val: unknown; op: "eq" | "in" }[]) {
  return rows.filter((row) => filters.every((f) => matchesFilter(row, f.col, f.val, f.op)));
}

function tableRows(table: string, database: MockDatabase): MockRow[] {
  const k = table as keyof MockDatabase;
  if (!(k in database)) return [];
  return database[k] as MockRow[];
}

function fkTable(fkCol: string): keyof MockDatabase | null {
  if (fkCol === "service_id") return "services";
  if (fkCol === "specialist_id") return "specialists";
  if (fkCol === "business_id") return "businesses";
  if (fkCol === "owner_id") return "profiles";
  return null;
}

function expandSelect(
  table: string,
  rows: MockRow[],
  selectStr: string,
  database: MockDatabase,
): MockRow[] {
  const normalized = selectStr.replace(/\s+/g, " ").trim();
  if (!normalized.includes(":")) return rows.map((r) => ({ ...r }));
  const segments = normalized.split(",").map((s) => s.trim()).filter(Boolean);
  const embeds: { alias: string; fk: string; cols: string[] }[] = [];
  for (const seg of segments) {
    const m = seg.match(/^(\w+):(\w+)\(([^)]*)\)$/);
    if (m) {
      const cols = m[3] ? m[3].split(/\s+/).join("").split(",").filter(Boolean) : [];
      embeds.push({ alias: m[1], fk: m[2], cols: cols.length ? cols : ["*"] });
    }
  }
  if (embeds.length === 0) return rows.map((r) => ({ ...r }));

  return rows.map((row) => {
    const out = { ...row };
    for (const { alias, fk, cols } of embeds) {
      const refTable = fkTable(fk);
      if (!refTable) continue;
      const refId = row[fk] as string | undefined;
      const ref = (database[refTable] as MockRow[]).find((x) => x.id === refId);
      if (!ref) {
        (out as any)[alias] = null;
        continue;
      }
      if (cols.includes("*") || cols.length === 0) {
        (out as any)[alias] = { ...ref };
      } else {
        const slice: MockRow = {};
        for (const c of cols) {
          if (c in ref) slice[c] = ref[c];
        }
        (out as any)[alias] = slice;
      }
    }
    return out;
  });
}

type Filter = { col: string; val: unknown; op: "eq" | "in" };

class MockChain implements PromiseLike<{ data: any; error: any }> {
  table: string;
  op: "select" | "insert" | "update" | "delete" | null = null;
  filters: Filter[] = [];
  selectStr = "*";
  countHead = false;
  orderCol?: string;
  orderAsc = true;
  wantSingle = false;
  insertRows?: MockRow | MockRow[];
  patch?: MockRow;
  postInsertSelect = false;

  constructor(table: string) {
    this.table = table;
  }

  select(s = "*", opts?: { count?: string; head?: boolean }) {
    if (this.op === "insert") {
      this.postInsertSelect = true;
      this.selectStr = s;
      if (opts?.head) this.countHead = true;
      return this;
    }
    this.op = "select";
    this.selectStr = s;
    if (opts?.head) this.countHead = true;
    return this;
  }

  insert(data: MockRow | MockRow[]) {
    this.op = "insert";
    this.insertRows = data;
    return this;
  }

  update(data: MockRow) {
    this.op = "update";
    this.patch = data;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ col, val, op: "eq" });
    return this;
  }

  in(col: string, vals: unknown[]) {
    this.filters.push({ col, val: vals, op: "in" });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }

  single() {
    this.wantSingle = true;
    return this;
  }

  maybeSingle() {
    this.wantSingle = true;
    return this;
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled as any, onrejected as any);
  }

  private execute(): { data: any; error: any; count?: number } {
    const database = getMockDb();
    const key = this.table as keyof MockDatabase;
    if (!(key in database)) {
      return { data: null, error: err(`Unknown table: ${this.table}`) };
    }

    const list = tableRows(this.table, database);

    if (this.op === "select" || (this.op === null && this.countHead)) {
      if (this.op === null) this.op = "select";
      let rows = filterRows(list, this.filters);
      if (this.orderCol) {
        rows = [...rows].sort((a, b) => {
          const av = a[this.orderCol!] as string | number;
          const bv = b[this.orderCol!] as string | number;
          if (av < bv) return this.orderAsc ? -1 : 1;
          if (av > bv) return this.orderAsc ? 1 : -1;
          return 0;
        });
      }
      if (this.countHead) {
        return { data: null, error: null, count: rows.length };
      }
      rows = expandSelect(this.table, rows, this.selectStr, database);
      if (this.wantSingle) {
        if (rows.length === 0) {
          return {
            data: null,
            error: err("JSON object requested, multiple (or no) rows returned", "PGRST116"),
          };
        }
        if (rows.length > 1)
          return { data: null, error: err("multiple rows returned") };
        return { data: rows[0], error: null };
      }
      return { data: rows, error: null };
    }

    if (this.op === "insert" && this.insertRows !== undefined) {
      const incoming = Array.isArray(this.insertRows) ? this.insertRows : [this.insertRows];
      const next = { ...database } as MockDatabase;
      const arr = [...((next[key] as MockRow[]) || [])];
      const inserted: MockRow[] = [];

      for (const raw of incoming) {
        const row = { ...raw } as MockRow;
        if (!row.id) row.id = newId(this.table);
        if (!row.created_at) row.created_at = new Date().toISOString();
        if (!row.updated_at) row.updated_at = new Date().toISOString();

        if (this.table === "bookings") {
          const bid = row.business_id as string;
          const biz = next.businesses.find((b) => b.id === bid);
          if (!biz || biz.subscription_status !== "ACTIVE") {
            return {
              data: null,
              error: err("Business subscription is not active", "42501"),
            };
          }
          /* eslint-disable @typescript-eslint/no-unused-vars */
          const t = bookingTimeKey(String(row.booking_time));
          const sid = row.specialist_id as string;
          const bdate = String(row.booking_date);
          const conflictFinal = [...arr, ...inserted].some(
            (b) =>
              b.specialist_id === sid &&
              String(b.booking_date) === bdate &&
              bookingTimeKey(String(b.booking_time)) === t &&
              statusBlocksBooking(b.status),
          );
          if (conflictFinal) {
            return {
              data: null,
              error: err(
                "This time slot is already booked. Please select another time.",
                "23505",
              ),
            };
          }
          row.booking_time = t;
          if (row.status == null) row.status = "confirmed";
        }

        arr.push(row);
        inserted.push(row);
      }

      (next as any)[key] = arr;
      setMockDb(next);
      notifyPostgres();

      if (this.postInsertSelect) {
        const rowsOut = expandSelect(this.table, inserted, this.selectStr, getMockDb());
        if (this.wantSingle) {
          return { data: rowsOut[0] ?? null, error: null };
        }
        return { data: rowsOut, error: null };
      }
      return { data: null, error: null };
    }

    if (this.op === "update" && this.patch) {
      const next = { ...database } as MockDatabase;
      const arr = [...((next[key] as MockRow[]) || [])];
      let touched = false;
      for (let i = 0; i < arr.length; i++) {
        const row = arr[i];
        if (this.filters.every((f) => matchesFilter(row, f.col, f.val, f.op))) {
          arr[i] = {
            ...row,
            ...this.patch,
            updated_at: new Date().toISOString(),
          };
          touched = true;
        }
      }
      if (!touched && this.wantSingle) {
        return { data: null, error: err("no rows updated", "PGRST116") };
      }
      (next as any)[key] = arr;
      setMockDb(next);
      notifyPostgres();
      return { data: null, error: null };
    }

    if (this.op === "delete") {
      const next = { ...database } as MockDatabase;
      const arr = ((next[key] as MockRow[]) || []).filter(
        (row) => !this.filters.every((f) => matchesFilter(row, f.col, f.val, f.op)),
      );
      (next as any)[key] = arr;
      setMockDb(next);
      notifyPostgres();
      return { data: null, error: null };
    }

    return { data: null, error: err("Invalid query chain") };
  }
}

function createAuth() {
  return {
    async getSession() {
      const session = readMockSession();
      return { data: { session: session as any }, error: null };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const e = email.trim().toLowerCase();
      if (!verifyPassword(e, password)) {
        return {
          data: { session: null, user: null },
          error: err("Invalid login credentials", "invalid_credentials"),
        };
      }
      const profile = getMockDb().profiles.find((p) => String(p.email).toLowerCase() === e);
      if (!profile) {
        return {
          data: { session: null, user: null },
          error: err("Invalid login credentials"),
        };
      }
      writeMockSession(profile.id as string);
      const session: SessionShape = {
        user: { id: profile.id as string, email: profile.email as string },
        access_token: "mock-token",
      };
      emitAuth("SIGNED_IN", session);
      return { data: { session: session as any, user: session.user }, error: null };
    },

    async signUp({ email, password }: { email: string; password: string }) {
      const e = email.trim().toLowerCase();
      if (getMockDb().profiles.some((p) => String(p.email).toLowerCase() === e)) {
        return {
          data: { user: null },
          error: err("User already registered", "signup_disabled"),
        };
      }
      registerPassword(e, password);
      const userId = newId("user");
      writeMockSession(userId);
      emitAuth("SIGNED_IN", {
        user: { id: userId, email: e },
        access_token: "mock-token",
      });
      return { data: { user: { id: userId, email: e } as any }, error: null };
    },

    async signOut() {
      clearMockSession();
      emitAuth("SIGNED_OUT", null);
      return { error: null };
    },

    async updateUser(attrs: { email?: string }) {
      const s = readMockSession();
      if (!s?.user?.id) return { data: { user: null }, error: err("Not signed in") };
      const next = { ...getMockDb() };
      next.profiles = next.profiles.map((p) =>
        p.id === s.user.id ? { ...p, ...(attrs.email ? { email: attrs.email } : {}) } : p,
      );
      setMockDb(next);
      notifyPostgres();
      return { data: { user: s.user as any }, error: null };
    },

    onAuthStateChange,
  };
}

function createStorage() {
  return {
    from(_bucket: string) {
      return {
        upload: async (path: string) => {
          notifyPostgres();
          return { data: { path, fullPath: path }, error: null };
        },
        getPublicUrl(path: string) {
          return {
            data: {
              publicUrl: `https://mock-cdn.therapy.local/${path.replace(/^\/+/, "")}`,
            },
          };
        },
      };
    },
  };
}

export function createMockSupabaseClient() {
  if (typeof window !== "undefined" && !isMockMode()) {
    console.warn("Mock Supabase client used while NEXT_PUBLIC_USE_MOCK is not true");
  }

  return {
    auth: createAuth(),
    storage: createStorage(),
    from(table: string) {
      return new MockChain(table);
    },
    channel(_name: string) {
      const unsubs: Array<() => void> = [];
      const ch = {
        on(_evt: string, _cfg: { filter?: string; schema?: string; table?: string }, cb: () => void) {
          unsubs.push(subscribePostgres(cb));
          return ch;
        },
        subscribe(cb?: (status: string) => void) {
          cb?.("SUBSCRIBED");
          return {
            unsubscribe: () => {
              unsubs.forEach((u) => u());
              unsubs.length = 0;
            },
          };
        },
      };
      return ch;
    },
    removeChannel(sub: { unsubscribe?: () => void } | null | undefined) {
      sub?.unsubscribe?.();
    },
  };
}
