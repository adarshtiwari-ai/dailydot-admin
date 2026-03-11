import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectIsAuthenticated,
  selectAuthLoading,
  selectUser,
  resetAuthLoading,
} from "../../store/slices/authSlice";
import LoginPage from "./LoginPage";
import { CircularProgress, Box } from "@mui/material";

const AuthWrapper = ({ children }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const user = useSelector(selectUser);
  const [isInitializing, setIsInitializing] = useState(true);

  // Debug logging with more detail
  console.log("AuthWrapper Debug:", {
    isAuthenticated,
    isLoading,
    user,
    isInitializing,
    token: localStorage.getItem("adminToken"),
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    // Reset any stuck loading state from persist rehydration
    dispatch(resetAuthLoading());

    const timer = setTimeout(() => {
      console.log("AuthWrapper: Initialization complete");
      setIsInitializing(false);
    }, 300); // Reduced timeout

    return () => clearTimeout(timer);
  }, [dispatch]);

  useEffect(() => {
    // Only fetch profile if we have a token but no user data
    const token = localStorage.getItem("adminToken");
    if (token && isAuthenticated && !user && !isLoading && !isInitializing) {
      // For now, skip profile fetching since backend might not be ready
      console.log("Would fetch profile here if backend was ready");
      // dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated, user, isLoading, isInitializing]);

  // Show loading spinner during initialization only
  if (isInitializing) {
    console.log("AuthWrapper: Still initializing...");
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="#f5f7fa"
      >
        <Box textAlign="center">
          <CircularProgress size={50} />
          <div style={{ marginTop: "16px", color: "#666", fontSize: "14px" }}>
            Starting up...
          </div>
        </Box>
      </Box>
    );
  }

  // Show loading spinner only during actual auth operations (login/logout)
  if (isLoading) {
    console.log("AuthWrapper: Auth operation in progress...");
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="#f5f7fa"
      >
        <Box textAlign="center">
          <CircularProgress size={50} />
          <div style={{ marginTop: "16px", color: "#666", fontSize: "14px" }}>
            Authenticating...
          </div>
        </Box>
      </Box>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    console.log("AuthWrapper: Not authenticated, showing login");
    return <LoginPage />;
  }

  // Show dashboard if authenticated
  console.log("AuthWrapper: Authenticated, showing dashboard");
  return children;
};

export default AuthWrapper;
