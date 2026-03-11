// src/store/slices/usersSlice.js - UPDATED FOR BACKEND
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/api.service";

// Fetch all users (admin only - as per your backend API)
export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await axiosInstance.get(`/users?${queryString}`);

      // Handle your backend response format
      const data = response.data.data || response.data;
      return {
        users: Array.isArray(data) ? data : data.users || [],
        pagination: data.pagination || { total: 0, page: 1, pages: 1 },
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

// Get single user details
export const fetchUserById = createAsyncThunk(
  "users/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/users/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user details"
      );
    }
  }
);

// Update user profile (admin can update any user)
export const updateUserProfile = createAsyncThunk(
  "users/updateProfile",
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/users/${id}`, userData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update user"
      );
    }
  }
);

const initialState = {
  users: [],
  currentUser: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  },
  isLoading: {
    users: false,
    updating: false,
    current: false,
  },
  error: {
    users: null,
    updating: null,
    current: null,
  },
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUsersError: (state) => {
      state.error = {
        users: null,
        updating: null,
        current: null,
      };
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users cases
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading.users = true;
        state.error.users = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading.users = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading.users = false;
        state.error.users = action.payload;
      })

      // Fetch user by ID cases
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading.current = true;
        state.error.current = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading.current = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading.current = false;
        state.error.current = action.payload;
      })

      // Update user profile cases
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading.updating = true;
        state.error.updating = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading.updating = false;
        // Update the user in the list
        const index = state.users.findIndex(
          (user) =>
            user._id === action.payload._id || user.id === action.payload.id
        );
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        // Update current user if it's the same one
        if (
          state.currentUser &&
          (state.currentUser._id === action.payload._id ||
            state.currentUser.id === action.payload.id)
        ) {
          state.currentUser = action.payload;
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading.updating = false;
        state.error.updating = action.payload;
      });
  },
});

export const { clearUsersError, setCurrentUser, clearCurrentUser } =
  usersSlice.actions;

// Selectors
export const selectUsers = (state) => state.users.users;
export const selectCurrentUser = (state) => state.users.currentUser;
export const selectUsersLoading = (state) => state.users.isLoading;
export const selectUsersError = (state) => state.users.error;
export const selectUsersPagination = (state) => state.users.pagination;

export default usersSlice.reducer;
