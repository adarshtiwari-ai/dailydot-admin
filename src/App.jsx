import React from "react";
import { Routes, Route } from "react-router-dom";
import AuthWrapper from "./components/auth/AuthWrapper.jsx";
import CompleteDashboard from "./components/CompleteDashboard";
import ProviderDetails from "./pages/ProviderDetails";

function App() {
  return (
    <AuthWrapper>
      <Routes>
        <Route path="/providers/:id" element={<ProviderDetails />} />
        <Route path="*" element={<CompleteDashboard />} />
      </Routes>
    </AuthWrapper>
  );
}

export default App;
