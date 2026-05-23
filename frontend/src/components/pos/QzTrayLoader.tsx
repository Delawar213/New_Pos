"use client";

import { useEffect } from "react";
import { isQzTrayEnabled } from "@/lib/cashDrawer";

const QZ_SCRIPT = "https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js";

/** Loads QZ Tray JS when enabled via env (requires QZ Tray desktop app running). */
export function QzTrayLoader() {
  useEffect(() => {
    if (!isQzTrayEnabled()) return;
    if (document.querySelector(`script[src="${QZ_SCRIPT}"]`)) return;

    const script = document.createElement("script");
    script.src = QZ_SCRIPT;
    script.async = true;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return null;
}
