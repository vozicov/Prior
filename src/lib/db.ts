import Database from "@tauri-apps/plugin-sql";
import type { AppSettings, ChatMessage, NewTodo, Todo, TodoStatus } from "./types";

let dbInstance: Database | null = null;

/**
 * Opens (or reuses) the app's SQLite database. Schema is created here rather than
 * through Tauri's migration API to keep the whole data layer in one readable file.
 */
export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  const db = await Database.load("sqlite:todo.db");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','doing','finished')),
      jalali_date TEXT,
      time TEXT,
      duration_minutes INTEGER,
      color TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_todos_date ON todos(jalali_date);`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_call_id TEXT,
      tool_calls TEXT,
      name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  dbInstance = db;
  return db;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ---------- Todos ----------

export async function listTodos(filter?: {
  status?: TodoStatus;
  jalali_date?: string;
}): Promise<Todo[]> {
  const db = await getDb();
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filter?.status) {
    clauses.push(`status = $${params.length + 1}`);
    params.push(filter.status);
  }
  if (filter?.jalali_date) {
    clauses.push(`jalali_date = $${params.length + 1}`);
    params.push(filter.jalali_date);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.select<Todo[]>(
    `SELECT * FROM todos ${where} ORDER BY status, position ASC, id ASC`,
    params
  );
}

export async function getTodo(id: number): Promise<Todo | null> {
  const db = await getDb();
  const rows = await db.select<Todo[]>(`SELECT * FROM todos WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function createTodo(input: NewTodo): Promise<Todo> {
  const db = await getDb();
  const ts = nowIso();

  // New items go to the end of their column.
  const posRows = await db.select<{ maxpos: number | null }[]>(
    `SELECT MAX(position) as maxpos FROM todos WHERE status = $1`,
    [input.status]
  );
  const position = (posRows[0]?.maxpos ?? -1) + 1;

  const result = await db.execute(
    `INSERT INTO todos (title, notes, status, jalali_date, time, duration_minutes, color, position, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      input.title,
      input.notes ?? null,
      input.status ?? "new",
      input.jalali_date ?? null,
      input.time ?? null,
      input.duration_minutes ?? null,
      input.color ?? null,
      position,
      ts,
      ts,
    ]
  );

  const created = await getTodo(result.lastInsertId as number);
  if (!created) throw new Error("Failed to load created todo");
  return created;
}

export async function updateTodo(
  id: number,
  patch: Partial<Omit<Todo, "id" | "created_at">>
): Promise<Todo> {
  const db = await getDb();
  const fields = Object.keys(patch) as (keyof typeof patch)[];
  if (fields.length === 0) {
    const existing = await getTodo(id);
    if (!existing) throw new Error(`Todo ${id} not found`);
    return existing;
  }

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`);
  const params: unknown[] = fields.map((f) => (patch as Record<string, unknown>)[f]);
  setClauses.push(`updated_at = $${params.length + 1}`);
  params.push(nowIso());
  params.push(id);

  await db.execute(
    `UPDATE todos SET ${setClauses.join(", ")} WHERE id = $${params.length}`,
    params
  );

  const updated = await getTodo(id);
  if (!updated) throw new Error(`Todo ${id} not found after update`);
  return updated;
}

export async function moveTodo(
  id: number,
  status: TodoStatus,
  position?: number
): Promise<Todo> {
  const db = await getDb();
  let pos = position;
  if (pos === undefined) {
    const posRows = await db.select<{ maxpos: number | null }[]>(
      `SELECT MAX(position) as maxpos FROM todos WHERE status = $1`,
      [status]
    );
    pos = (posRows[0]?.maxpos ?? -1) + 1;
  }
  return updateTodo(id, { status, position: pos });
}

export async function deleteTodo(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM todos WHERE id = $1`, [id]);
}

export async function reorderWithinStatus(
  status: TodoStatus,
  orderedIds: number[]
): Promise<void> {
  const db = await getDb();
  await Promise.all(
    orderedIds.map((id, index) =>
      db.execute(`UPDATE todos SET position = $1 WHERE id = $2`, [index, id])
    )
  );
}

// ---------- Settings ----------

const DEFAULT_SETTINGS: AppSettings = {
  base_url: "https://api.openai.com/v1",
  api_key: "",
  model: "gpt-4o-mini",
};

export async function getSettings(): Promise<AppSettings> {
  const db = await getDb();
  const rows = await db.select<{ key: string; value: string }[]>(
    `SELECT key, value FROM settings`
  );
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    base_url: map.base_url ?? DEFAULT_SETTINGS.base_url,
    api_key: map.api_key ?? DEFAULT_SETTINGS.api_key,
    model: map.model ?? DEFAULT_SETTINGS.model,
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDb();
  for (const [key, value] of Object.entries(settings)) {
    await db.execute(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    );
  }
}

// ---------- Chat History ----------

export async function getChatHistory(): Promise<ChatMessage[]> {
  const db = await getDb();
  return db.select<ChatMessage[]>(
    `SELECT role, content, tool_call_id, tool_calls, name FROM chat_history ORDER BY id ASC`
  );
}

export async function saveChatHistory(messages: ChatMessage[]): Promise<void> {
  const db = await getDb();
  // Clear existing history and insert new
  await db.execute(`DELETE FROM chat_history`);
  if (messages.length === 0) return;

  await Promise.all(
    messages.map((msg) =>
      db.execute(
        `INSERT INTO chat_history (role, content, tool_call_id, tool_calls, name) VALUES ($1, $2, $3, $4, $5)`,
        [
          msg.role,
          msg.content,
          msg.tool_call_id ?? null,
          msg.tool_calls ? JSON.stringify(msg.tool_calls) : null,
          msg.name ?? null,
        ]
      )
    )
  );
}

export async function clearChatHistory(): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM chat_history`);
}
