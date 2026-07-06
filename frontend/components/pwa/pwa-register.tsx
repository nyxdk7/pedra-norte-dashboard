"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    const registrarServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
      } catch {
        // Evita quebrar a interface caso o navegador bloqueie o service worker.
      }
    };

    if (document.readyState === "complete") {
      registrarServiceWorker();
      return;
    }

    window.addEventListener("load", registrarServiceWorker);

    return () => {
      window.removeEventListener("load", registrarServiceWorker);
    };
  }, []);

  return null;
}