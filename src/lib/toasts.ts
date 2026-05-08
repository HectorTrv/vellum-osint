import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error" | "info";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Action button label + handler (ex. "Undo") */
  action?: { label: string; run: () => void };
  /** Auto-dismiss in ms — defaults to 4000, 7000 if action present */
  duration?: number;
};

type State = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
};

export const useToasts = create<State>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = t.duration ?? (t.action ? 7000 : 4000);
    set({ toasts: [...get().toasts, { ...t, id }] });
    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration);
    }
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Convenience helpers — keep call sites tiny */
export const toast = {
  show: (title: string, description?: string) =>
    useToasts.getState().push({ title, description }),
  success: (title: string, description?: string) =>
    useToasts.getState().push({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    useToasts.getState().push({ title, description, variant: "error" }),
  withUndo: (title: string, undo: () => void, description?: string) =>
    useToasts.getState().push({
      title,
      description,
      action: { label: "Undo", run: undo },
    }),
};
