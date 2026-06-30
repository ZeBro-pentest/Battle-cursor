import { useEffect } from "react";

export function ShakeEffect() {
  useEffect(() => {
    const page = document.querySelector(".game-page") as HTMLElement | null;
    if (!page) return;
    page.style.animation = "shake 0.3s ease-in-out infinite";
    return () => {
      page.style.animation = "";
    };
  }, []);

  return null;
}
