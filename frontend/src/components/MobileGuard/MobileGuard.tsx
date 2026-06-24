import { useEffect, useState } from "react";
import "./MobileGuard.css";

const BREAKPOINT = 900;

export function MobileGuard({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < BREAKPOINT);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < BREAKPOINT);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (!isMobile) return <>{children}</>;

  return (
    <div className="mobile-guard">
      <div className="mobile-guard-inner">
        <div className="mobile-guard-icon">⚔</div>
        <h1 className="mobile-guard-title">
          Battle_<span className="mobile-guard-red">cursor</span>
        </h1>
        <p className="mobile-guard-msg">
          Данный сайт не поддерживает мобильную версию
        </p>
        <p className="mobile-guard-hint">
          Откройте на компьютере для полноценной игры
        </p>
      </div>
    </div>
  );
}
