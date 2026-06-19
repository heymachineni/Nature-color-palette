"use client";

import { useEffect } from "react";

/** Reset document scroll when an info page mounts (home keeps its own restore). */
export function ScrollToTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return null;
}
