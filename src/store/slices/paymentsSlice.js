// src/store/slices/paymentsSlice.js - UPDATED FOR BACKEND
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/api.service";

// Fetch all payments (admin only)
export const fetchPayments = createAsyncThunk(
  "payments/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await axiosInstance.get(`/payments?${queryString}`);

      // Handle your backend response format
      const data = response.data.data || response.data;
      return {
        payments: Array.isArray(data) ? data : data.payments || [],
        pagination: data.pagination || { total: 0, page: 1, pages: 1 },
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch payments"
      );
    }
  }
);

// Get payment status for a booking
export const getPaymentStatus = createAsyncThunk(
  "payments/getStatus",
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/payments/status/${bookingId}`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get payment status"
      );
    }
  }
);

// Process refund (admin only)
export const processRefund = createAsyncThunk(
  "payments/processRefund",
  async ({ paymentId, amount, reason }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/payments/${paymentId}/refund`,
        {
          amount,
          reason,
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to process refund"
      );
    }
  }
);

const initialState = {
  payments: [],
  currentPayment: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  },
  stats: {
    totalRevenue: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
  },
  isLoading: {
    payments: false,
    refunding: false,
    stats: false,
    current: false,
  },
  error: {
    payments: null,
    refunding: null,
    stats: null,
    current: null,
  },
};

const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    clearPaymentsError: (state) => {
      state.error = {
        payments: null,
        refunding: null,
        stats: null,
        current: null,
      };
    },
    setCurrentPayment: (state, action) => {
      state.currentPayment = action.payload;
    },
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
    updatePaymentStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch payments cases
      .addCase(fetchPayments.pending, (state) => {
        state.isLoading.payments = true;
        state.error.payments = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.isLoading.payments = false;
        state.payments = action.payload.payments;
        state.pagination = action.payload.pagination;

        // Calculate stats from payments data
        const payments = action.payload.payments;
        state.stats = {
          totalTransactions: payments.length,
          totalRevenue: payments
            .filter((p) => p.status === "completed")
            .reduce((sum, p) => sum + (p.amount || 0), 0),
          successfulPayments: payments.filter((p) => p.status === "completed")
            .length,
          failedPayments: payments.filter((p) => p.status === "failed").length,
          pendingPayments: payments.filter((p) => p.status === "pending")
            .length,
        };
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.isLoading.payments = false;
        state.error.payments = action.payload;
      })

      // Get payment status cases
      .addCase(getPaymentStatus.pending, (state) => {
        state.isLoading.current = true;
        state.error.current = null;
      })
      .addCase(getPaymentStatus.fulfilled, (state, action) => {
        state.isLoading.current = false;
        state.currentPayment = action.payload;
      })
      .addCase(getPaymentStatus.rejected, (state, action) => {
        state.isLoading.current = false;
        state.error.current = action.payload;
      })

      // Process refund cases
      .addCase(processRefund.pending, (state) => {
        state.isLoading.refunding = true;
        state.error.refunding = null;
      })
      .addCase(processRefund.fulfilled, (state, action) => {
        state.isLoading.refunding = false;
        // Update the payment in the list
        const index = state.payments.findIndex(
          (payment) =>
            payment._id === action.payload._id ||
            payment.id === action.payload.id
        );
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
      })
      .addCase(processRefund.rejected, (state, action) => {
        state.isLoading.refunding = false;
        state.error.refunding = action.payload;
      });
  },
});

export const {
  clearPaymentsError,
  setCurrentPayment,
  clearCurrentPayment,
  updatePaymentStats,
} = paymentsSlice.actions;

// Selectors
export const selectPayments = (state) => state.payments.payments;
export const selectCurrentPayment = (state) => state.payments.currentPayment;
export const selectPaymentsLoading = (state) => state.payments.isLoading;
export const selectPaymentsError = (state) => state.payments.error;
export const selectPaymentsPagination = (state) => state.payments.pagination;
export const selectPaymentsStats = (state) => state.payments.stats;

export default paymentsSlice.reducer;
