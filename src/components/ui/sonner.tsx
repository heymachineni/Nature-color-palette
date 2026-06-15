"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-lg border border-border bg-card text-card-foreground text-sm px-4 py-3 shadow-sm font-sans",
          description: "text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
