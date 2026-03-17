// src/store/slices/settingsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/api.service";

// Get current admin profile
export const getAdminProfile = createAsyncThunk(
  "settings/getAdminProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/auth/profile");
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get admin profile"
      );
    }
  }
);

// Update admin profile
export const updateAdminProfile = createAsyncThunk(
  "settings/updateAdminProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put("/users/profile", profileData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update profile"
      );
    }
  }
);

// Load Settings
export const getSettings = createAsyncThunk(
  "settings/getSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/settings");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load settings"
      );
    }
  }
);

// Update System Settings
export const updateSystemSettings = createAsyncThunk(
  "settings/updateSystemSettings",
  async (settings, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put("/settings", settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update settings"
      );
    }
  }
);

// Update Notification Settings
export const updateNotificationSettings = createAsyncThunk(
  "settings/updateNotificationSettings",
  async (settings, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put("/settings", { notifications: settings });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update settings"
      );
    }
  }
);

// Change password
export const changePassword = createAsyncThunk(
  "settings/changePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to change password"
      );
    }
  }
);

const initialState = {
  adminProfile: JSON.parse(localStorage.getItem("adminUser")) || null,
  systemSettings: {
    siteName: "DailyDot Admin",
    maintenanceMode: false,
    allowRegistrations: true,
    emailNotifications: true,
    smsNotifications: false,
    autoBackup: true,
    theme: "light",
    language: "en",
    timezone: "Asia/Kolkata",
    currency: "INR",
    activeMapProvider: "ola"
  },
  billingSettings: {
    defaultTaxRate: 0.18,
    serviceCharge: 50,
    convenienceFee: 25,
    globalFees: []
  },
  notificationSettings: {
    newBookings: true,
    paymentUpdates: true,
    userRegistrations: true,
    systemAlerts: true,
    emergencyBookings: true,
    dailyReports: false,
    weeklyReports: true,
    monthlyReports: true,
  },
  isLoading: {
    profile: false,
    updating: false,
    changingPassword: false,
    savingSettings: false,
  },
  error: {
    profile: null,
    updating: null,
    changingPassword: null,
    savingSettings: null,
  },
  success: {
    profileUpdate: false,
    passwordChange: false,
    settingsUpdate: false,
  },
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    clearSettingsErrors: (state) => {
      state.error = {
        profile: null,
        updating: null,
        changingPassword: null,
        savingSettings: null,
      };
    },
    clearSettingsSuccess: (state) => {
      state.success = {
        profileUpdate: false,
        passwordChange: false,
        settingsUpdate: false,
      };
    },
    // Old local reducers removed in favor of async thunks
    resetSuccessFlags: (state) => {
      state.success = {
        profileUpdate: false,
        passwordChange: false,
        settingsUpdate: false,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Get admin profile cases
      .addCase(getAdminProfile.pending, (state) => {
        state.isLoading.profile = true;
        state.error.profile = null;
      })
      .addCase(getAdminProfile.fulfilled, (state, action) => {
        state.isLoading.profile = false;
        state.adminProfile = action.payload;
        // Update localStorage
        localStorage.setItem("adminUser", JSON.stringify(action.payload));
      })
      .addCase(getAdminProfile.rejected, (state, action) => {
        state.isLoading.profile = false;
        state.error.profile = action.payload;
      })

      // Update admin profile cases
      .addCase(updateAdminProfile.pending, (state) => {
        state.isLoading.updating = true;
        state.error.updating = null;
        state.success.profileUpdate = false;
      })
      .addCase(updateAdminProfile.fulfilled, (state, action) => {
        state.isLoading.updating = false;
        state.adminProfile = { ...state.adminProfile, ...action.payload };
        state.success.profileUpdate = true;
        // Update localStorage
        localStorage.setItem("adminUser", JSON.stringify(state.adminProfile));
      })
      .addCase(updateAdminProfile.rejected, (state, action) => {
        state.isLoading.updating = false;
        state.error.updating = action.payload;
      })

      // Change password cases
      .addCase(changePassword.pending, (state) => {
        state.isLoading.changingPassword = true;
        state.error.changingPassword = null;
        state.success.passwordChange = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading.changingPassword = false;
        state.error.changingPassword = action.payload;
      })

      // Load Settings cases
      .addCase(getSettings.pending, (state) => {
        state.isLoading.savingSettings = true;
      })
      .addCase(getSettings.fulfilled, (state, action) => {
        state.isLoading.savingSettings = false;
        if (action.payload.data) {
          state.systemSettings = action.payload.data.system;
          state.notificationSettings = action.payload.data.notifications;
          state.billingSettings = action.payload.data.billing || initialState.billingSettings;
        }
      })
      .addCase(getSettings.rejected, (state, action) => {
        state.isLoading.savingSettings = false;
        state.error.savingSettings = action.payload;
      })

      // Update System Settings cases
      .addCase(updateSystemSettings.pending, (state) => {
        state.isLoading.savingSettings = true;
        state.error.savingSettings = null;
        state.success.settingsUpdate = false;
      })
      .addCase(updateSystemSettings.fulfilled, (state, action) => {
        state.isLoading.savingSettings = false;
        state.success.settingsUpdate = true;
        if (action.payload.data) {
          if (action.payload.data.system) {
            state.systemSettings = action.payload.data.system;
          }
          if (action.payload.data.billing) {
            state.billingSettings = action.payload.data.billing;
          }
          if (action.payload.data.notifications) {
            state.notificationSettings = action.payload.data.notifications;
          }
        }
      })
      .addCase(updateSystemSettings.rejected, (state, action) => {
        state.isLoading.savingSettings = false;
        state.error.savingSettings = action.payload;
      })

      // Update Notification Settings cases
      .addCase(updateNotificationSettings.pending, (state) => {
        state.isLoading.savingSettings = true;
        state.error.savingSettings = null;
        state.success.settingsUpdate = false;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.isLoading.savingSettings = false;
        state.success.settingsUpdate = true;
        if (action.payload.data) {
          state.notificationSettings = action.payload.data.notifications;
        }
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.isLoading.savingSettings = false;
        state.error.savingSettings = action.payload;
      });
  },
});

export const {
  clearSettingsErrors,
  clearSettingsSuccess,
  resetSuccessFlags,
} = settingsSlice.actions;

// Selectors - FIXED VERSION with default values
export const selectAdminProfile = (state) =>
  state.settings?.adminProfile || null;
export const selectSystemSettings = (state) =>
  state.settings?.systemSettings || {
    siteName: "DailyDot Admin",
    maintenanceMode: false,
    allowRegistrations: true,
    emailNotifications: true,
    smsNotifications: false,
    autoBackup: true,
    theme: "light",
    language: "en",
    timezone: "Asia/Kolkata",
    currency: "INR",
    activeMapProvider: "ola"
  };
export const selectNotificationSettings = (state) =>
  state.settings?.notificationSettings || {
    newBookings: true,
    paymentUpdates: true,
    userRegistrations: true,
    systemAlerts: true,
    emergencyBookings: true,
    dailyReports: false,
    weeklyReports: true,
    monthlyReports: true,
  };
export const selectBillingSettings = (state) =>
  state.settings?.billingSettings || {
    defaultTaxRate: 18,
    serviceCharge: 50,
    convenienceFee: 25
  };
export const selectSettingsLoading = (state) =>
  state.settings?.isLoading || {
    profile: false,
    updating: false,
    changingPassword: false,
    savingSettings: false,
  };
export const selectSettingsError = (state) =>
  state.settings?.error || {
    profile: null,
    updating: null,
    changingPassword: null,
    savingSettings: null,
  };
export const selectSettingsSuccess = (state) =>
  state.settings?.success || {
    profileUpdate: false,
    passwordChange: false,
    settingsUpdate: false,
  };
export default settingsSlice.reducer;
