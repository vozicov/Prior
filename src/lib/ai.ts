import { fetch } from "@tauri-apps/plugin-http";
import { createTodo, deleteTodo, listTodos, moveTodo, updateTodo } from "./db";
import { todayJalaliString } from "./jalali";
import type { AppSettings, ChatMessage, OpenAIToolCall, TodoStatus } from "./types";

const SYSTEM_PROMPT = `تو یک دستیار مدیریت کارها (تودو) هستی که در یک اپ دسکتاپ شخصی کار می‌کنی.
تاریخ امروز به‌صورت شمسی «${todayJalaliString()}» است.
با ابزارهایی که در اختیار داری می‌توانی کارها را بسازی، ویرایش کنی، جابه‌جا کنی (بین ستون‌های new/doing/finished) یا حذف کنی.
همیشه قبل از تغییرات مبهم یا حذف چیزی، اگر مطمئن نیستی کدام کار مدنظر کاربر است، اول با list_todos جستجو کن.
تاریخ‌ها را به فرمت شمسی YYYY-MM-DD (مثل 1403-05-24) و ساعت را به‌صورت 24 ساعته HH:MM بنویس.
پاسخ نهایی را کوتاه، دوستانه و به فارسی بده و خلاصه‌ای از کاری که انجام دادی بگو.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_todos",
      description:
        "List todos, optionally filtered by status (new/doing/finished) and/or a Jalali date (YYYY-MM-DD). Use this to find a todo's id before editing/moving/deleting it.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["new", "doing", "finished"] },
          jalali_date: { type: "string", description: "Jalali date, e.g. 1403-05-24" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_todo",
      description: "Create a new todo item.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          notes: { type: "string" },
          status: { type: "string", enum: ["new", "doing", "finished"] },
          jalali_date: {
            type: "string",
            description: "Jalali date YYYY-MM-DD this todo is scheduled for, if any",
          },
          time: { type: "string", description: "24h time HH:MM, if a specific time was requested" },
          duration_minutes: { type: "number" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_todo",
      description: "Edit fields of an existing todo by id.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number" },
          title: { type: "string" },
          notes: { type: "string" },
          jalali_date: { type: "string" },
          time: { type: "string" },
          duration_minutes: { type: "number" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_todo",
      description: "Move a todo to a different status column (new, doing, finished).",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number" },
          status: { type: "string", enum: ["new", "doing", "finished"] },
        },
        required: ["id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_todo",
      description: "Permanently delete a todo by id.",
      parameters: {
        type: "object",
        properties: { id: { type: "number" } },
        required: ["id"],
      },
    },
  },
] as const;

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "list_todos":
      return listTodos({
        status: args.status as TodoStatus | undefined,
        jalali_date: args.jalali_date as string | undefined,
      });
    case "create_todo":
      return createTodo({
        title: String(args.title),
        notes: (args.notes as string) ?? null,
        status: (args.status as TodoStatus) ?? "new",
        jalali_date: (args.jalali_date as string) ?? null,
        time: (args.time as string) ?? null,
        duration_minutes: (args.duration_minutes as number) ?? null,
        color: null,
      });
    case "update_todo": {
      const { id, ...rest } = args as { id: number } & Record<string, unknown>;
      return updateTodo(id, rest);
    }
    case "move_todo":
      return moveTodo(args.id as number, args.status as TodoStatus);
    case "delete_todo":
      await deleteTodo(args.id as number);
      return { ok: true };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export interface AssistantTurnResult {
  history: ChatMessage[];
  reply: string;
  toolsUsed: string[];
}

/**
 * Sends the conversation to the configured OpenAI-compatible endpoint, executing
 * any tool calls the model requests against the local database, looping until the
 * model produces a plain text reply (or a safety cap is hit).
 */
export async function runAssistant(
  settings: AppSettings,
  history: ChatMessage[],
  userMessage: string
): Promise<AssistantTurnResult> {
  if (!settings.base_url || !settings.api_key) {
    throw new Error("لطفاً ابتدا آدرس API و کلید آن را در تنظیمات وارد کن.");
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: userMessage },
  ];

  const toolsUsed: string[] = [];
  const MAX_ROUNDS = 6;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const res = await fetch(`${settings.base_url.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.api_key}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: messages.map(stripForApi),
        tools: TOOLS,
        tool_choice: "auto",
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`خطای API (${res.status}): ${errText || res.statusText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const message = choice?.message;
    if (!message) throw new Error("پاسخ نامعتبر از سرور دریافت شد.");

    const toolCalls: OpenAIToolCall[] | undefined = message.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      messages.push({ role: "assistant", content: message.content ?? "" });
      return {
        history: messages.slice(1), // drop the system prompt from stored history
        reply: message.content ?? "",
        toolsUsed,
      };
    }

    // Record the assistant's tool-call turn, then run each tool and append results.
    messages.push({
      role: "assistant",
      content: message.content ?? "",
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      let result: unknown;
      try {
        const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        result = await executeTool(call.function.name, args);
        toolsUsed.push(call.function.name);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) };
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content: JSON.stringify(result),
      });
    }
  }

  throw new Error("دستیار نتوانست در تعداد مراحل مجاز به پاسخ نهایی برسد.");
}

function stripForApi(m: ChatMessage) {
  // OpenAI-compatible APIs reject unknown/empty fields on some providers; keep it minimal.
  const base: Record<string, unknown> = { role: m.role, content: m.content };
  if (m.tool_call_id) base.tool_call_id = m.tool_call_id;
  if (m.tool_calls) base.tool_calls = m.tool_calls;
  if (m.name) base.name = m.name;
  return base;
}
