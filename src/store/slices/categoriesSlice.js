import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/api.service"; // Fixed path

// Fetch all categories
export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/categories");
      return response.data.categories;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories"
      );
    }
  }
);

// Create category
export const createCategory = createAsyncThunk(
  "categories/create",
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/categories", categoryData);
      return response.data.category;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create category"
      );
    }
  }
);

// Update category
export const updateCategory = createAsyncThunk(
  "categories/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/categories/${id}`, data);
      return response.data.category;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update category"
      );
    }
  }
);

// Delete category
export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/categories/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete category"
      );
    }
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState: {
    categories: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ FIXED: Normalize _id to id for consistent access throughout the app
        state.categories = action.payload.map((cat) => ({
          ...cat,
          id: cat._id || cat.id,
        }));
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create category
      .addCase(createCategory.fulfilled, (state, action) => {
        // ✅ FIXED: Normalize new category before adding to state
        const normalizedCategory = {
          ...action.payload,
          id: action.payload._id || action.payload.id,
        };
        state.categories.push(normalizedCategory);
      })
      // Update category
      .addCase(updateCategory.fulfilled, (state, action) => {
        // ✅ FIXED: Normalize updated category and use 'id' for finding
        const normalizedCategory = {
          ...action.payload,
          id: action.payload._id || action.payload.id,
        };
        const index = state.categories.findIndex(
          (cat) => cat.id === normalizedCategory.id
        );
        if (index !== -1) {
          state.categories[index] = normalizedCategory;
        }
      })
      // Delete category
      .addCase(deleteCategory.fulfilled, (state, action) => {
        // ✅ FIXED: Use 'id' instead of '_id' for filtering
        state.categories = state.categories.filter(
          (cat) => cat.id !== action.payload
        );
      });
  },
});

export const { clearError } = categoriesSlice.actions;
export default categoriesSlice.reducer;
