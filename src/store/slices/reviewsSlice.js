// src/store/slices/reviewsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/api.service";

// ============================================
// ASYNC THUNKS
// ============================================

// Fetch all reviews (Admin)
export const fetchReviews = createAsyncThunk(
  "reviews/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await axiosInstance.get(
        `/reviews/admin/reviews${queryString ? `?${queryString}` : ""}`
      );

      return {
        reviews: response.data.reviews || [],
        pagination: response.data.pagination || {
          total: 0,
          page: 1,
          pages: 1,
          limit: 10,
        },
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch reviews"
      );
    }
  }
);

// Fetch review statistics (Admin)
export const fetchReviewStats = createAsyncThunk(
  "reviews/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/reviews/admin/reviews/stats");
      return response.data.stats || {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch statistics"
      );
    }
  }
);

// Fetch single review details (Admin)
export const fetchSingleReview = createAsyncThunk(
  "reviews/fetchSingle",
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/reviews/admin/reviews/${reviewId}`
      );
      return response.data.review || null;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch review details"
      );
    }
  }
);

// Moderate review (Admin) - Approve/Reject/Flag
export const moderateReview = createAsyncThunk(
  "reviews/moderate",
  async ({ reviewId, status, moderationNote }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        `/reviews/admin/reviews/${reviewId}/moderate`,
        { status, moderationNote }
      );
      return response.data.review || null;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to moderate review"
      );
    }
  }
);

// Add admin response to review (Admin)
export const respondToReview = createAsyncThunk(
  "reviews/respond",
  async ({ reviewId, message }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/reviews/admin/reviews/${reviewId}/respond`,
        { message }
      );
      return response.data.review || null;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add response"
      );
    }
  }
);

// Delete review (Admin)
export const deleteReview = createAsyncThunk(
  "reviews/delete",
  async (reviewId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/reviews/admin/reviews/${reviewId}`);
      return reviewId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete review"
      );
    }
  }
);

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  reviews: [],
  currentReview: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  },
  stats: {
    totalReviews: 0,
    averageRating: 0,
    approvedReviews: 0,
    pendingReviews: 0,
    rejectedReviews: 0,
    flaggedReviews: 0,
    fiveStarCount: 0,
    fourStarCount: 0,
    threeStarCount: 0,
    twoStarCount: 0,
    oneStarCount: 0,
    recentReviewsCount: 0,
  },
  isLoading: {
    reviews: false,
    stats: false,
    moderating: false,
    current: false,
    deleting: false,
    responding: false,
  },
  error: {
    reviews: null,
    stats: null,
    moderating: null,
    current: null,
    deleting: null,
    responding: null,
  },
  filters: {
    status: null,
    rating: null,
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
};

// ============================================
// SLICE
// ============================================

const reviewsSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    clearReviewsError: (state) => {
      state.error = {
        reviews: null,
        stats: null,
        moderating: null,
        current: null,
        deleting: null,
        responding: null,
      };
    },
    setCurrentReview: (state, action) => {
      state.currentReview = action.payload;
    },
    clearCurrentReview: (state) => {
      state.currentReview = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        status: null,
        rating: null,
        search: "",
        sortBy: "createdAt",
        sortOrder: "desc",
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // Fetch Reviews
      // ============================================
      .addCase(fetchReviews.pending, (state) => {
        state.isLoading.reviews = true;
        state.error.reviews = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.isLoading.reviews = false;
        state.reviews = action.payload.reviews;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.isLoading.reviews = false;
        state.error.reviews = action.payload;
      })

      // ============================================
      // Fetch Statistics
      // ============================================
      .addCase(fetchReviewStats.pending, (state) => {
        state.isLoading.stats = true;
        state.error.stats = null;
      })
      .addCase(fetchReviewStats.fulfilled, (state, action) => {
        state.isLoading.stats = false;
        state.stats = {
          totalReviews: action.payload.totalReviews || 0,
          averageRating: action.payload.averageRating || 0,
          approvedReviews: action.payload.approvedReviews || 0,
          pendingReviews: action.payload.pendingReviews || 0,
          rejectedReviews: action.payload.rejectedReviews || 0,
          flaggedReviews: action.payload.flaggedReviews || 0,
          fiveStarCount: action.payload.fiveStarCount || 0,
          fourStarCount: action.payload.fourStarCount || 0,
          threeStarCount: action.payload.threeStarCount || 0,
          twoStarCount: action.payload.twoStarCount || 0,
          oneStarCount: action.payload.oneStarCount || 0,
          recentReviewsCount: action.payload.recentReviewsCount || 0,
        };
      })
      .addCase(fetchReviewStats.rejected, (state, action) => {
        state.isLoading.stats = false;
        state.error.stats = action.payload;
      })

      // ============================================
      // Fetch Single Review
      // ============================================
      .addCase(fetchSingleReview.pending, (state) => {
        state.isLoading.current = true;
        state.error.current = null;
      })
      .addCase(fetchSingleReview.fulfilled, (state, action) => {
        state.isLoading.current = false;
        state.currentReview = action.payload;
      })
      .addCase(fetchSingleReview.rejected, (state, action) => {
        state.isLoading.current = false;
        state.error.current = action.payload;
      })

      // ============================================
      // Moderate Review
      // ============================================
      .addCase(moderateReview.pending, (state) => {
        state.isLoading.moderating = true;
        state.error.moderating = null;
      })
      .addCase(moderateReview.fulfilled, (state, action) => {
        state.isLoading.moderating = false;

        // Update review in list
        const index = state.reviews.findIndex(
          (r) => r._id === action.payload._id
        );
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }

        // Update current review if it's the same
        if (state.currentReview?._id === action.payload._id) {
          state.currentReview = action.payload;
        }
      })
      .addCase(moderateReview.rejected, (state, action) => {
        state.isLoading.moderating = false;
        state.error.moderating = action.payload;
      })

      // ============================================
      // Respond to Review
      // ============================================
      .addCase(respondToReview.pending, (state) => {
        state.isLoading.responding = true;
        state.error.responding = null;
      })
      .addCase(respondToReview.fulfilled, (state, action) => {
        state.isLoading.responding = false;

        // Update review in list
        const index = state.reviews.findIndex(
          (r) => r._id === action.payload._id
        );
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }

        // Update current review if it's the same
        if (state.currentReview?._id === action.payload._id) {
          state.currentReview = action.payload;
        }
      })
      .addCase(respondToReview.rejected, (state, action) => {
        state.isLoading.responding = false;
        state.error.responding = action.payload;
      })

      // ============================================
      // Delete Review
      // ============================================
      .addCase(deleteReview.pending, (state) => {
        state.isLoading.deleting = true;
        state.error.deleting = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.isLoading.deleting = false;

        // Remove review from list
        state.reviews = state.reviews.filter((r) => r._id !== action.payload);

        // Clear current review if it was deleted
        if (state.currentReview?._id === action.payload) {
          state.currentReview = null;
        }

        // Update pagination total
        if (state.pagination.total > 0) {
          state.pagination.total -= 1;
        }
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.isLoading.deleting = false;
        state.error.deleting = action.payload;
      });
  },
});

// ============================================
// ACTIONS
// ============================================

export const {
  clearReviewsError,
  setCurrentReview,
  clearCurrentReview,
  setFilters,
  clearFilters,
  setPagination,
} = reviewsSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectReviews = (state) => state.reviews.reviews;
export const selectCurrentReview = (state) => state.reviews.currentReview;
export const selectReviewsLoading = (state) => state.reviews.isLoading;
export const selectReviewsError = (state) => state.reviews.error;
export const selectReviewsPagination = (state) => state.reviews.pagination;
export const selectReviewsStats = (state) => state.reviews.stats;
export const selectReviewsFilters = (state) => state.reviews.filters;

export default reviewsSlice.reducer;
