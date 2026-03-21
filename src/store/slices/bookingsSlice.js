// src/store/slices/bookingsSlice.js - UPDATED FOR BACKEND
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/api.service";

// Fetch all bookings (admin only - as per your backend API)
export const fetchBookings = createAsyncThunk(
  "bookings/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await axiosInstance.get(`/bookings?${queryString}`);

      // Handle your backend response format
      const data = response.data.data || response.data;
      return {
        bookings: Array.isArray(data) ? data : data.bookings || [],
        pagination: data.pagination || { total: 0, page: 1, pages: 1 },
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch bookings"
      );
    }
  }
);

// Update booking status (admin only - as per API doc)
export const updateBookingStatus = createAsyncThunk(
  "bookings/updateStatus",
  async ({ id, status, proName, proPhone, materialCost, adminCommission }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/bookings/${id}/status`, {
        status,
        proName,
        proPhone,
        materialCost,
        adminCommission
      });

      const data = response.data;
      const updatedBooking = data.booking || data.data || data;
      return updatedBooking;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update booking status"
      );
    }
  }
);

// Add material to booking (Dynamic Invoicing)
export const addBookingMaterial = createAsyncThunk(
  "bookings/addMaterial",
  async ({ id, name, cost }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/admin/bookings/${id}/materials`, {
        name,
        cost,
      });

      const data = response.data;
      const updatedBooking = data.booking || data.data || data;
      return updatedBooking;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add material"
      );
    }
  }
);

// Get single booking details
export const fetchBookingById = createAsyncThunk(
  "bookings/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/bookings/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch booking details"
      );
    }
  }
);

const initialState = {
  bookings: [],
  currentBooking: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  },
  isLoading: {
    bookings: false,
    updating: false,
    current: false,
  },
  error: {
    bookings: null,
    updating: null,
    current: null,
  },
};

const bookingsSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    clearBookingsError: (state) => {
      state.error = {
        bookings: null,
        updating: null,
        current: null,
      };
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch bookings cases
      .addCase(fetchBookings.pending, (state) => {
        state.isLoading.bookings = true;
        state.error.bookings = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.isLoading.bookings = false;
        state.bookings = action.payload.bookings;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.isLoading.bookings = false;
        state.error.bookings = action.payload;
      })

      // Update booking status cases
      .addCase(updateBookingStatus.pending, (state) => {
        state.isLoading.updating = true;
        state.error.updating = null;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.isLoading.updating = false;

        // Helper to safely compare IDs
        const targetId = action.payload._id || action.payload.id;

        if (!targetId) return; // Should not happen if backend is correct

        // Update the booking in the list by merging (preserves populated fields)
        state.bookings = state.bookings.map((booking) => {
          const currentId = booking._id || booking.id;
          // Strictly compare valid IDs only
          if (currentId && targetId && currentId === targetId) {
            return { ...booking, ...action.payload };
          }
          return booking;
        });

        // Update current booking if it's the same one
        if (state.currentBooking) {
          const currentId = state.currentBooking._id || state.currentBooking.id;
          if (currentId && targetId && currentId === targetId) {
            state.currentBooking = { ...state.currentBooking, ...action.payload };
          }
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.isLoading.updating = false;
        state.error.updating = action.payload;
      })

      // Add material cases
      .addCase(addBookingMaterial.pending, (state) => {
        state.isLoading.updating = true;
        state.error.updating = null;
      })
      .addCase(addBookingMaterial.fulfilled, (state, action) => {
        state.isLoading.updating = false;

        const targetId = action.payload._id || action.payload.id;
        if (!targetId) return;

        state.bookings = state.bookings.map((booking) => {
          const currentId = booking._id || booking.id;
          if (currentId === targetId) {
            return { ...booking, ...action.payload };
          }
          return booking;
        });

        if (state.currentBooking) {
          const currentId = state.currentBooking._id || state.currentBooking.id;
          if (currentId === targetId) {
            state.currentBooking = { ...state.currentBooking, ...action.payload };
          }
        }
      })
      .addCase(addBookingMaterial.rejected, (state, action) => {
        state.isLoading.updating = false;
        state.error.updating = action.payload;
      })

      // Fetch booking by ID cases
      .addCase(fetchBookingById.pending, (state) => {
        state.isLoading.current = true;
        state.error.current = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.isLoading.current = false;
        state.currentBooking = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.isLoading.current = false;
        state.error.current = action.payload;
      });
  },
});

export const { clearBookingsError, setCurrentBooking, clearCurrentBooking } =
  bookingsSlice.actions;

// Selectors
export const selectBookings = (state) => state.bookings.bookings;
export const selectCurrentBooking = (state) => state.bookings.currentBooking;
export const selectBookingsLoading = (state) => state.bookings.isLoading;
export const selectBookingsError = (state) => state.bookings.error;
export const selectBookingsPagination = (state) => state.bookings.pagination;

export default bookingsSlice.reducer;
