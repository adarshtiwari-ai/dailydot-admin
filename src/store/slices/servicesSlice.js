import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/api.service";

// Fetch all categories with services
export const fetchCategories = createAsyncThunk(
  "services/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/categories");
      return response.data.categories || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories"
      );
    }
  }
);

// Create new category
export const createCategory = createAsyncThunk(
  "services/createCategory",
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/categories", categoryData);
      return response.data.category || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create category"
      );
    }
  }
);

// Update category
export const updateCategory = createAsyncThunk(
  "services/updateCategory",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/categories/${id}`, data);
      return response.data.category || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update category"
      );
    }
  }
);

// Delete category
export const deleteCategory = createAsyncThunk(
  "services/deleteCategory",
  async (id, { rejectWithValue }) => {
    console.log("[ServicesSlice] deleteCategory thunk called with ID:", id);
    try {
      const response = await axiosInstance.delete(`/categories/${id}`);
      console.log("[ServicesSlice] deleteCategory success:", response.data);
      return id;
    } catch (error) {
      console.error("[ServicesSlice] deleteCategory error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete category"
      );
    }
  }
);

export const addServiceToCategory = createAsyncThunk(
  "services/addServiceToCategory",
  async ({ categoryId, serviceData }, { rejectWithValue }) => {
    try {
      console.log("Creating service with auto-extracted category data:", {
        categoryId,
        serviceData,
      });

      // Validate that categoryId exists
      if (!categoryId) {
        return rejectWithValue("Category ID is required but not provided");
      }

      let payload;

      if (serviceData instanceof FormData) {
        if (!serviceData.has("category")) {
          serviceData.append("category", categoryId);
        }
        payload = serviceData;
      } else {
        // Backend expects these exact required fields as per API documentation
        payload = {
          name: serviceData.name,
          category: categoryId, // AUTOMATICALLY EXTRACTED - Backend expects 'category' field with MongoDB ID
          description: serviceData.description, // Required by backend
          price: Number(serviceData.price), // Required by backend and must be numeric
        };

        // MRP — only include if a valid non-zero value is provided
        if (serviceData.mrp) {
          payload.mrp = Number(serviceData.mrp);
        }

        // Inclusions / Exclusions — pass through arrays directly
        if (serviceData.inclusions !== undefined) {
          payload.inclusions = serviceData.inclusions;
        }
        if (serviceData.exclusions !== undefined) {
          payload.exclusions = serviceData.exclusions;
        }

        // Add optional fields only if they exist and are valid
        if (
          serviceData.duration !== undefined &&
          serviceData.duration !== null &&
          serviceData.duration !== ""
        ) {
          payload.duration = Number(serviceData.duration);
        }

        // Handle images array
        if (serviceData.images && Array.isArray(serviceData.images)) {
          const validImages = serviceData.images.filter(
            (img) => img && img.trim() !== ""
          );
          if (validImages.length > 0) {
            payload.images = validImages;
          }
        }

        if (serviceData.isActive !== undefined) {
          payload.isActive = serviceData.isActive;
        }

        if (serviceData.section !== undefined) {
          payload.section = serviceData.section;
        }

        // Tag ID support - backend expects single tagId field (ObjectId)
        if (serviceData.tagId) {
          payload.tagId = serviceData.tagId;
        }
      }

      console.log(
        "Final payload being sent to backend (with auto-extracted category):",
        payload
      );

      const response = await axiosInstance.post("/services", payload);

      console.log("Backend response:", response.data);

      return {
        categoryId,
        service: response.data.service || response.data,
      };
    } catch (error) {
      console.error("Service creation error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Enhanced error handling for category-related issues
      if (error.response?.status === 401) {
        return rejectWithValue(
          "Authentication required. Please login as admin."
        );
      }

      if (error.response?.status === 400) {
        const validationErrors = error.response.data.errors;
        if (validationErrors && Array.isArray(validationErrors)) {
          const errorMessages = validationErrors
            .map((err) => err.msg)
            .join(", ");

          // Check if category field is the issue
          const categoryError = validationErrors.find(
            (err) =>
              err.path === "category" ||
              err.param === "category" ||
              err.msg.toLowerCase().includes("category")
          );

          if (categoryError) {
            return rejectWithValue(
              `Category Error: ${categoryError.msg}. Category ID provided: ${categoryId}`
            );
          }

          return rejectWithValue(`Validation Error: ${errorMessages}`);
        }
      }

      // Check for MongoDB ObjectId format errors
      if (
        error.response?.data?.message?.includes("ObjectId") ||
        error.response?.data?.message?.includes("Cast to ObjectId failed")
      ) {
        return rejectWithValue(
          `Invalid category ID format: ${categoryId}. Please ensure the category exists.`
        );
      }

      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to add service to category"
      );
    }
  }
);
export const updateServiceInCategory = createAsyncThunk(
  "services/updateServiceInCategory",
  async ({ categoryId, serviceId, serviceData }, { rejectWithValue }) => {
    try {
      console.log("Updating service with category data:", {
        categoryId,
        serviceId,
        serviceData,
      });

      let payload;
      if (serviceData instanceof FormData) {
        if (!serviceData.has("category")) {
          serviceData.append("category", categoryId);
        }
        payload = serviceData;
      } else {
        // Include category in update payload to ensure it's maintained
        payload = {
          ...serviceData,
          category: categoryId, // Ensure category is always included
        };
      }

      console.log("Update payload with category:", payload);

      const response = await axiosInstance.put(
        `/services/${serviceId}`,
        payload
      );

      return {
        categoryId,
        serviceId,
        serviceData: response.data.service || response.data,
      };
    } catch (error) {
      console.error("Service update error:", error);

      if (error.response?.status === 401) {
        return rejectWithValue(
          "Authentication required. Please login as admin."
        );
      }

      return rejectWithValue(
        error.response?.data?.message || "Failed to update service"
      );
    }
  }
);
// Remove service from category
export const removeServiceFromCategory = createAsyncThunk(
  "services/removeServiceFromCategory",
  async ({ categoryId, serviceId }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/services/${serviceId}`);
      return { categoryId, serviceId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove service"
      );
    }
  }
);

// Fetch all services (optional, for services-only view)
export const fetchServices = createAsyncThunk(
  "services/fetchServices",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await axiosInstance.get(`/services?${queryString}`);
      console.log("🖥️ ADMIN UI RECEIVED PAYLOAD:", response.data);
      return response.data.services || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch services"
      );
    }
  }
);

// Update service (generic)
export const updateService = createAsyncThunk(
  "services/updateService",
  async ({ id, serviceData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/services/${id}`, serviceData);
      return response.data.service || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update service"
      );
    }
  }
);

export const fetchCategoryWithServices = createAsyncThunk(
  "services/fetchCategoryWithServices",
  async (categoryId, { rejectWithValue }) => {
    try {
      const [categoryResponse, servicesResponse] = await Promise.all([
        axiosInstance.get(`/categories/${categoryId}`),
        axiosInstance.get(`/services?category=${categoryId}`),
      ]);

      return {
        category: categoryResponse.data.category || categoryResponse.data,
        services: servicesResponse.data.services || servicesResponse.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch category details"
      );
    }
  }
);
// Initial state with sample data as fallback
const initialState = {
  services: [],
  categories: [],
  currentService: null,
  currentCategory: null,
  selectedCategoryId: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
  filters: {
    search: "",
    category: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  isLoading: {
    services: false,
    categories: false,
    currentService: false,
    currentCategory: false,
    creating: false,
    updating: false,
    deleting: false,
  },
  error: {
    services: null,
    categories: null,
    currentService: null,
    currentCategory: null,
    creating: null,
    updating: null,
    deleting: null,
  },
};

const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategoryId = action.payload;
    },
    setCurrentCategory: (state, action) => {
      state.currentCategory = action.payload;
    },
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
      state.error.currentCategory = null;
    },
    clearErrors: (state) => {
      state.error = {
        services: null,
        categories: null,
        currentService: null,
        currentCategory: null,
        creating: null,
        updating: null,
        deleting: null,
      };
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories cases
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading.categories = true;
        state.error.categories = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading.categories = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading.categories = false;
        state.error.categories = action.payload;
      })

      // Create category cases
      .addCase(createCategory.pending, (state) => {
        state.isLoading.creating = true;
        state.error.creating = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.isLoading.creating = false;
        state.categories.unshift(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.isLoading.creating = false;
        state.error.creating = action.payload;
      })

      // Update category cases
      .addCase(updateCategory.pending, (state) => {
        state.isLoading.updating = true;
        state.error.updating = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isLoading.updating = false;
        const index = state.categories.findIndex(
          (cat) => cat.id === action.payload.id
        );
        if (index !== -1) {
          state.categories[index] = {
            ...state.categories[index],
            ...action.payload,
          };
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isLoading.updating = false;
        state.error.updating = action.payload;
      })

      // Delete category cases
      .addCase(deleteCategory.pending, (state) => {
        state.isLoading.deleting = true;
        state.error.deleting = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.isLoading.deleting = false;
        state.categories = state.categories.filter(
          (cat) => cat.id !== action.payload
        );
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isLoading.deleting = false;
        state.error.deleting = action.payload;
      })

      // Add service to category cases
      .addCase(addServiceToCategory.pending, (state) => {
        state.isLoading.creating = true;
        state.error.creating = null;
      })
      .addCase(addServiceToCategory.fulfilled, (state, action) => {
        state.isLoading.creating = false;
        const { categoryId, service } = action.payload;
        const categoryIndex = state.categories.findIndex(
          (cat) => String(cat._id || cat.id) === String(categoryId)
        );
        if (categoryIndex !== -1) {
          if (!state.categories[categoryIndex].services) {
            state.categories[categoryIndex].services = [];
          }
          state.categories[categoryIndex].services.push(service);
          state.categories[categoryIndex].serviceCount =
            (state.categories[categoryIndex].serviceCount || 0) + 1;
        }
      })
      .addCase(addServiceToCategory.rejected, (state, action) => {
        state.isLoading.creating = false;
        state.error.creating = action.payload;
      })

      // Update service in category cases
      .addCase(updateServiceInCategory.pending, (state) => {
        state.isLoading.updating = true;
        state.error.updating = null;
      })
      .addCase(updateServiceInCategory.fulfilled, (state, action) => {
        state.isLoading.updating = false;
        const { categoryId, serviceId, serviceData } = action.payload;
        const categoryIndex = state.categories.findIndex(
          (cat) => cat.id === categoryId
        );
        if (categoryIndex !== -1 && state.categories[categoryIndex].services) {
          const serviceIndex = state.categories[
            categoryIndex
          ].services.findIndex((s) => s.id === serviceId);
          if (serviceIndex !== -1) {
            state.categories[categoryIndex].services[serviceIndex] = {
              ...state.categories[categoryIndex].services[serviceIndex],
              ...serviceData,
            };
          }
        }
      })
      .addCase(updateServiceInCategory.rejected, (state, action) => {
        state.isLoading.updating = false;
        state.error.updating = action.payload;
      })

      // Remove service from category cases
      .addCase(removeServiceFromCategory.pending, (state) => {
        state.isLoading.deleting = true;
        state.error.deleting = null;
      })
      .addCase(removeServiceFromCategory.fulfilled, (state, action) => {
        state.isLoading.deleting = false;
        const { categoryId, serviceId } = action.payload;
        const categoryIndex = state.categories.findIndex(
          (cat) => cat.id === categoryId
        );
        if (categoryIndex !== -1 && state.categories[categoryIndex].services) {
          state.categories[categoryIndex].services = state.categories[
            categoryIndex
          ].services.filter((s) => s.id !== serviceId);
          state.categories[categoryIndex].serviceCount = Math.max(
            0,
            (state.categories[categoryIndex].serviceCount || 1) - 1
          );
        }
      })
      .addCase(removeServiceFromCategory.rejected, (state, action) => {
        state.isLoading.deleting = false;
        state.error.deleting = action.payload;
      })

      // Fetch services cases
      .addCase(fetchServices.pending, (state) => {
        state.isLoading.services = true;
        state.error.services = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.isLoading.services = false;
        state.services = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.isLoading.services = false;
        state.error.services = action.payload;
      })

      // Update service (generic) cases
      .addCase(updateService.pending, (state) => {
        state.isLoading.updating = true;
        state.error.updating = null;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.isLoading.updating = false;
        // Update in main services list
        const index = state.services.findIndex(
          (s) => (s.id || s._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.services[index] = { ...state.services[index], ...action.payload };
        }
      })
      .addCase(updateService.rejected, (state, action) => {
        state.isLoading.updating = false;
        state.error.updating = action.payload;
      })

      // Fetch category with services cases - ADD THESE:
      .addCase(fetchCategoryWithServices.pending, (state) => {
        state.isLoading.currentCategory = true;
        state.error.currentCategory = null;
      })
      .addCase(fetchCategoryWithServices.fulfilled, (state, action) => {
        state.isLoading.currentCategory = false;
        state.currentCategory = action.payload.category;
        state.services = action.payload.services;
      })
      .addCase(fetchCategoryWithServices.rejected, (state, action) => {
        state.isLoading.currentCategory = false;
        state.error.currentCategory = action.payload;
      });
  },
});

export const {
  setSelectedCategory,
  setCurrentCategory,
  clearCurrentCategory,
  clearErrors,
  setFilters,
  setPagination,
} = servicesSlice.actions;

// Selectors
export const selectServices = (state) => state.services.services;
export const selectCategories = (state) => state.services.categories;
export const selectCurrentCategory = (state) => state.services.currentCategory;
export const selectSelectedCategoryId = (state) =>
  state.services.selectedCategoryId;
export const selectServicesByCategory = (categoryId) => (state) => {
  const category = state.services.categories.find(
    (cat) => cat.id === categoryId
  );
  return category ? category.services : [];
};
export const selectServicesLoading = (state) => state.services.isLoading;
export const selectServicesErrors = (state) => state.services.error;
export const selectServicesPagination = (state) => state.services.pagination;
export const selectServicesFilters = (state) => state.services.filters;

export default servicesSlice.reducer;
