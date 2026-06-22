import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Cursor, Canvas } from "../types/user";

interface MarketState {
  cursors: Cursor[];
  canvases: Canvas[];
  ownedCursorIds: string[];
  ownedCanvasIds: string[];
  shopLoaded: boolean;
  inventoryLoaded: boolean;
}

const initialState: MarketState = {
  cursors: [],
  canvases: [],
  ownedCursorIds: [],
  ownedCanvasIds: [],
  shopLoaded: false,
  inventoryLoaded: false,
};

const marketSlice = createSlice({
  name: "market",
  initialState,
  reducers: {
    setShop(state, action: PayloadAction<{ cursors: Cursor[]; canvases: Canvas[] }>) {
      state.cursors = action.payload.cursors;
      state.canvases = action.payload.canvases;
      state.shopLoaded = true;
    },
    setInventory(state, action: PayloadAction<{ cursorIds: string[]; canvasIds: string[] }>) {
      state.ownedCursorIds = action.payload.cursorIds;
      state.ownedCanvasIds = action.payload.canvasIds;
      state.inventoryLoaded = true;
    },
    addOwned(state, action: PayloadAction<{ itemType: "cursor" | "canvas"; id: string }>) {
      if (action.payload.itemType === "cursor") {
        if (!state.ownedCursorIds.includes(action.payload.id))
          state.ownedCursorIds.push(action.payload.id);
      } else {
        if (!state.ownedCanvasIds.includes(action.payload.id))
          state.ownedCanvasIds.push(action.payload.id);
      }
    },
  },
});

export const { setShop, setInventory, addOwned } = marketSlice.actions;
export default marketSlice.reducer;
