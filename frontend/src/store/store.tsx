import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import marketReducer from "./marketSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    market: marketReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
