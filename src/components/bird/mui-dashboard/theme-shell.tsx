"use client";

import { useMemo, type ReactNode } from "react";
import { createTheme, ThemeProvider, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";

export type MuiMode = "light" | "dark";

export function MuiThemeShell({
  primary,
  mode,
  children,
}: {
  primary: string;
  mode: MuiMode;
  children: ReactNode;
}) {
  const theme = useMemo(
    () =>
      createTheme({
        cssVariables: true,
        palette: {
          mode,
          primary: { main: primary },
          background:
            mode === "light"
              ? { default: "#fcfcfd", paper: "#ffffff" }
              : { default: "#0a0c10", paper: "#0f1318" },
        },
        shape: { borderRadius: 12 },
        typography: {
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          h4: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
      }),
    [primary, mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          bgcolor: "background.default",
          color: "text.primary",
          borderRadius: 3,
          border: "1px solid",
          borderColor: alpha(mode === "light" ? "#000" : "#fff", 0.08),
          overflow: "hidden",
          "& *": { boxSizing: "border-box" },
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
}
