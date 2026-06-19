"use client";

import Box from "@mui/material/Box";
import { MuiThemeShell, type MuiMode } from "./theme-shell";
import MainGrid from "./main-grid";

export function MuiDashboard({
  primary,
  mode,
}: {
  primary: string;
  mode: MuiMode;
}) {
  return (
    <MuiThemeShell primary={primary} mode={mode}>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <MainGrid />
      </Box>
    </MuiThemeShell>
  );
}

export type { MuiMode } from "./theme-shell";
