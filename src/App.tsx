import { useCallback, useEffect, useState } from "react";
import TodayView from "./components/TodayView";
import BoardView from "./components/BoardView";
import ChatSidebar from "./components/ChatSidebar";
import SettingsModal from "./components/SettingsModal";
import TodoModal from "./components/TodoModal";
import { getSettings, listTodos } from "./lib/db";
import type { AppSettings, Todo } from "./lib/types";

type View = "today" | "board";

export default function App() {
  const [view, setView] = useState<View>("today");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | "new" | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const refresh = useCallback(async () => {
    const rows = await listTodos();
    setTodos(rows);
    setLoading(false);
  }, []);

  const loadSettings = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
  }, []);

  useEffect(() => {
    refresh();
    loadSettings();
  }, [refresh, loadSettings]);

  return (
    <div className="flex h-screen w-screen bg-paper text-ink overflow-hidden">
      <NavRail
        view={view}
        onChangeView={setView}
        onOpenSettings={() => setSettingsOpen(true)}
        onNewTodo={() => setEditingTodo("new")}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((v) => !v)}
      />

      <main className="flex-1 min-w-0 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-signal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-body text-muted">در حال بارگذاری…</p>
            </div>
          </div>
        ) : view === "today" ? (
          <TodayView todos={todos} onRefresh={refresh} onEdit={setEditingTodo} />
        ) : (
          <BoardView todos={todos} onRefresh={refresh} onEdit={setEditingTodo} />
        )}
      </main>

      {chatOpen && (
        <ChatSidebar onTodosChanged={refresh} onOpenSettings={() => setSettingsOpen(true)} settings={settings} />
      )}

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} onSettingsChange={loadSettings} />}

      {editingTodo !== null && (
        <TodoModal
          todo={editingTodo === "new" ? null : editingTodo}
          onClose={() => setEditingTodo(null)}
          onSaved={async () => {
            setEditingTodo(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function NavRail({
  view,
  onChangeView,
  onOpenSettings,
  onNewTodo,
  chatOpen,
  onToggleChat,
}: {
  view: View;
  onChangeView: (v: View) => void;
  onOpenSettings: () => void;
  onNewTodo: () => void;
  chatOpen: boolean;
  onToggleChat: () => void;
}) {
  return (
    <nav className="w-18 shrink-0 border-l border-line bg-white/80 backdrop-blur-sm flex flex-col items-center py-6 gap-1">
      <button
        onClick={onNewTodo}
        title="کار جدید"
        className="w-12 h-12 rounded-lg bg-signal text-paper flex items-center justify-center text-2xl leading-none font-bold
                   hover:bg-signal/90 active:bg-signal active:scale-[0.98]
                   transition-all duration-fast shadow-card
                   focus-visible:ring-2 focus-visible:ring-signal/30"
        aria-label="کار جدید"
      >
        +
      </button>

      <div className="h-px w-full bg-line mx-2 my-2" />

      <NavButton active={view === "today"} label="امروز" onClick={() => onChangeView("today")}>
        <IconSun />
      </NavButton>
      <NavButton active={view === "board"} label="تخته" onClick={() => onChangeView("board")}>
        <IconColumns />
      </NavButton>

      <div className="flex-1" />

      <NavButton active={chatOpen} label="دستیار هوش مصنوعی" onClick={onToggleChat}>
        <IconSpark />
      </NavButton>
      <NavButton active={false} label="تنظیمات" onClick={onOpenSettings}>
        <IconGear />
      </NavButton>
    </nav>
  );
}

function NavButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-fast
        ${active
          ? "bg-signal text-paper shadow-card"
          : "text-muted hover:text-ink hover:bg-[#F4F0E8]"}
      `}
    >
      {children}
    </button>
  );
}

function IconSun() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function IconColumns() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="12" rx="1" />
      <rect x="17" y="3" width="5" height="15" rx="1" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 5.6L19.4 9l-5.6 1.8L12 16l-1.8-5.2L4.6 9l5.6-1.4L12 2z" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}