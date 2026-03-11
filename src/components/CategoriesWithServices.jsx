import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Tooltip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Work as WorkIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  Build as BuildIcon,
} from "@mui/icons-material";

import {
  selectCategories,
  selectServicesLoading,
  selectServicesErrors,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addServiceToCategory,
  updateServiceInCategory,
  removeServiceFromCategory,
} from "../store/slices/servicesSlice";

const CategoriesWithServices = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);
  const loading = useSelector(selectServicesLoading);
  const errors = useSelector(selectServicesErrors);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(""); // 'category', 'service'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    image: "",
    imagePreview: "",
    status: "Active",
  });

  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    image: "",
    imagePreview: "",
    status: "Active",
  });

  // Sample data for when Redux data is not available
  const sampleCategories = [
    {
      id: 1,
      name: "Home Cleaning",
      description: "Professional home cleaning services",
      icon: "🏠",
      status: "Active",
      serviceCount: 3,
      totalBookings: 245,
      averageRating: 4.8,
      services: [
        {
          id: 1,
          name: "Regular Cleaning",
          price: 150,
          status: "Active",
          description: "Weekly home cleaning service",
        },
        {
          id: 7,
          name: "Deep Cleaning",
          price: 250,
          status: "Active",
          description: "Comprehensive deep cleaning",
        },
        {
          id: 8,
          name: "Move-in/Move-out Cleaning",
          price: 300,
          status: "Active",
          description: "Complete cleaning for moving",
        },
      ],
    },
    {
      id: 2,
      name: "Plumbing",
      description: "Expert plumbing repairs and installations",
      icon: "🔧",
      status: "Active",
      serviceCount: 2,
      totalBookings: 189,
      averageRating: 4.6,
      services: [
        {
          id: 2,
          name: "Pipe Repair",
          price: 280,
          status: "Active",
          description: "Fix broken or leaking pipes",
        },
        {
          id: 9,
          name: "Drain Cleaning",
          price: 120,
          status: "Active",
          description: "Clear blocked drains",
        },
      ],
    },
    {
      id: 3,
      name: "Electrical",
      description: "Licensed electrical work and repairs",
      icon: "⚡",
      status: "Active",
      serviceCount: 2,
      totalBookings: 134,
      averageRating: 4.9,
      services: [
        {
          id: 5,
          name: "Electrical Repair",
          price: 350,
          status: "Active",
          description: "Fix electrical issues",
        },
        {
          id: 10,
          name: "Light Installation",
          price: 180,
          status: "Active",
          description: "Install new lighting fixtures",
        },
      ],
    },
    {
      id: 4,
      name: "Beauty & Wellness",
      description: "Beauty and wellness services at home",
      icon: "💄",
      status: "Active",
      serviceCount: 1,
      totalBookings: 98,
      averageRating: 4.5,
      services: [
        {
          id: 3,
          name: "Hair & Makeup",
          price: 120,
          status: "Inactive",
          description: "Professional hair and makeup services",
        },
      ],
    },
    {
      id: 5,
      name: "Garden & Landscaping",
      description: "Garden maintenance and landscaping",
      icon: "🌿",
      status: "Active",
      serviceCount: 2,
      totalBookings: 156,
      averageRating: 4.7,
      services: [
        {
          id: 4,
          name: "Garden Maintenance",
          price: 200,
          status: "Active",
          description: "Regular garden upkeep",
        },
        {
          id: 11,
          name: "Lawn Mowing",
          price: 80,
          status: "Active",
          description: "Weekly lawn mowing service",
        },
      ],
    },
  ];

  const displayCategories =
    categories.length > 0 ? categories : sampleCategories;

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  const handleOpenCategoryDialog = (type, category = null) => {
    setDialogType("category");
    setSelectedCategory(category);

    if (category) {
      setCategoryForm({
        name: category.name,
        description: category.description,
        image: category.image || "",
        imagePreview: category.image || "",
        status: category.status,
      });
    } else {
      setCategoryForm({
        name: "",
        description: "",
        image: "",
        imagePreview: "",
        status: "Active",
      });
    }
    setOpenDialog(true);
  };

  const handleOpenServiceDialog = (type, categoryId, service = null) => {
    setDialogType("service");
    setSelectedCategory(displayCategories.find((cat) => cat.id === categoryId));
    setSelectedService(service);

    if (service) {
      setServiceForm({
        name: service.name,
        description: service.description || "",
        price: service.price.toString(),
        duration: service.duration?.toString() || "",
        image: service.image || "",
        imagePreview: service.image || "",
        status: service.status,
      });
    } else {
      setServiceForm({
        name: "",
        description: "",
        price: "",
        duration: "",
        image: "",
        imagePreview: "",
        status: "Active",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCategory(null);
    setSelectedService(null);
    setCategoryForm({
      name: "",
      description: "",
      image: "",
      imagePreview: "",
      status: "Active",
    });
    setServiceForm({
      name: "",
      description: "",
      price: "",
      duration: "",
      image: "",
      imagePreview: "",
      status: "Active",
    });
  };

  const handleSaveCategory = async () => {
    try {
      // Generate slug from name
      const slug = categoryForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const formData = {
        name: categoryForm.name,
        slug: slug, // ← ADD THIS REQUIRED FIELD
        description: categoryForm.description,
        // Remove status field as your backend doesn't validate it
      };

      console.log("Sending category data:", formData);

      if (selectedCategory) {
        await dispatch(
          updateCategory({
            id: selectedCategory.id,
            data: formData,
          })
        ).unwrap();
        alert("Category updated successfully!");
      } else {
        await dispatch(createCategory(formData)).unwrap();
        alert("Category created successfully!");
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving category:", error);
      console.error("Error response:", error.response?.data);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };
  // In your CategoriesWithServices.jsx file, replace the existing handleSaveService function with this:

  const handleSaveService = async () => {
    try {
      // Validate required fields according to backend validation
      if (!serviceForm.name || !serviceForm.name.trim()) {
        alert("Service name is required");
        return;
      }

      if (!serviceForm.description || !serviceForm.description.trim()) {
        alert("Service description is required");
        return;
      }

      if (!serviceForm.price || isNaN(parseFloat(serviceForm.price))) {
        alert("Valid price is required");
        return;
      }

      if (!selectedCategory?.id) {
        alert("Category is required");
        return;
      }

      const serviceData = {
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim(), // Required by backend
        price: parseFloat(serviceForm.price),
        duration: serviceForm.duration
          ? parseInt(serviceForm.duration)
          : undefined,
        image: serviceForm.imagePreview || serviceForm.image || "",
      };

      console.log("Sending service data:", serviceData);
      console.log("Category ID:", selectedCategory?.id);

      if (selectedService) {
        // Update existing service
        await dispatch(
          updateServiceInCategory({
            categoryId: selectedCategory.id,
            serviceId: selectedService.id,
            serviceData,
          })
        ).unwrap();
        alert("Service updated successfully!");
      } else {
        // Create new service
        const result = await dispatch(
          addServiceToCategory({
            categoryId: selectedCategory.id,
            serviceData,
          })
        ).unwrap();
        console.log("Service creation result:", result);
        alert("Service added successfully!");
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving service:", error);
      console.error("Error details:", error.response?.data);

      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err) => err.msg)
          .join(", ");
        alert(`Validation Error: ${errorMessages}`);
      } else if (typeof error === "string") {
        alert(`Error: ${error}`);
      } else {
        alert(`Error: ${error.message || "Unknown error occurred"}`);
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this category? All services in this category will also be deleted."
      )
    ) {
      try {
        await dispatch(deleteCategory(categoryId)).unwrap();
        alert("Category deleted successfully!");
      } catch (error) {
        console.error("Error deleting category:", error);
        alert(`Error: ${error}`);
      }
    }
  };

  const handleDeleteService = async (categoryId, serviceId) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await dispatch(
          removeServiceFromCategory({ categoryId, serviceId })
        ).unwrap();
        alert("Service deleted successfully!");
      } catch (error) {
        console.error("Error deleting service:", error);
        alert(`Error: ${error}`);
      }
    }
  };

  const getStatusColor = (status) => {
    return status === "Active" ? "success" : "error";
  };

  if (loading.categories) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (errors.categories) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading categories: {errors.categories}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight="bold">
          Categories & Services Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenCategoryDialog("create")}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          Add Category
        </Button>
      </Box>

      {/* Categories Grid */}
      <Grid container spacing={3}>
        {displayCategories.map((category) => (
          <Grid item xs={12} key={category.id}>
            <Accordion
              expanded={expandedCategory === category.id}
              onChange={(event, isExpanded) =>
                setExpandedCategory(isExpanded ? category.id : false)
              }
              sx={{
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                borderRadius: "10px !important",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ borderRadius: "10px" }}
              >
                <Box display="flex" alignItems="center" width="100%">
                  <Avatar
                    sx={{ mr: 2, width: 50, height: 50, fontSize: "20px" }}
                  >
                    {category.icon || <BuildIcon />}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  </Box>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "24px",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ textAlign: "center" }}>
                      <Typography variant="h6" color="primary">
                        {category.serviceCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Services
                      </Typography>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <Typography variant="h6" color="success.main">
                        {category.totalBookings}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Bookings
                      </Typography>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <StarIcon
                        sx={{ fontSize: 16, color: "#ffc107", mr: 0.5 }}
                      />
                      <Typography variant="h6">
                        {category.averageRating}
                      </Typography>
                    </div>
                    <Chip
                      label={category.status}
                      color={getStatusColor(category.status)}
                      size="small"
                    />
                    <div style={{ display: "flex" }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCategoryDialog("edit", category);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  </div>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {/* Add Service Button */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography variant="h6">
                      Services in this category
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() =>
                        handleOpenServiceDialog("create", category.id)
                      }
                    >
                      Add Service
                    </Button>
                  </Box>

                  {/* Services Table */}
                  {category.services && category.services.length > 0 ? (
                    <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                            <TableCell sx={{ fontWeight: 600 }}>
                              Service Name
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              Description
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              Price
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              Status
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {category.services.map((service) => (
                            <TableRow key={service.id} hover>
                              <TableCell>
                                <Box display="flex" alignItems="center">
                                  <Avatar
                                    sx={{
                                      mr: 2,
                                      bgcolor: "secondary.main",
                                      width: 35,
                                      height: 35,
                                    }}
                                  >
                                    <WorkIcon />
                                  </Avatar>
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight="bold"
                                  >
                                    {service.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {service.description || "No description"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body1" fontWeight="bold">
                                  ${service.price}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={service.status}
                                  color={getStatusColor(service.status)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleOpenServiceDialog(
                                      "edit",
                                      category.id,
                                      service
                                    )
                                  }
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    handleDeleteService(category.id, service.id)
                                  }
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Paper
                      sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}
                    >
                      <WorkIcon
                        sx={{ fontSize: 48, color: "grey.400", mb: 1 }}
                      />
                      <Typography variant="h6" color="text.secondary">
                        No services in this category
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        Add your first service to get started
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          handleOpenServiceDialog("create", category.id)
                        }
                      >
                        Add Service
                      </Button>
                    </Paper>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {displayCategories.length === 0 && (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <BuildIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            No categories yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create your first service category to organize your services
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCategoryDialog("create")}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            Create First Category
          </Button>
        </Paper>
      )}

      {/* Category Dialog */}
      <Dialog
        open={openDialog && dialogType === "category"}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {selectedCategory ? "Edit Category" : "Add New Category"}
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Category Name"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: e.target.value,
                    })
                  }
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={categoryForm.status}
                    label="Status"
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        status: e.target.value,
                      })
                    }
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveCategory}
            disabled={!categoryForm.name.trim()}
          >
            {selectedCategory ? "Update" : "Create"} Category
          </Button>
        </DialogActions>
      </Dialog>

      {/* Service Dialog */}
      <Dialog
        open={openDialog && dialogType === "service"}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {selectedService ? "Edit Service" : "Add New Service"}
              {selectedCategory && (
                <Typography variant="body2" color="text.secondary">
                  in {selectedCategory.name} category
                </Typography>
              )}
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Service Name"
                  value={serviceForm.name}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, name: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      description: e.target.value,
                    })
                  }
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price ($)"
                  value={serviceForm.price}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, price: e.target.value })
                  }
                  type="number"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (hours)"
                  value={serviceForm.duration}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, duration: e.target.value })
                  }
                  type="number"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={serviceForm.status}
                    label="Status"
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, status: e.target.value })
                    }
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveService}
            disabled={!serviceForm.name.trim() || !serviceForm.price}
          >
            {selectedService ? "Update" : "Add"} Service
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesWithServices;
