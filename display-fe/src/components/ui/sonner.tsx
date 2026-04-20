import * as React from "react";
import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  const { theme } = useTheme();
  return (
    <SonnerToaster
      theme={(theme as any) || "system"}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "border border-border bg-card text-card-foreground",
          title: "text-sm font-semibold",
          description: "text-xs text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
