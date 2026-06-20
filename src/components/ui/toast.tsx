"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { bindToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const EXIT_MS = 280;

type ToastItem = {
  id: number;
  content: ReactNode;
  visible: boolean;
};

type ToastContextValue = {
  push: (content: ReactNode, duration?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

/** Single toast shell — one layer, same on every breakpoint. */
export function toastClassName(className?: string) {
  return cn(
    "flex w-max max-w-[min(100vw-2rem,20rem)] items-center gap-2 rounded-full",
    "border border-border bg-background px-3 py-2 text-xs text-foreground shadow-sm",
    className,
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  const clearSwapTimer = () => {
    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }
  };

  const fadeIn = useCallback((id: number) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToast((current) =>
          current?.id === id ? { ...current, visible: true } : current,
        );
      });
    });
  }, []);

  const fadeOutAndRemove = useCallback((id: number) => {
    setToast((current) => {
      if (!current || current.id !== id) return current;
      return { ...current, visible: false };
    });
    swapTimerRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, EXIT_MS);
  }, []);

  const show = useCallback(
    (content: ReactNode, duration: number) => {
      const id = ++nextId;
      clearDismissTimer();
      clearSwapTimer();

      setToast({ id, content, visible: false });
      fadeIn(id);

      dismissTimerRef.current = setTimeout(() => {
        fadeOutAndRemove(id);
      }, duration);
    },
    [fadeIn, fadeOutAndRemove],
  );

  const push = useCallback(
    (content: ReactNode, duration = 2000) => {
      clearDismissTimer();

      setToast((current) => {
        if (!current) {
          queueMicrotask(() => show(content, duration));
          return current;
        }

        clearSwapTimer();
        swapTimerRef.current = setTimeout(() => {
          show(content, duration);
        }, EXIT_MS);

        return { ...current, visible: false };
      });
    },
    [show],
  );

  useEffect(() => {
    bindToast(push);
    return () => {
      bindToast(null);
      clearDismissTimer();
      clearSwapTimer();
    };
  }, [push]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <ToastViewport toast={toast} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toast }: { toast: ToastItem | null }) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex justify-center px-4"
    >
      <div
        className={cn(
          "pointer-events-auto absolute left-1/2 top-0 origin-top",
          "transition-[transform,opacity] duration-300 ease-out",
          toast.visible
            ? "translate-x-[-50%] translate-y-0 scale-100 opacity-100"
            : "translate-x-[-50%] translate-y-1 scale-[0.97] opacity-0",
        )}
      >
        <div className={toastClassName()}>{toast.content}</div>
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
