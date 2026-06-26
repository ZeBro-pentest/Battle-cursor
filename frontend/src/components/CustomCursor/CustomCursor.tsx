import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { userAPI } from "../../services/api";

const CURSOR_HOTSPOTS: Record<string, [number, number]> = {
  "Standard Cursor": [0, 0],
  Stylus: [0, 0],
  Blot: [0, 0],
  Spark: [0, 0],
  Arrow: [0, 0],
  Quill: [0, 0],
  Pencil: [0, 0],
  Vector: [0, 0],
  Stroke: [0, 0],
  Virus: [0, 0],
  Trap: [0, 0],
  Warper: [0, 0],
  Dictator: [0, 0],
  Wraith: [0, 0],
  Hybrid: [0, 0],
  Breach: [0, 0],
  Parasite: [0, 0],
  Chaos: [0, 0],
  Phantom: [0, 0],
  Tornado: [0, 0],
  Mutant: [0, 0],
  Judge: [0, 0],
  Eraser: [0, 0],
  Absolute: [0, 0],
  Overlord: [0, 0],
  Collapse: [0, 0],
};

function transformUrl(url: string): string {
  return url.replace("/upload/", "/upload/w_32,h_32,c_fit/");
}

export function CustomCursor() {
  const token = useSelector((state: RootState) => state.auth.accessToken);

  useEffect(() => {
    if (!token) {
      document.body.style.cursor = "";
      return;
    }

    let cancelled = false;
    let cursorApplied = false;

    userAPI
      .getProfile()
      .then((res) => {
        if (cancelled) return;
        const cursor = res.data.cursor;
        if (!cursor?.image_url || !cursor?.name) {
          return;
        }
        const transformed = transformUrl(cursor.image_url);
        const [hx, hy] = CURSOR_HOTSPOTS[cursor.name] ?? [0, 0];
        document.body.style.cursor = `url('${transformed}') ${hx} ${hy}, auto`;
        cursorApplied = true;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (cursorApplied) {
        document.body.style.cursor = "";
      }
    };
  }, [token]);

  return null;
}
