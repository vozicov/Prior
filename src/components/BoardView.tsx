import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { SortableTodoCard } from "./TodoCard";
import { moveTodo, reorderWithinStatus } from "../lib/db";
import type { Todo, TodoStatus } from "../lib/types";

const COLUMNS: { id: TodoStatus; label: string; icon: React.ReactNode }[] = [
  {
    id: "new",
    label: "جدید",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: "doing",
    label: "در حال انجام",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    id: "finished",
    label: "انجام‌شده",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

const STATUS_COLORS: Record<TodoStatus, { bg: string; text: string; border: string; icon: string }> = {
  new: { bg: "#FFF0EB", text: "#FF5A36", border: "#FFD6CC", icon: "#FF5A36" },
  doing: { bg: "#FFF8F0", text: "#E88D2F", border: "#FFE8CC", icon: "#E88D2F" },
  finished: { bg: "#F0FFF4", text: "#2F8451", border: "#CCF5DD", icon: "#2F8451" },
};

export default function BoardView({
  todos,
  onRefresh,
  onEdit,
}: {
  todos: Todo[];
  onRefresh: () => Promise<void>;
  onEdit: (todo: Todo) => void;
}) {
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const byStatus = useMemo(() => {
    const map: Record<TodoStatus, Todo[]> = { new: [], doing: [], finished: [] };
    for (const t of todos) map[t.status].push(t);
    return map;
  }, [todos]);

  function handleDragStart(e: DragStartEvent) {
    const todo = todos.find((t) => t.id === e.active.id);
    setActiveTodo(todo ?? null);
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveTodo(null);
    const { active, over } = e;
    if (!over) return;

    const activeTodoItem = todos.find((t) => t.id === active.id);
    if (!activeTodoItem) return;

    const overColumn = COLUMNS.find((c) => c.id === over.id)?.id;
    const overTodo = todos.find((t) => t.id === over.id);
    const targetStatus = overColumn ?? overTodo?.status ?? activeTodoItem.status;

    if (targetStatus !== activeTodoItem.status) {
      await moveTodo(activeTodoItem.id, targetStatus);
      await onRefresh();
      return;
    }

    if (overTodo && overTodo.id !== activeTodoItem.id) {
      const ids = byStatus[targetStatus].map((t) => t.id);
      const from = ids.indexOf(activeTodoItem.id);
      const to = ids.indexOf(overTodo.id);
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      await reorderWithinStatus(targetStatus, ids);
      await onRefresh();
    }
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-paper">
      <header className="px-8 pt-8 pb-6 border-b border-line">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-display-sm text-ink">تخته کارها</h1>
            <p className="text-body-sm text-muted mt-1">کارها را بین ستون‌ها بکش و رها کن</p>
          </div>
          <div className="flex items-center gap-2 text-caption text-muted ltr-digits">
            {todos.length} کار
          </div>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto px-8 py-6">
          <div className="flex gap-4 h-full min-w-[980px] pb-4">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                status={col.id}
                label={col.label}
                icon={col.icon}
                items={byStatus[col.id]}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTodo && (
            <SortableTodoCard todo={activeTodo} isDraggingOverlay />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  status,
  label,
  icon,
  items,
  onEdit,
}: {
  status: TodoStatus;
  label: string;
  icon: React.ReactNode;
  items: Todo[];
  onEdit: (todo: Todo) => void;
}) {
  const colors = STATUS_COLORS[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex-1 min-w-[300px] max-w-[340px] flex flex-col">
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col rounded-xl border-2 transition-all duration-fast
          ${isOver
            ? `border-signal bg-signal/5 shadow-elevated`
            : `border-transparent hover:border-line/50`}
        `}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line/50">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-lg flex items-center justify-center text-paper font-medium"
              style={{ backgroundColor: colors.icon }}
              aria-hidden="true"
            >
              {icon}
            </span>
            <div>
              <h2 className="text-title font-semibold text-ink">{label}</h2>
              <p className="text-caption text-muted ltr-digits">{items.length} کار</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {items.map((todo) => (
              <SortableTodoCard key={todo.id} todo={todo} onClick={() => onEdit(todo)} />
            ))}
          </SortableContext>

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center border-2 border-dashed border-line/50 rounded-lg">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted/40 mb-3"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="11" y2="17" />
              </svg>
              <p className="text-body-sm text-muted">کاری اینجا نیست</p>
              <p className="text-caption text-muted/60 mt-1">کارها را اینجا بکش و رها کن</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}