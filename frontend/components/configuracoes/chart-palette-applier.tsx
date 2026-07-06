"use client";

import { useEffect } from "react";

import { getStoredChartPalette } from "@/lib/chart-palettes";

const EVENTO_PALETA = "msm-industrial-chart-palette-changed";

function aplicarCoresNosGraficos() {
  const palette = getStoredChartPalette();
  const cores = palette.cores;

  document
    .querySelectorAll<SVGElement>(".recharts-line-curve")
    .forEach((elemento, index) => {
      elemento.setAttribute("stroke", cores[index % cores.length]);
    });

  document
    .querySelectorAll<SVGElement>(".recharts-dot, .recharts-active-dot")
    .forEach((elemento, index) => {
      const cor = cores[index % cores.length];

      elemento.setAttribute("stroke", cor);
      elemento.setAttribute("fill", cor);
    });

  document
    .querySelectorAll<SVGElement>(
      ".recharts-bar-rectangle path, .recharts-bar-rectangle rect",
    )
    .forEach((elemento, index) => {
      elemento.setAttribute("fill", cores[index % cores.length]);
    });

  document
    .querySelectorAll<SVGElement>(".recharts-pie-sector path")
    .forEach((elemento, index) => {
      elemento.setAttribute("fill", cores[index % cores.length]);
    });

  document
    .querySelectorAll<SVGElement>(".recharts-radial-bar-sector path")
    .forEach((elemento, index) => {
      elemento.setAttribute("fill", cores[index % cores.length]);
    });
}

export function ChartPaletteApplier() {
  useEffect(() => {
    let timeoutId: number | null = null;

    function agendarAplicacao() {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        aplicarCoresNosGraficos();
      }, 80);
    }

    const observer = new MutationObserver(() => {
      agendarAplicacao();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener(EVENTO_PALETA, agendarAplicacao);
    window.addEventListener("storage", agendarAplicacao);

    agendarAplicacao();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      observer.disconnect();
      window.removeEventListener(EVENTO_PALETA, agendarAplicacao);
      window.removeEventListener("storage", agendarAplicacao);
    };
  }, []);

  return null;
}