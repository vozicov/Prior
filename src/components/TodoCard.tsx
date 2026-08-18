import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatJalaliShort, toPersianDigits } from "../lib/jalali";
import type { Todo } from "../lib/types";

const STATUS_COLORS: Record<Todo["status"], { bg: string; text: string; border: string; icon: string }> = {
  new: { bg: "#FFF0EB", text: "#FF5A36", border: "#FFD6CC", icon: "#FF5A36" },
  doing: { bg: "#FFF8F0", text: "#E88D2F", border: "#FFE8CC", icon: "#E88D2F" },
  finished: { bg: "#F0FFF4", text: "#2F8451", border: "#CCF5DD", icon: "#2F8451" },
};

const STATUS_ICONS: Record<Todo["status"], React.ReactNode> = {
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

interface TodoCardProps {
  todo: Todo;
  onClick?: () => void;
  dragHandleProps?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragAttributes?: any;
  isDragging?: boolean;
  isDraggingOverlay?: boolean;
  setNodeRef?: (el: HTMLElement | null) => void;
  style?: React.CSSProperties;
}

export function TodoCard({
  todo,
  onClick,
  dragHandleProps,
  dragAttributes,
  isDragging,
  isDraggingOverlay,
  setNodeRef,
  style,
}: TodoCardProps) {
  const colors = STATUS_COLORS[todo.status];
  const isFinished = todo.status === "finished";

  const combinedStyle: React.CSSProperties = {
    ...style,
    ...(isDraggingOverlay && {
      boxShadow: "0 12px 40px rgba(23, 23, 23, 0.12), 0 4px 12px rgba(23, 23, 23, 0.08)",
      transform: "rotate(2deg)",
      zIndex: 1000,
    }),
  };

  return (
    <article
      ref={setNodeRef}
      style={combinedStyle}
      {...dragAttributes}
      {...dragHandleProps}
      onClick={onClick}
      className={`group relative flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all duration-fast
        ${isFinished
          ? "bg-[#F0FFF4] border-[#CCF5DD]"
          : "bg-white border-line hover:border-muted/50 hover:shadow-card"}
        ${isDragging ? "opacity-30 pointer-events-none" : ""}
        ${isDraggingOverlay ? "shadow-dragging rotate-[2deg]" : ""}
      `}
      aria-grabbed={isDragging}
    >
      {/* Status indicator bar on left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: colors.icon }}
        aria-hidden="true"
      />

      {/* Drag handle - only visible on hover or focus */}
      <button
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-muted/40 hover:text-muted hover:bg-line/50 transition-all duration-fast opacity-0 group-hover:opacity-100 focus-visible:opacity-100 -ml-2 mr-1"
        aria-label="جابجایی کار"
        tabIndex={-1}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="9" y1="5" x2="9" y2="19" />
          <line x1="15" y1="5" x2="15" y2="19" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`text-body font-medium leading-snug break-words pr-4 ${isFinished ? "line-through text-muted" : "text-ink"}`}
          >
            {todo.title}
          </h3>

          <span
            className={`badge shrink-0 ${colors.bg} ${colors.text} border ${colors.border}`}
          >
            <span className="flex items-center gap-1.5">
              <span style={{ color: colors.icon }}>{STATUS_ICONS[todo.status]}</span>
              {todo.status === "new" && "جدید"}
              {todo.status === "doing" && "در حال انجام"}
              {todo.status === "finished" && "انجام‌شده"}
            </span>
          </span>
        </div>

        {(todo.time || todo.jalali_date || todo.duration_minutes) && (
          <div className="flex flex-wrap items-center gap-3 mt-3 text-caption text-muted ltr-digits">
            {todo.time && (
              <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {toPersianDigits(todo.time)}
              </span>
            )}
            {todo.jalali_date && (
              <span className="inline-flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formatJalaliShort(todo.jalali_date)}
              </span>
            )}
            {todo.duration_minutes && (
              <span className="inline-flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {toPersianDigits(todo.duration_minutes)} دقیقه
              </span>
            )}
          </div>
        )}

        {todo.notes && (
          <p className="mt-3 text-body-sm text-muted/80 line-clamp-2 border-t border-line/50 pt-3">
            {todo.notes}
          </p>
        )}
      </div>
    </article>
  );
}

/** Drag-and-drop enabled wrapper around TodoCard, for use inside a SortableContext. */
export function SortableTodoCard({
  todo,
  onClick,
  isDraggingOverlay,
}: {
  todo: Todo;
  onClick?: () => void;
  isDraggingOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TodoCard
      todo={todo}
      onClick={onClick}
      setNodeRef={setNodeRef}
      style={style}
      dragAttributes={attributes}
      dragHandleProps={listeners}
      isDragging={isDragging}
      isDraggingOverlay={isDraggingOverlay}
    />
  );
}