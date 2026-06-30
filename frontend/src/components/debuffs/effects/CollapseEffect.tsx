import { useEffect } from "react";

const COLLAPSE_CONFIG = [
  { selector: ".game-header",  duration: "0.4s", delay: "0s",    rotate: "-2deg"  },
  { selector: ".game-debuffs", duration: "0.55s", delay: "0.08s", rotate: "3deg"   },
  { selector: ".game-tools",   duration: "0.5s",  delay: "0.04s", rotate: "-1.5deg" },
];

export function CollapseEffect() {
  useEffect(() => {
    const elements: HTMLElement[] = [];

    COLLAPSE_CONFIG.forEach(({ selector, duration, delay, rotate }) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) return;
      elements.push(el);
      el.style.setProperty("--collapse-rotate", rotate);
      el.style.animation = `collapse-fall ${duration} ease-in ${delay} forwards`;
    });

    return () => {
      elements.forEach((el) => {
        el.style.animation = "";
        el.style.removeProperty("--collapse-rotate");
      });
    };
  }, []);

  return null;
}
