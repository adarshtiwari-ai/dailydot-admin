// src/store/slices/analyticsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/api.service";

// Fetch analytics data from existing endpoints
export const fetchAnalyticsData = createAsyncThunk(
  "analytics/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      // Fetch all data we need for analytics from existing endpoints
      const [
        bookingsResponse,
        usersResponse,
        servicesResponse,
        categoriesResponse,
      ] = await Promise.all([
        axiosInstance.get("/bookings"),
        axiosInstance.get("/users"),
        axiosInstance.get("/services"),
        axiosInstance.get("/categories"),
      ]);

      const bookings =
        bookingsResponse.data.bookings || bookingsResponse.data.data || bookingsResponse.data || [];
      const users = usersResponse.data.users || usersResponse.data.data || usersResponse.data || [];
      const services =
        servicesResponse.data.services || servicesResponse.data.data || servicesResponse.data || [];
      const categories =
        categoriesResponse.data.categories || categoriesResponse.data.data || categoriesResponse.data || [];

      return {
        bookings: Array.isArray(bookings) ? bookings : [],
        users: Array.isArray(users) ? users : [],
        services: Array.isArray(services) ? services : [],
        categories: Array.isArray(categories) ? categories : [],
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch analytics data"
      );
    }
  }
);

// Calculate revenue trends from bookings data
export const calculateRevenueTrends = createAsyncThunk(
  "analytics/calculateRevenue",
  async (period = 30, { getState, rejectWithValue }) => {
    try {
      const { analytics } = getState();
      const bookings = analytics.rawData.bookings;

      if (!Array.isArray(bookings) || bookings.length === 0) {
        return [];
      }

      // Group bookings by date and calculate revenue
      const now = new Date();
      const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);

      const revenueByDate = {};

      bookings.forEach((booking) => {
        const bookingDate = new Date(
          booking.createdAt || booking.scheduledDate
        );
        if (bookingDate >= startDate && booking.status?.toLowerCase() === "completed") {
          const dateKey = bookingDate.toISOString().split("T")[0];
          const amount = booking.totalAmount || booking.amount || 0;

          if (!revenueByDate[dateKey]) {
            revenueByDate[dateKey] = 0;
          }
          revenueByDate[dateKey] += amount;
        }
      });

      // Convert to array format for charts
      const revenueData = Object.keys(revenueByDate)
        .sort()
        .map((date) => ({
          date,
          revenue: revenueByDate[date],
          formattedDate: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        }));

      return revenueData;
    } catch (error) {
      console.error(error);
      return rejectWithValue("Failed to calculate revenue trends");
    }
  }
);

const initialState = {
  rawData: {
    bookings: [],
    users: [],
    services: [],
    categories: [],
  },
  metrics: {
    totalRevenue: 0,
    totalBookings: 0,
    totalUsers: 0,
    averageOrderValue: 0,
    completionRate: 0,
    userGrowthRate: 0,
  },
  charts: {
    revenueData: [],
    bookingStatusDistribution: [],
    topServices: [],
    userGrowthData: [],
  },
  isLoading: {
    data: false,
    revenue: false,
    charts: false,
  },
  error: {
    data: null,
    revenue: null,
    charts: null,
  },
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearAnalyticsError: (state) => {
      state.error = {
        data: null,
        revenue: null,
        charts: null,
      };
    },
    calculateMetrics: (state) => {
      const { bookings, users } = state.rawData;

      if (Array.isArray(bookings) && bookings.length > 0) {
        const completedBookings = bookings.filter(
          (b) => b.status?.toLowerCase() === "completed"
        );
        const totalRevenue = completedBookings.reduce(
          (sum, booking) => sum + (booking.totalAmount || booking.amount || 0),
          0
        );

        state.metrics = {
          totalRevenue,
          totalBookings: bookings.length,
          totalUsers: Array.isArray(users) ? users.length : 0,
          averageOrderValue:
            completedBookings.length > 0
              ? totalRevenue / completedBookings.length
              : 0,
          completionRate: (completedBookings.length / bookings.length) * 100,
          userGrowthRate: 0, // Will be calculated based on date ranges
        };

        // Calculate booking status distribution
        const statusCounts = {};
        bookings.forEach((booking) => {
          const status = (booking.status || "pending").toLowerCase();
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        state.charts.bookingStatusDistribution = Object.keys(statusCounts).map(
          (status) => ({
            status,
            count: statusCounts[status],
            percentage: (
              (statusCounts[status] / bookings.length) *
              100
            ).toFixed(1),
          })
        );

        // Calculate top services
        const serviceCounts = {};
        bookings.forEach((booking) => {
          const serviceName =
            booking.service?.name || booking.serviceName || "Unknown Service";
          serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
        });

        state.charts.topServices = Object.keys(serviceCounts)
          .map((serviceName) => ({
            serviceName,
            bookings: serviceCounts[serviceName],
            revenue: bookings
              .filter(
                (b) =>
                  (b.service?.name || b.serviceName) === serviceName &&
                b.status?.toLowerCase() === "completed"
              )
              .reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0),
          }))
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, 10);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch analytics data cases
      .addCase(fetchAnalyticsData.pending, (state) => {
        state.isLoading.data = true;
        state.error.data = null;
      })
      .addCase(fetchAnalyticsData.fulfilled, (state, action) => {
        state.isLoading.data = false;
        state.rawData = action.payload;
        // Automatically calculate metrics after data is loaded
        analyticsSlice.caseReducers.calculateMetrics(state);
      })
      .addCase(fetchAnalyticsData.rejected, (state, action) => {
        state.isLoading.data = false;
        state.error.data = action.payload;
      })

      // Calculate revenue trends cases
      .addCase(calculateRevenueTrends.pending, (state) => {
        state.isLoading.revenue = true;
        state.error.revenue = null;
      })
      .addCase(calculateRevenueTrends.fulfilled, (state, action) => {
        state.isLoading.revenue = false;
        state.charts.revenueData = action.payload;
      })
      .addCase(calculateRevenueTrends.rejected, (state, action) => {
        state.isLoading.revenue = false;
        state.error.revenue = action.payload;
      });
  },
});

export const { clearAnalyticsError, calculateMetrics } = analyticsSlice.actions;

// Selectors
export const selectAnalyticsRawData = (state) => state.analytics.rawData;
export const selectAnalyticsMetrics = (state) => state.analytics.metrics;
export const selectAnalyticsCharts = (state) => state.analytics.charts;
export const selectAnalyticsLoading = (state) => state.analytics.isLoading;
export const selectAnalyticsError = (state) => state.analytics.error;

export default analyticsSlice.reducer;
