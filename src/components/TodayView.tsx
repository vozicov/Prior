import { useMemo, useState } from "react";
import {
  formatJalaliFriendly,
  formatJalaliYMD,
  parseJalaliString,
  todayJalali,
  toPersianDigits,
  weekAround,
  weekdayName,
} from "../lib/jalali";
import { updateTodo } from "../lib/db";
import type { JalaliYMD } from "../lib/jalali";
import type { Todo } from "../lib/types";

const STATUS_COLORS: Record<Todo["status"], { bg: string; text: string; border: string }> = {
  new: { bg: "#FFF0EB", text: "#FF5A36", border: "#FFD6CC" },
  doing: { bg: "#FFF8F0", text: "#E88D2F", border: "#FFE8CC" },
  finished: { bg: "#F0FFF4", text: "#2F8451", border: "#CCF5DD" },
};

export default function TodayView({
  todos,
  onRefresh,
  onEdit,
}: {
  todos: Todo[];
  onRefresh: () => Promise<void>;
  onEdit: (todo: Todo | "new") => void;
}) {
  const today = useMemo(() => todayJalali(), []);
  const [selected, setSelected] = useState<JalaliYMD>(today);
  const week = useMemo(() => weekAround(selected), [selected]);
  const selectedStr = formatJalaliYMD(selected);
  const todayStr = formatJalaliYMD(today);

  const dayTodos = useMemo(
    () =>
      todos
        .filter((t) => t.jalali_date === selectedStr)
        .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99")),
    [todos, selectedStr]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-8 pt-8 pb-6 border-b border-line">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-display-sm text-ink">{formatJalaliFriendly(selectedStr)}</h1>
            {selectedStr === todayStr && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-signal/10 text-signal text-caption font-medium mt-2">
                امروز
              </span>
            )}
          </div>
          <button
            onClick={() => onEdit("new")}
            className="btn-primary shrink-0"
            aria-label="افزودن کار جدید"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            کار جدید
          </button>
        </div>
      </header>

      <WeekStrip week={week} selectedStr={selectedStr} todayStr={todayStr} onSelect={setSelected} />

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-3">
        {dayTodos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="11" y2="17" />
              </svg>
            </div>
            <p className="empty-state-title">هیچ کاری برای این روز نیست</p>
            <p className="empty-state-desc">روی دکمه «کار جدید» بزن تا اولین تسک رو بسازی</p>
          </div>
        ) : (
          dayTodos.map((todo) => (
            <AgendaRow
              key={todo.id}
              todo={todo}
              onClick={() => onEdit(todo)}
              onToggleDone={async () => {
                await updateTodo(todo.id, {
                  status: todo.status === "finished" ? "new" : "finished",
                });
                await onRefresh();
              }}
            />
          ))
        )}

        <button
          onClick={() => onEdit("new")}
          className="w-full text-start btn-secondary justify-start mt-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          افزودن کار برای این روز
        </button>
      </div>
    </div>
  );
}

function WeekStrip({
  week,
  selectedStr,
  todayStr,
  onSelect,
}: {
  week: JalaliYMD[];
  selectedStr: string;
  todayStr: string;
  onSelect: (d: JalaliYMD) => void;
}) {
  return (
    <div className="px-8 py-4 border-b border-line">
      <div className="flex gap-2" role="tablist" aria-label="روزهای هفته">
        {week.map((d) => {
          const str = formatJalaliYMD(d);
          const isSelected = str === selectedStr;
          const isToday = str === todayStr;
          const colors = isSelected
            ? { bg: "bg-signal", text: "text-paper", border: "border-signal" }
            : isToday
            ? { bg: "bg-signal/10", text: "text-signal", border: "border-signal" }
            : { bg: "bg-transparent", text: "text-muted", border: "border-transparent hover:border-line" };
          return (
            <button
              key={str}
              onClick={() => onSelect(d)}
              role="tab"
              aria-selected={isSelected}
              aria-label={formatJalaliFriendly(str)}
              className={`flex-1 flex flex-col items-center gap-1 rounded-lg py-3 px-2 transition-all duration-fast border ${colors.bg} ${colors.text} ${colors.border}
                ${isSelected ? "shadow-card" : "hover:bg-[#F4F0E8]"}
              `}
            >
              <span className="text-caption font-medium tracking-wider">{weekdayName(d, true)}</span>
              <span className="text-title font-semibold ltr-digits">{toPersianDigits(d.jd)}</span>
              {isToday && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-signal" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AgendaRow({
  todo,
  onClick,
  onToggleDone,
}: {
  todo: Todo;
  onClick: () => void;
  onToggleDone: () => void;
}) {
  const statusColor = STATUS_COLORS[todo.status];
  const isFinished = todo.status === "finished";

  return (
    <article
      onClick={onClick}
      className={`group flex items-start gap-4 rounded-lg border p-4 cursor-pointer transition-all duration-fast
        ${isFinished ? "bg-[#F0FFF4] border-[#CCF5DD]" : "bg-white border-line hover:border-muted/50 hover:shadow-card"}
      `}
      style={{ borderLeft: `4px solid ${statusColor.border}` }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggleDone();
        }}
        className={`shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-fast ${
          isFinished
            ? "bg-signal border-signal text-paper"
            : "border-muted/40 text-transparent hover:border-signal hover:bg-signal/5"
        }`}
        aria-label={isFinished ? "علامت‌گذاری به عنوان انجام‌نشده" : "علامت‌گذاری به عنوان انجام‌شده"}
        aria-pressed={isFinished}
      >
        {isFinished && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-body leading-relaxed break-words ${isFinished ? "line-through text-muted" : "text-ink"}`}
        >
          {todo.title}
        </p>

        {(todo.time || todo.jalali_date || todo.duration_minutes) && (
          <div className="flex items-center gap-3 mt-2 text-caption text-muted ltr-digits">
            {todo.time && (
              <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {toPersianDigits(todo.time)}
              </span>
            )}
            {todo.jalali_date && (
              <span className="inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formatJalaliFriendly(todo.jalali_date)}
              </span>
            )}
            {todo.duration_minutes && (
              <span className="inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {toPersianDigits(todo.duration_minutes)} دقیقه
              </span>
            )}
          </div>
        )}

        {todo.notes && (
          <p className="mt-2 text-body-sm text-muted/80 line-clamp-2">{todo.notes}</p>
        )}
      </div>

      <span className={`badge shrink-0 ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
        {todo.status === "new" && "جدید"}
        {todo.status === "doing" && "در حال انجام"}
        {todo.status === "finished" && "انجام‌شده"}
      </span>
    </article>
  );
}

export { parseJalaliString };