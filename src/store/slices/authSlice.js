import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/api.service";

export const logoutAdmin = createAsyncThunk(
  "auth/logoutAdmin",
  async (_, { rejectWithValue }) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      return true;
    } catch (error) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      return rejectWithValue(error.message || "Logout failed");
    }
  }
);

export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("adminToken", response.data.accessToken);
      localStorage.setItem("adminUser", JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("adminUser");
      return rejectWithValue(
        error.response?.data?.message || "Invalid credentials"
      );
    }
  }
);

export const getProfile = createAsyncThunk(
  "auth/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/auth/profile");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get profile"
      );
    }
  }
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/refresh");
      localStorage.setItem("adminToken", response.data.accessToken);
      return response.data;
    } catch (error) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      return rejectWithValue(
        error.response?.data?.message || "Token refresh failed"
      );
    }
  }
);

// FIXED: Initial state should have isLoading: false
const initialState = {
  user: JSON.parse(localStorage.getItem("adminUser")) || null,
  token: localStorage.getItem("adminToken"),
  isAuthenticated: !!localStorage.getItem("adminToken"),
  isLoading: false, // IMPORTANT: Set to false initially
  error: null,
  lastActivity: Date.now(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false; // Reset loading state
    },
    clearError: (state) => {
      state.error = null;
    },
    updateLastActivity: (state) => {
      state.lastActivity = Date.now();
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("adminUser", JSON.stringify(state.user));
    },
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem("adminToken", action.payload);
    },
    // NEW: Add action to reset loading state
    resetAuthLoading: (state) => {
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.error = null;
        state.lastActivity = Date.now();
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })

      // Logout cases
      .addCase(logoutAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(logoutAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })

      // Get Profile cases
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        localStorage.setItem("adminUser", JSON.stringify(action.payload.user));
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Refresh token cases
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.accessToken;
        state.lastActivity = Date.now();
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.isLoading = false;
      });
  },
});

export const {
  logout,
  clearError,
  updateLastActivity,
  updateUser,
  setToken,
  resetAuthLoading,
} = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectToken = (state) => state.auth.token;
export const selectLastActivity = (state) => state.auth.lastActivity;

export default authSlice.reducer;
