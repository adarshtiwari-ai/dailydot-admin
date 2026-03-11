import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import App from "./App.jsx";
import { store, persistor } from "./store/store";
import LoadingComponent from "./components/common/LoadingComponent";
import ErrorBoundary from "./components/common/AppErrorBoundary";

// Debug logging
console.log("Main.jsx: Starting application...");
console.log("Store:", store);
console.log("Persistor:", persistor);

import theme from "./theme";

console.log("Main.jsx: About to render...");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingComponent />} persistor={persistor}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);

console.log("Main.jsx: Render completed");
