import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import outreachReducer from "./slices/outreachSlice";
import chatReducer from "./slices/chatSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    outreaches: outreachReducer,
    chat: chatReducer,
  },
  // Redux Toolkit includes thunk middleware by default
});
