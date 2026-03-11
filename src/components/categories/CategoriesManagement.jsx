import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
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
  Grid,
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
import { showSnackbar } from "../store/slices/uiSlice";
import axiosInstance from "../../services/api.service"; // Direct import for reliable deletion
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import { getOptimizedUrl, getBannerUrl } from "../../utils/getOptimizedUrl";

const CategoriesManagement = () => {
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
    imageFile: null,
    status: "Active",
    tags: [],
    newTagName: "",
    newTagIcon: "",
  });

  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    mrp: "",
    inclusions: "",
    exclusions: "",
    duration: "",
    image: "",
    imagePreview: "",
    imageFile: null,
    status: "Active",
    tags: [],
  });

  const [isUploadingCategory, setIsUploadingCategory] = useState(false);
  const [isUploadingService, setIsUploadingService] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Handle image upload
  const handleImageUpload = async (event, type) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        dispatch(
          showSnackbar({
            message: "Image size should be less than 5MB",
            severity: "error",
          })
        );
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        dispatch(
          showSnackbar({
            message: "Please select an image file",
            severity: "error",
          })
        );
        return;
      }

      // Generate local preview
      const previewUrl = URL.createObjectURL(file);

      if (type === "category") {
        setCategoryForm({
          ...categoryForm,
          imageFile: file,
          imagePreview: previewUrl,
        });
      } else if (type === "service") {
        setServiceForm({
          ...serviceForm,
          imageFile: file,
          imagePreview: previewUrl,
        });
      }

      dispatch(
        showSnackbar({
          message: "Image selected successfully!",
          severity: "success",
        })
      );
    }
  };

  const handleOpenCategoryDialog = (type, category = null) => {
    console.log("handleOpenCategoryDialog called", { type, category });
    setDialogType("category");
    setSelectedCategory(category);

    if (category) {
      setCategoryForm({
        name: category.name,
        description: category.description,
        image: category.image || "",
        imagePreview: category.image || "",
        imageFile: null,
        status: category.status,
        tags: category.tags || [],
        newTagName: "",
        newTagIcon: "",
      });
    } else {
      setCategoryForm({
        name: "",
        description: "",
        image: "",
        imagePreview: "",
        imageFile: null,
        status: "Active",
        tags: [],
        newTagName: "",
        newTagIcon: "",
      });
    }
    setOpenDialog(true);
  };

  const handleOpenServiceDialog = (type, categoryId, service = null) => {
    setDialogType("service");
    setSelectedCategory(categories.find((cat) => (cat._id || cat.id) === categoryId));
    setSelectedService(service);

    if (service) {
      setServiceForm({
        name: service.name,
        description: service.description || "",
        price: service.price ? (service.price / 100).toString() : "",
        mrp: service.mrp ? (service.mrp / 100).toString() : "",
        inclusions: service.inclusions ? service.inclusions.join('\n') : "",
        exclusions: service.exclusions ? service.exclusions.join('\n') : "",
        duration: service.duration?.toString() || "",
        image: service.image || "",
        imagePreview: service.image || "",
        imageFile: null,
        status: service.status,
        tags: service.tags || [],
      });
    } else {
      setServiceForm({
        name: "",
        description: "",
        price: "",
        mrp: "",
        inclusions: "",
        exclusions: "",
        duration: "",
        image: "",
        imagePreview: "",
        imageFile: null,
        status: "Active",
        tags: [],
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
      tags: [],
      newTagName: "",
      newTagIcon: "",
    });
    setServiceForm({
      name: "",
      description: "",
      price: "",
      mrp: "",
      inclusions: "",
      exclusions: "",
      duration: "",
      image: "",
      imagePreview: "",
      status: "Active",
      tags: [],
    });
  };

  const handleSaveCategory = async () => {
    try {
      // Generate slug from name
      const slug = categoryForm.name
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");

      // Upload image if a new file was selected
      let finalImageUrl = categoryForm.image;
      if (categoryForm.imageFile) {
        setIsUploadingCategory(true);
        try {
          // Categories: Square aspect ratio (500x500)
          finalImageUrl = await uploadToCloudinary(categoryForm.imageFile);
        } catch (error) {
          console.error("Cloudinary upload failed:", error);
          dispatch(showSnackbar({ message: "Failed to upload image to Cloudinary", severity: "error" }));
          setIsUploadingCategory(false);
          return;
        }
        setIsUploadingCategory(false);
      }

      // Handle image
      const categoryData = {
        name: categoryForm.name,
        description: categoryForm.description,
        status: categoryForm.status,
        slug: slug,
        image: finalImageUrl,
        tags: categoryForm.tags
      };

      if (selectedCategory) {
        await dispatch(
          updateCategory({
            id: selectedCategory._id || selectedCategory.id,
            data: categoryData,
          })
        ).unwrap();
        dispatch(
          showSnackbar({
            message: "Category updated successfully!",
            severity: "success",
          })
        );
      } else {
        await dispatch(createCategory(categoryData)).unwrap();
        dispatch(
          showSnackbar({
            message: "Category created successfully!",
            severity: "success",
          })
        );
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Save category error:", error);
      dispatch(showSnackbar({ message: typeof error === 'string' ? error : (error.message || "Failed to save category"), severity: "error" }));
    }
  };

  const handleSaveService = async () => {
    try {
      if (!selectedCategory || !selectedCategory.id) {
        dispatch(showSnackbar({ message: "Category selection missing", severity: "error" }));
        return;
      }

      // Upload image if a new file was selected
      let finalImageUrl = serviceForm.image;
      if (serviceForm.imageFile) {
        setIsUploadingService(true);
        try {
          // Services: Standard aspect ratio (800x600)
          finalImageUrl = await uploadToCloudinary(serviceForm.imageFile);
        } catch (error) {
          console.error("Cloudinary upload failed:", error);
          dispatch(showSnackbar({ message: "Failed to upload image to Cloudinary", severity: "error" }));
          setIsUploadingService(false);
          return;
        }
        setIsUploadingService(false);
      }

      const serviceData = {
        name: serviceForm.name,
        description: serviceForm.description,
        price: Math.round(Number(serviceForm.price) * 100),
        mrp: serviceForm.mrp ? Math.round(Number(serviceForm.mrp) * 100) : undefined,
        inclusions: serviceForm.inclusions ? serviceForm.inclusions.split('\n').map(i => i.trim()).filter(Boolean) : [],
        exclusions: serviceForm.exclusions ? serviceForm.exclusions.split('\n').map(i => i.trim()).filter(Boolean) : [],
        duration: serviceForm.duration ? Number(serviceForm.duration) : null,
        status: serviceForm.status,
        images: finalImageUrl ? [finalImageUrl] : [],
        tags: serviceForm.tags,
        category: selectedCategory._id || selectedCategory.id
      };

      if (selectedService) {
        await dispatch(
          updateServiceInCategory({
            categoryId: selectedCategory._id || selectedCategory.id,
            serviceId: selectedService._id || selectedService.id,
            serviceData: serviceData,
          })
        ).unwrap();
        dispatch(
          showSnackbar({
            message: "Service updated successfully!",
            severity: "success",
          })
        );
      } else {
        await dispatch(
          addServiceToCategory({
            categoryId: selectedCategory._id || selectedCategory.id,
            serviceData: serviceData,
          })
        ).unwrap();
        dispatch(
          showSnackbar({
            message: "Service added successfully!",
            severity: "success",
          })
        );
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Save service error:", error);
      dispatch(showSnackbar({ message: typeof error === 'string' ? error : (error.message || "Failed to save service"), severity: "error" }));
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    // ... existing delete logic
  };

  const handleDeleteService = async (categoryId, serviceId) => {
    // ... existing service delete logic
  };

  const getStatusColor = (status) => {
    return status === "Active" ? "success" : "error";
  };

  const handleAddTag = () => {
    if (categoryForm.newTagName.trim() && categoryForm.newTagIcon.trim()) {
      const newTag = {
        name: categoryForm.newTagName.trim(),
        icon: categoryForm.newTagIcon.trim()
      };
      setCategoryForm({
        ...categoryForm,
        tags: [...categoryForm.tags, newTag],
        newTagName: "",
        newTagIcon: "",
      });
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setCategoryForm({
      ...categoryForm,
      tags: categoryForm.tags.filter((_, index) => index !== indexToRemove),
    });
  };

  const handleToggleServiceTag = (tag) => {
    const currentTags = serviceForm.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    setServiceForm({ ...serviceForm, tags: newTags });
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
        >
          Add Category
        </Button>
      </Box>

      {/* Categories Grid */}
      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} key={category._id || category.id}>
            <Accordion
              expanded={expandedCategory === (category._id || category.id)}
              onChange={(event, isExpanded) =>
                setExpandedCategory(isExpanded ? (category._id || category.id) : false)
              }
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Avatar
                    sx={{ mr: 2, width: 50, height: 50 }}
                    src={getBannerUrl(category.image)}
                  >
                    {!category.image && (category.icon || <ImageIcon />)}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={2}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Box textAlign="center">
                      <Typography variant="h6" color="primary">
                        {category.serviceCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Services
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h6" color="success.main">
                        {category.totalBookings}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Bookings
                      </Typography>
                    </Box>
                    <Box textAlign="center" display="flex" alignItems="center">
                      <StarIcon
                        sx={{ fontSize: 16, color: "#ffc107", mr: 0.5 }}
                      />
                      <Typography variant="h6">
                        {category.averageRating}
                      </Typography>
                    </Box>
                    <Chip
                      label={category.status}
                      color={getStatusColor(category.status)}
                      size="small"
                    />
                    <Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          console.log("Edit button clicked", category);
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
                          console.log("Delete button clicked", category);
                          e.stopPropagation();
                          handleDeleteCategory(category._id || category.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
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
                        handleOpenServiceDialog("create", category._id || category.id)
                      }
                    >
                      Add Service
                    </Button>
                  </Box>

                  {/* Services List */}
                  {category.services && category.services.length > 0 ? (
                    <List>
                      {category.services.map((service, index) => (
                        <React.Fragment key={service._id || service.id}>
                          <ListItem>
                            <Avatar
                              sx={{ mr: 2, bgcolor: "secondary.main" }}
                              src={getBannerUrl(service.image)}
                            >
                              {!service.image && <WorkIcon />}
                            </Avatar>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight="bold"
                                  >
                                    {service.name}
                                  </Typography>
                                  <Chip
                                    label={service.status}
                                    color={getStatusColor(service.status)}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Price: <strong>₹{(service.price / 100).toFixed(2)}</strong>
                                    {service.duration &&
                                      ` • Duration: ${service.duration}h`}
                                  </Typography>
                                  {service.description && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {service.description}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() =>
                                  handleOpenServiceDialog(
                                    "edit",
                                    category._id || category.id,
                                    service
                                  )
                                }
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                color="error"
                                onClick={() =>
                                  handleDeleteService(category._id || category.id, service._id || service.id)
                                }
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < category.services.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
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
                          handleOpenServiceDialog("create", category._id || category.id)
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
      {categories.length === 0 && (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <WorkIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
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
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Category Image
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{ width: 60, height: 60 }}
                    src={getOptimizedUrl(categoryForm.imagePreview || categoryForm.image)}
                  >
                    {!categoryForm.imagePreview && !categoryForm.image && !isUploadingCategory && (
                      <ImageIcon />
                    )}
                    {isUploadingCategory && <CircularProgress size={20} />}
                  </Avatar>
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: "none" }}
                      id="category-image-upload"
                      type="file"
                      onChange={(e) => handleImageUpload(e, "category")}
                    />
                    <label htmlFor="category-image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={isUploadingCategory ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                        size="small"
                        disabled={isUploadingCategory}
                      >
                        {isUploadingCategory ? "Uploading..." : "Upload Image"}
                      </Button>
                    </label>
                    {(categoryForm.image || categoryForm.imagePreview) && (
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        onClick={() =>
                          setCategoryForm({
                            ...categoryForm,
                            image: "",
                            imagePreview: "",
                          })
                        }
                        sx={{ ml: 1 }}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" color="primary" gutterBottom>
                  Manage Service Tags
                </Typography>
                <Typography variant="caption" color="text.secondary" paragraph>
                  Add tags to group services in the mobile app (e.g., "Cleaning", "Repair"). Icons should be valid Ionicons names.
                </Typography>

                <Box display="flex" gap={1} mb={2} alignItems="flex-start">
                  <TextField
                    label="Tag Name"
                    size="small"
                    value={categoryForm.newTagName || ""}
                    onChange={(e) => setCategoryForm({ ...categoryForm, newTagName: e.target.value })}
                    sx={{ flex: 1 }}
                    placeholder="e.g. AC Repair"
                  />
                  <TextField
                    label="Icon Name (Ionicons)"
                    size="small"
                    value={categoryForm.newTagIcon || ""}
                    onChange={(e) => setCategoryForm({ ...categoryForm, newTagIcon: e.target.value })}
                    helperText="Use proper Ionicon name (e.g. 'construct-outline')"
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddTag}
                    disabled={!categoryForm.newTagName?.trim() || !categoryForm.newTagIcon?.trim()}
                    sx={{ height: 40 }}
                  >
                    Add
                  </Button>
                </Box>

                <Box
                  display="flex"
                  flexWrap="wrap"
                  gap={1}
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    minHeight: '50px'
                  }}
                >
                  {(!categoryForm.tags || categoryForm.tags.length === 0) && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', width: '100%', textAlign: 'center' }}>
                      No tags added yet. Add a tag above.
                    </Typography>
                  )}
                  {categoryForm.tags && categoryForm.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography variant="body2" fontWeight="bold">{tag.name}</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>({tag.icon})</Typography>
                        </Box>
                      }
                      onDelete={() => handleRemoveTag(index)}
                      color="primary"
                      variant="filled"
                    />
                  ))}
                </Box>
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
              <Grid xs={12}>
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
              <Grid xs={12}>
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
              <Grid xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Service Image
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{ width: 60, height: 60 }}
                    src={getOptimizedUrl(serviceForm.imagePreview || serviceForm.image)}
                  >
                    {!serviceForm.imagePreview && !serviceForm.image && !isUploadingService && (
                      <ImageIcon />
                    )}
                    {isUploadingService && <CircularProgress size={20} />}
                  </Avatar>
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: "none" }}
                      id="service-image-upload"
                      type="file"
                      onChange={(e) => handleImageUpload(e, "service")}
                    />
                    <label htmlFor="service-image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={isUploadingService ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                        size="small"
                        disabled={isUploadingService}
                      >
                        {isUploadingService ? "Uploading..." : "Upload Image"}
                      </Button>
                    </label>
                    {(serviceForm.image || serviceForm.imagePreview) && (
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        onClick={() =>
                          setServiceForm({
                            ...serviceForm,
                            image: "",
                            imagePreview: "",
                          })
                        }
                        sx={{ ml: 1 }}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                </Box>
              </Grid>
              <Grid xs={12} sm={6}>
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
              <Grid xs={12} sm={6}>
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
              <Grid xs={12}>
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
              {selectedCategory && selectedCategory.tags && selectedCategory.tags.length > 0 && (
                <Grid xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags (Sub-categories)
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedCategory.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onClick={() => handleToggleServiceTag(tag)}
                        color={
                          serviceForm.tags && serviceForm.tags.includes(tag)
                            ? "primary"
                            : "default"
                        }
                        variant={
                          serviceForm.tags && serviceForm.tags.includes(tag)
                            ? "filled"
                            : "outlined"
                        }
                        clickable
                      />
                    ))}
                  </Box>
                </Grid>
              )}
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
    </Box >
  );
};

export default CategoriesManagement;
