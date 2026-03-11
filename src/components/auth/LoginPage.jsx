import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from "@mui/icons-material";
import {
  loginAdmin,
  selectAuthLoading,
  selectAuthError,
  clearError,
} from "../../store/slices/authSlice";

const LoginPage = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("LoginPage: Submit triggered with credentials:", {
      email: credentials.email,
      password: credentials.password ? "[HIDDEN]" : "empty",
    });

    if (credentials.email && credentials.password) {
      try {
        console.log("LoginPage: Dispatching loginAdmin...");
        const result = await dispatch(loginAdmin(credentials));

        console.log("LoginPage: Login result:", result);

        if (loginAdmin.fulfilled.match(result)) {
          console.log("LoginPage: Login successful!", result.payload);
        } else if (loginAdmin.rejected.match(result)) {
          console.log("LoginPage: Login failed:", result.payload);
        }
      } catch (err) {
        console.error("LoginPage: Login error:", err);
      }
    } else {
      console.warn("LoginPage: Missing email or password");
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) {
      dispatch(clearError());
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Pre-fill demo credentials for easy testing
  const fillDemoCredentials = () => {
    setCredentials({
      email: "admin@dailydot.com",
      password: "admin123",
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            maxWidth: 400,
            mx: "auto",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: "primary.main",
                  mb: 1,
                }}
              >
                Dailydot Admin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to access your dashboard
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={credentials.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">@</InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={
                  isLoading || !credentials.email || !credentials.password
                }
                startIcon={
                  isLoading ? <CircularProgress size={20} /> : <LoginIcon />
                }
                sx={{
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                }}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                Demo Credentials:
              </Typography>
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                <strong>Email:</strong> admin@dailydot.com
                <br />
                <strong>Password:</strong> admin123
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={fillDemoCredentials}
                disabled={isLoading}
                sx={{ mt: 2 }}
              >
                Use Demo Credentials
              </Button>
            </Box>

            {/* Debug info - remove in production */}
            <Box
              sx={{
                mt: 2,
                p: 1,
                bgcolor: "#f5f5f5",
                borderRadius: 1,
                fontSize: "12px",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Debug: isLoading={isLoading.toString()}, error={error || "none"}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;
