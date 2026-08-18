export type TodoStatus = "new" | "doing" | "finished";

export interface Todo {
  id: number;
  title: string;
  notes: string | null;
  status: TodoStatus;
  /** Jalali date in "YYYY-MM-DD" form, e.g. "1403-05-24". Null = not scheduled. */
  jalali_date: string | null;
  /** 24h time in "HH:MM" (Tehran local time), e.g. "14:30". Null = no time set. */
  time: string | null;
  duration_minutes: number | null;
  color: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export type NewTodo = Omit<Todo, "id" | "created_at" | "updated_at" | "position"> & {
  position?: number;
};

export interface AppSettings {
  base_url: string; // OpenAI-compatible base, e.g. https://api.openai.com/v1
  api_key: string;
  model: string; // e.g. gpt-4o-mini
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: OpenAIToolCall[];
  name?: string;
}

export interface OpenAIToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}
