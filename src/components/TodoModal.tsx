import { useState, useEffect, useRef } from "react";
import { createTodo, deleteTodo, updateTodo } from "../lib/db";
import { isValidTime, todayJalaliString, toAsciiDigits, toPersianDigits } from "../lib/jalali";
import type { Todo, TodoStatus } from "../lib/types";

const STATUS_OPTIONS: { id: TodoStatus; label: string; color: { bg: string; text: string; border: string; icon: string } }[] = [
  { id: "new", label: "جدید", color: { bg: "#FFF0EB", text: "#FF5A36", border: "#FFD6CC", icon: "#FF5A36" } },
  { id: "doing", label: "در حال انجام", color: { bg: "#FFF8F0", text: "#E88D2F", border: "#FFE8CC", icon: "#E88D2F" } },
  { id: "finished", label: "انجام‌شده", color: { bg: "#F0FFF4", text: "#2F8451", border: "#CCF5DD", icon: "#2F8451" } },
];

const STATUS_ICONS: Record<TodoStatus, React.ReactNode> = {
  new: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  doing: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  finished: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

export default function TodoModal({
  todo,
  onClose,
  onSaved,
}: {
  todo: Todo | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = todo === null;
  const [title, setTitle] = useState(todo?.title ?? "");
  const [notes, setNotes] = useState(todo?.notes ?? "");
  const [status, setStatus] = useState<TodoStatus>(todo?.status ?? "new");
  const [date, setDate] = useState(todo?.jalali_date ?? todayJalaliString());
  const [time, setTime] = useState(todo?.time ?? "");
  const [duration, setDuration] = useState(todo?.duration_minutes?.toString() ?? "");
  const [scheduled, setScheduled] = useState(Boolean(todo?.jalali_date ?? true));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  async function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError("عنوان کار را وارد کن.");
      return;
    }
    const cleanTime = time ? toAsciiDigits(time).trim() : "";
    if (cleanTime && !isValidTime(cleanTime)) {
      setError("ساعت باید به فرمت ۲۴ ساعته HH:MM باشد، مثل ۱۴:۳۰.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        notes: notes.trim() || null,
        status,
        jalali_date: scheduled ? toAsciiDigits(date) : null,
        time: cleanTime || null,
        duration_minutes: duration ? Number(toAsciiDigits(duration)) : null,
        color: null,
      };
      if (isNew) {
        await createTodo(payload);
      } else {
        await updateTodo(todo!.id, payload);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!todo) return;
    if (!window.confirm("آیا مطمئن هستید که می‌خواهید این کار را حذف کنید؟")) return;
    setSaving(true);
    try {
      await deleteTodo(todo.id);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const statusColor = STATUS_OPTIONS.find((s) => s.id === status)?.color ?? STATUS_OPTIONS[0].color;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal-content w-full max-w-[480px] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <h2 id="modal-title" className="text-headline text-ink">{isNew ? "کار جدید" : "ویرایش کار"}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-line/50 transition-all duration-fast"
            aria-label="بستن"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <label htmlFor="title" className="label">عنوان کار</label>
            <input
              ref={titleRef}
              id="title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان کار…"
              className="input-base"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="notes" className="label">یادداشت</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="یادداشت (اختیاری)"
              rows={3}
              className="input-base resize-none"
              disabled={saving}
            />
          </div>

          <div>
            <label className="label">وضعیت</label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="وضعیت کار">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatus(opt.id)}
                  role="radio"
                  aria-checked={status === opt.id}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-medium text-caption transition-all duration-fast
                    ${status === opt.id
                      ? `border-transparent text-paper shadow-card`
                      : `border-line/50 text-muted hover:border-muted hover:text-ink`}
                  `}
                  style={{
                    backgroundColor: status === opt.id ? opt.color.icon : "transparent",
                  }}
                >
                  <span style={{ color: status === opt.id ? "#F4F0E8" : opt.color.icon }}>{STATUS_ICONS[opt.id]}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative flex items-center gap-3 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={scheduled}
                onChange={(e) => setScheduled(e.target.checked)}
                className="sr-only peer"
                aria-label="زمان‌بندی برای یک روز مشخص"
              />
              <span className="w-5 h-5 rounded border-2 border-line/50 peer-checked:border-signal peer-checked:bg-signal peer-checked:text-paper flex items-center justify-center transition-all duration-fast">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className="text-body-sm text-ink peer-checked:font-medium">زمان‌بندی برای یک روز مشخص</span>
            </label>
          </div>

          {scheduled && (
            <div className="grid grid-cols-2 gap-4" role="group" aria-label="تاریخ و ساعت">
              <div>
                <label htmlFor="date" className="label">تاریخ شمسی</label>
                <input
                  id="date"
                  value={toPersianDigits(date)}
                  onChange={(e) => setDate(toAsciiDigits(e.target.value))}
                  placeholder="۱۴۰۳-۰۵-۲۴"
                  className="input-base ltr-digits font-mono text-body"
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="time" className="label">ساعت</label>
                <input
                  id="time"
                  value={toPersianDigits(time)}
                  onChange={(e) => setTime(toAsciiDigits(e.target.value))}
                  placeholder="۱۴:۳۰"
                  className="input-base ltr-digits font-mono text-body"
                  disabled={saving}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="duration" className="label">مدت‌زمان (دقیقه)</label>
            <input
              id="duration"
              value={toPersianDigits(duration)}
              onChange={(e) => setDuration(toAsciiDigits(e.target.value))}
              placeholder="۳۰"
              className="input-base ltr-digits font-mono text-body w-[120px]"
              disabled={saving}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-signal/10 border border-signal/20 text-signal text-body-sm flex items-center gap-2" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-5 border-t border-line flex items-center justify-end gap-3 bg-[#FAF6F0] rounded-b-xl">
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="btn-secondary text-signal border-signal/30 hover:bg-signal/10 hover:border-signal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              حذف
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              disabled={saving}
              className="btn-secondary"
            >
              انصراف
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="btn-primary"
            >
              {saving ? "در حال ذخیره…" : (isNew ? "ساخت" : "ذخیره")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}