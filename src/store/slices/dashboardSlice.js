import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/api.service";

// Fetch dashboard stats
export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/analytics/metrics");
      const data = response.data.data;
      return {
        totalBookings: data.totalBookings,
        totalUsers: data.totalUsers,
        totalRevenue: data.totalRevenue,
        activeServices: data.activeServices,
        bookingGrowth: data.bookingGrowth || 0,
        revenueGrowth: data.revenueGrowth || 0,
        userGrowth: data.userGrowth || 0,
        serviceGrowth: data.serviceGrowth || 0
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard stats"
      );
    }
  }
);

export const fetchRecentBookings = createAsyncThunk(
  "dashboard/fetchRecentBookings",
  async (limit = 5, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/bookings?limit=${limit}`);
      return response.data.bookings || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch recent bookings"
      );
    }
  }
);

export const fetchRevenueChart = createAsyncThunk(
  "dashboard/fetchRevenueChart",
  async (period = "6months", { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/analytics/revenue?period=${period}`);
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch revenue chart");
    }
  }
);

export const fetchServiceDistribution = createAsyncThunk(
  "dashboard/fetchServiceDistribution",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/analytics/services-distribution");
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch service distribution"
      );
    }
  }
);

export const fetchMetrics = createAsyncThunk(
  "dashboard/fetchMetrics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/analytics/metrics");
      return response.data.data || {
        todayBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        avgRating: 0,
        activeProviders: 0,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch metrics");
    }
  }
);

// Initial state
const initialState = {
  stats: {
    totalBookings: 0,
    totalRevenue: 0,
    totalUsers: 0,
    activeServices: 0,
    bookingGrowth: 0,
    revenueGrowth: 0,
    userGrowth: 0,
    serviceGrowth: 0,
  },
  recentBookings: [],
  revenueChart: [],
  serviceDistribution: [],
  metrics: {
    todayBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    avgRating: 0,
    activeProviders: 0,
  },
  isLoading: {
    stats: false,
    recentBookings: false,
    revenueChart: false,
    serviceDistribution: false,
    metrics: false,
  },
  error: {
    stats: null,
    recentBookings: null,
    revenueChart: null,
    serviceDistribution: null,
    metrics: null,
  },
  lastUpdated: Date.now(),
};

// Dashboard slice
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = {
        stats: null,
        recentBookings: null,
        revenueChart: null,
        serviceDistribution: null,
        metrics: null,
      };
    },
    updateRealtimeData: (state, action) => {
      const { type, data } = action.payload;
      switch (type) {
        case "NEW_BOOKING":
          state.stats.totalBookings += 1;
          state.metrics.todayBookings += 1;
          state.recentBookings.unshift(data);
          if (state.recentBookings.length > 5) {
            state.recentBookings.pop();
          }
          break;
        case "BOOKING_STATUS_UPDATED": {
          const bookingIndex = state.recentBookings.findIndex(
            (b) => b.id === data.id
          );
          if (bookingIndex !== -1) {
            state.recentBookings[bookingIndex] = {
              ...state.recentBookings[bookingIndex],
              ...data,
            };
          }
          break;
        }
        case "NEW_USER":
          state.stats.totalUsers += 1;
          break;
        default:
          break;
      }
      state.lastUpdated = Date.now();
    },
    setStats: (state, action) => {
      state.stats = action.payload;
      state.lastUpdated = Date.now();
    },
    setRecentBookings: (state, action) => {
      state.recentBookings = action.payload;
    },
    setRevenueChart: (state, action) => {
      state.revenueChart = action.payload;
    },
    setServiceDistribution: (state, action) => {
      state.serviceDistribution = action.payload;
    },
    setMetrics: (state, action) => {
      state.metrics = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stats cases
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading.stats = true;
        state.error.stats = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading.stats = false;
        state.stats = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading.stats = false;
        state.error.stats = action.payload;
      })

      // Fetch recent bookings cases
      .addCase(fetchRecentBookings.pending, (state) => {
        state.isLoading.recentBookings = true;
        state.error.recentBookings = null;
      })
      .addCase(fetchRecentBookings.fulfilled, (state, action) => {
        state.isLoading.recentBookings = false;
        state.recentBookings = action.payload;
      })
      .addCase(fetchRecentBookings.rejected, (state, action) => {
        state.isLoading.recentBookings = false;
        state.error.recentBookings = action.payload;
      })

      // Fetch revenue chart cases
      .addCase(fetchRevenueChart.pending, (state) => {
        state.isLoading.revenueChart = true;
        state.error.revenueChart = null;
      })
      .addCase(fetchRevenueChart.fulfilled, (state, action) => {
        state.isLoading.revenueChart = false;
        state.revenueChart = action.payload;
      })
      .addCase(fetchRevenueChart.rejected, (state, action) => {
        state.isLoading.revenueChart = false;
        state.error.revenueChart = action.payload;
      })

      // Fetch service distribution cases
      .addCase(fetchServiceDistribution.pending, (state) => {
        state.isLoading.serviceDistribution = true;
        state.error.serviceDistribution = null;
      })
      .addCase(fetchServiceDistribution.fulfilled, (state, action) => {
        state.isLoading.serviceDistribution = false;
        state.serviceDistribution = action.payload;
      })
      .addCase(fetchServiceDistribution.rejected, (state, action) => {
        state.isLoading.serviceDistribution = false;
        state.error.serviceDistribution = action.payload;
      })

      // Fetch metrics cases
      .addCase(fetchMetrics.pending, (state) => {
        state.isLoading.metrics = true;
        state.error.metrics = null;
      })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.isLoading.metrics = false;
        state.metrics = action.payload;
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.isLoading.metrics = false;
        state.error.metrics = action.payload;
      });
  },
});

export const {
  clearErrors,
  updateRealtimeData,
  setStats,
  setRecentBookings,
  setRevenueChart,
  setServiceDistribution,
  setMetrics,
} = dashboardSlice.actions;

// Selectors
export const selectDashboardStats = (state) => state.dashboard.stats;
export const selectRecentBookings = (state) => state.dashboard.recentBookings;
export const selectRevenueChart = (state) => state.dashboard.revenueChart;
export const selectServiceDistribution = (state) =>
  state.dashboard.serviceDistribution;
export const selectDashboardMetrics = (state) => state.dashboard.metrics;
export const selectDashboardLoading = (state) => state.dashboard.isLoading;
export const selectDashboardErrors = (state) => state.dashboard.error;
export const selectLastUpdated = (state) => state.dashboard.lastUpdated;

export default dashboardSlice.reducer;
