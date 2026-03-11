import { createSlice } from "@reduxjs/toolkit";

// Initial state
const initialState = {
  sidebarOpen: false,
  currentTab: "dashboard",
  notifications: [
    {
      id: 1,
      type: "success",
      title: "New Booking",
      message: "New booking received: Home Cleaning",
      priority: "high",
      read: false,
      timestamp: new Date().toISOString(),
      bookingId: "BK001",
    },
    {
      id: 2,
      type: "info",
      title: "User Registration",
      message: "New provider registered: John Smith",
      priority: "medium",
      read: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: 3,
      type: "warning",
      title: "Payment Issue",
      message: "Payment failed for booking #BK003",
      priority: "high",
      read: true,
      timestamp: new Date().toISOString(),
      bookingId: "BK003",
    },
    {
      id: 4,
      type: "error",
      title: "Service Issue",
      message: "Service provider reported an issue",
      priority: "critical",
      read: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: 5,
      type: "info",
      title: "System Update",
      message: "System maintenance scheduled for tonight",
      priority: "low",
      read: true,
      timestamp: new Date().toISOString(),
    },
  ],
  snackbar: {
    open: false,
    message: "",
    severity: "success", // success, error, warning, info
  },
  dialogs: {
    open: false,
    type: "",
    data: null,
  },
  loading: {
    global: false,
  },
  theme: "light",
  searchTerm: "",
  pageTitle: "Dashboard",
};

// UI slice
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setCurrentTab: (state, action) => {
      state.currentTab = action.payload;
      // Update page title based on tab
      const titles = {
        dashboard: "Dashboard",
        services: "Services Management",
        bookings: "Bookings Management",
        users: "User Management",
        payments: "Payment Management",
        reviews: "Review Management",
        analytics: "Analytics",
        settings: "Settings",
      };
      state.pageTitle = titles[action.payload] || "Dashboard";
    },
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      };
      state.notifications.unshift(notification);
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    markNotificationRead: (state, action) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload
      );
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.read = true;
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    showSnackbar: (state, action) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || "success",
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
    openDialog: (state, action) => {
      state.dialogs = {
        open: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },
    closeDialog: (state) => {
      state.dialogs = {
        open: false,
        type: "",
        data: null,
      };
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setPageTitle: (state, action) => {
      state.pageTitle = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setCurrentTab,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearNotifications,
  showSnackbar,
  hideSnackbar,
  openDialog,
  closeDialog,
  setGlobalLoading,
  setTheme,
  setSearchTerm,
  setPageTitle,
} = uiSlice.actions;

// Selectors
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectCurrentTab = (state) => state.ui.currentTab;
export const selectNotifications = (state) => state.ui.notifications;
export const selectUnreadNotificationsCount = (state) =>
  state.ui.notifications.filter((n) => !n.read).length;
export const selectSnackbar = (state) => state.ui.snackbar;
export const selectDialogs = (state) => state.ui.dialogs;
export const selectGlobalLoading = (state) => state.ui.loading.global;
export const selectTheme = (state) => state.ui.theme;
export const selectSearchTerm = (state) => state.ui.searchTerm;
export const selectPageTitle = (state) => state.ui.pageTitle;

export default uiSlice.reducer;
