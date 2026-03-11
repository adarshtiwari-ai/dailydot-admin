import React from "react";
import AuthWrapper from "./components/auth/AuthWrapper.jsx";
import CompleteDashboard from "./components/CompleteDashboard";

function App() {
  return (
    <AuthWrapper>
      <CompleteDashboard />
    </AuthWrapper>
  );
}

export default App;
