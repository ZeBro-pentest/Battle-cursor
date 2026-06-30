// Логика этого эффекта живёт в Game.tsx:
// при получении debuff_id === "palette_swap" вызывается setColor с рандомным цветом из PALETTE.
// Компонент не рендерит ничего — эффект обрабатывается в debuff_received.
export function PaletteSwapEffect() {
  return null;
}
