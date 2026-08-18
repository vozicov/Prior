import { useEffect, useRef, useState } from "react";
import { runAssistant } from "../lib/ai";
import { getChatHistory, saveChatHistory, clearChatHistory } from "../lib/db";
import type { AppSettings, ChatMessage } from "../lib/types";

interface DisplayMessage {
  role: "user" | "assistant" | "system";
  text: string;
  toolsUsed?: string[];
}

const TOOL_LABELS: Record<string, string> = {
  list_todos: "جستجوی کارها",
  create_todo: "ساخت کار",
  update_todo: "ویرایش کار",
  move_todo: "جابه‌جایی کار",
  delete_todo: "حذف کار",
};

const TOOL_ICONS: Record<string, React.ReactNode> = {
  list_todos: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  create_todo: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  update_todo: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  move_todo: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L1 21h15L12 2z" />
    </svg>
  ),
  delete_todo: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

export default function ChatSidebar({
  onTodosChanged,
  onOpenSettings,
  settings,
}: {
  onTodosChanged: () => Promise<void>;
  onOpenSettings: () => void;
  settings: AppSettings | null;
}) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [display, setDisplay] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getChatHistory().then((saved) => {
      setHistory(saved);
      const displayMessages = saved
        .filter((m) => m.role !== "tool")
        .map((m) => ({ role: m.role as "user" | "assistant" | "system", text: m.content, toolsUsed: m.tool_calls?.map((tc) => tc.function.name) }));
      if (displayMessages.length > 0) {
        setDisplay(displayMessages);
      } else {
        setDisplay([
          {
            role: "assistant",
            text: "سلام! من دستیار PRIOR هستم. می‌تونم کارهات رو بسازم، ویرایش کنم یا جابه‌جا کنم. مثلاً بگو «فردا ساعت ۱۰ صبح یادم بنداز به دکتر زنگ بزنم» یا «کار گزارش هفتگی رو ببر توی ستون در حال انجام».",
          },
        ]);
      }
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [display, busy]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const configured = Boolean(settings?.base_url && settings?.api_key);

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;
    if (!configured) {
      onOpenSettings();
      return;
    }

    setInput("");
    setBusy(true);

    try {
      const userMessage: ChatMessage = { role: "user", content: text };
      const newHistory = [...history, userMessage];
      setHistory(newHistory);
      setDisplay((d) => [...d, { role: "user", text }]);
      await saveChatHistory(newHistory);

      const result = await runAssistant(settings!, newHistory, text);
      setHistory(result.history);
      setDisplay((d) => [
        ...d,
        { role: "assistant", text: result.reply, toolsUsed: result.toolsUsed },
      ]);
      await saveChatHistory(result.history);
      if (result.toolsUsed.length > 0) {
        await onTodosChanged();
      }
    } catch (e) {
      setDisplay((d) => [
        ...d,
        { role: "system", text: e instanceof Error ? e.message : String(e) },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function handleClearHistory() {
    if (!window.confirm("آیا مطمئن هستید که می‌خواهید کل تاریخچه چت حذف شود؟")) return;
    setHistory([]);
    setDisplay([
      {
        role: "assistant",
        text: "سلام! من دستیار PRIOR هستم. می‌تونم کارهات رو بسازم، ویرایش کنم یا جابه‌جا کنم. مثلاً بگو «فردا ساعت ۱۰ صبح یادم بنداز به دکتر زنگ بزنم» یا «کار گزارش هفتگی رو ببر توی ستون در حال انجام».",
      },
    ]);
    await clearChatHistory();
  }

  return (
    <aside className="w-80 shrink-0 border-l border-line bg-white flex flex-col">
      <header className="px-5 py-4 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center text-paper font-bold" style={{ backgroundColor: "#FF5A36" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l1.8 5.6L19.4 9l-5.6 1.8L12 16l-1.8-5.2L4.6 9l5.6-1.4L12 2z" />
            </svg>
          </span>
          <div>
            <h2 className="text-title font-semibold text-ink">دستیار PRIOR</h2>
            <p className="text-caption text-muted">هوش مصنوعی برای مدیریت کارها</p>
          </div>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            title="پاک کردن تاریخچه چت"
            className="btn-ghost text-caption px-3 py-1.5 hover:text-signal hover:bg-signal/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            پاک کردن
          </button>
        )}
      </header>

      {!configured && (
        <div className="m-4 p-4 rounded-lg border border-signal/20 bg-signal/5">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-signal shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-signal font-medium">دستیار فعال نیست</p>
              <p className="text-caption text-muted mt-1">برای فعال‌سازی، آدرس API و کلید را در
                <button onClick={onOpenSettings} className="underline hover:text-signal font-medium">
                  تنظیمات
                </button>
                وارد کن.
              </p>
            </div>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {display.map((m, i) => (
          <Bubble key={i} message={m} />
        ))}
        {busy && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-line/50 text-caption text-muted">
              <Dot delay="0ms" />
              <Dot delay="120ms" />
              <Dot delay="240ms" />
              <span>در حال فکر کردن…</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-line bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={configured ? "از دستیار بخواه کاری بسازد یا جابه‌جا کند…" : "ابتدا تنظیمات API را کامل کنید"}
            rows={2}
            className="input-base resize-none flex-1"
            disabled={busy || !configured}
            aria-label="پیام به دستیار"
          />
          <button
            onClick={handleSend}
            disabled={busy || !input.trim() || !configured}
            className="btn-primary shrink-0 w-12 h-12 p-0"
            aria-label="ارسال پیام"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="12" x2="20" y2="12" />
              <polyline points="15 5 20 12 15 19" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

function Bubble({ message }: { message: DisplayMessage }) {
  if (message.role === "system") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-signal/10 border border-signal/20 text-signal text-body-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {message.text}
      </div>
    );
  }

  const isUser = message.role === "user";
  return (
    <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-body leading-relaxed ${
          isUser
            ? "bg-signal text-paper rounded-tr-sm"
            : "bg-white border border-line rounded-tl-sm shadow-subtle"
        }`}
      >
        {message.text}
      </div>

      {message.toolsUsed && message.toolsUsed.length > 0 && (
        <div className="flex flex-wrap gap-1.5 ml-1">
          {message.toolsUsed.map((t, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-signal/10 text-signal text-caption font-medium border border-signal/20"
            >
              {TOOL_ICONS[t]}
              {TOOL_LABELS[t] ?? t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="w-2 h-2 rounded-full bg-signal animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}