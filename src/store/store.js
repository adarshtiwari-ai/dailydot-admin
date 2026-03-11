import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";

// Import slice reducers
import authSlice from "./slices/authSlice";
import dashboardSlice from "./slices/dashboardSlice";
import servicesSlice from "./slices/servicesSlice";
import categoriesSlice from "./slices/categoriesSlice"; // ✅ ADDED
import bookingsSlice from "./slices/bookingsSlice";
import usersSlice from "./slices/usersSlice";
import paymentsSlice from "./slices/paymentsSlice";
import reviewsSlice from "./slices/reviewsSlice";
import analyticsSlice from "./slices/analyticsSlice";
import settingsSlice from "./slices/settingsSlice";
import uiSlice from "./slices/uiSlice";

// Persist configuration
const persistConfig = {
  key: "dailydot-admin",
  storage,
  whitelist: ["auth", "settings"], // Only persist auth and settings
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authSlice,
  dashboard: dashboardSlice,
  services: servicesSlice,
  categories: categoriesSlice, // ✅ ADDED
  bookings: bookingsSlice,
  users: usersSlice,
  payments: paymentsSlice,
  reviews: reviewsSlice,
  analytics: analyticsSlice,
  settings: settingsSlice,
  ui: uiSlice,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
  devTools: import.meta.env.MODE !== "production",
});

// Create persistor
export const persistor = persistStore(store);
