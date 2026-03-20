// Fixed CategoryServicesManagement.jsx with proper category extraction
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Fab,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  Work as WorkIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import { getOptimizedUrl } from "../../utils/getOptimizedUrl";

import {
  fetchServices,
  addServiceToCategory,
  updateServiceInCategory,
  removeServiceFromCategory,
  selectServices,
  selectServicesLoading,
  selectServicesErrors,
} from "../../store/slices/servicesSlice";

const CategoryServicesManagement = ({ category, onBack }) => {
  const dispatch = useDispatch();

  const services = useSelector(selectServices);
  const loading = useSelector(selectServicesLoading);
  const errors = useSelector(selectServicesErrors);

  const [categoryServices, setCategoryServices] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    mrp: "",
    inclusions: "",
    exclusions: "",
    duration: "",
    images: [""],
    isActive: true,
    isStartingPrice: false,
    pricingUnit: "fixed",
  });

  const [isUploading, setIsUploading] = useState(false);

  // Debug logs to check category data
  useEffect(() => {
    console.log("CategoryServicesManagement - Category prop:", category);
    console.log("Category ID:", category?.id);
    console.log("Category _id:", category?._id);
  }, [category]);

  useEffect(() => {
    if (category?.id || category?._id) {
      // Use either id or _id field from category
      const categoryId = category.id || category._id;
      console.log("Fetching services for category ID:", categoryId);
      dispatch(fetchServices({ category: categoryId }));
    }
  }, [dispatch, category?.id, category?._id]);

  useEffect(() => {
    // Filter services for this category
    if (services && Array.isArray(services)) {
      const categoryId = category?.id || category?._id;
      const filteredServices = services.filter((service) => {
        const serviceCategoryId =
          service.category?.id || service.category?._id || service.category;
        return serviceCategoryId === categoryId;
      });
      console.log("Filtered services:", filteredServices);
      setCategoryServices(filteredServices);
    }
  }, [services, category?.id, category?._id]);

  const handleOpenServiceDialog = (service = null) => {
    if (service) {
      setSelectedService(service);
      setServiceForm({
        name: service.name || "",
        description: service.description || "",
        price: service.price ? (Number(service.price) / 100).toString() : "",
        mrp: service.mrp ? (Number(service.mrp) / 100).toString() : "",
        inclusions: service.inclusions ? service.inclusions.join('\n') : "",
        exclusions: service.exclusions ? service.exclusions.join('\n') : "",
        duration: service.duration?.toString() || "",
        images:
          service.images && service.images.length > 0 ? service.images : [""],
        isActive: service.isActive !== false,
        tagId: service.tagId || "",
        isStartingPrice: service.isStartingPrice || false,
        pricingUnit: service.pricingUnit || "fixed",
      });
    } else {
      setSelectedService(null);
      setServiceForm({
        name: "",
        description: "",
        price: "",
        mrp: "",
        inclusions: "",
        exclusions: "",
        duration: "",
        images: [""],
        isActive: true,
        tagId: "",
        isStartingPrice: false,
        pricingUnit: "fixed",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedService(null);
    setServiceForm({
      name: "",
      description: "",
      price: "",
      mrp: "",
      inclusions: "",
      exclusions: "",
      duration: "",
      images: [""],
      isActive: true,
      tagId: "",
      isStartingPrice: false,
      pricingUnit: "fixed",
    });
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length + (serviceForm.images?.filter(Boolean).length || 0) > 5) {
      alert("You can only have up to 5 images per service");
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image ${file.name} is too large (max 5MB)`);
        return false;
      }
      if (!file.type.startsWith("image/")) {
        alert(`File ${file.name} is not an image`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      try {
        setIsUploading(true);
        const uploadPromises = validFiles.map(file => uploadToCloudinary(file));
        const uploadedUrls = await Promise.all(uploadPromises);

        setServiceForm(prev => ({
          ...prev,
          images: [...(prev.images || []).filter(Boolean), ...uploadedUrls]
        }));
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload some images to Cloudinary");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSaveService = async () => {
    try {
      if (!serviceForm.name.trim()) {
        alert("Service name is required");
        return;
      }
      const categoryId = category?.id || category?._id;
      if (!categoryId) {
        alert("Category information is missing.");
        return;
      }

      const serviceData = {
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim(),
        price: Math.round(Number(serviceForm.price) * 100),
        mrp: serviceForm.mrp ? Math.round(Number(serviceForm.mrp) * 100) : undefined,
        inclusions: serviceForm.inclusions ? serviceForm.inclusions.split('\n').filter(i => i.trim()) : [],
        exclusions: serviceForm.exclusions ? serviceForm.exclusions.split('\n').filter(i => i.trim()) : [],
        duration: serviceForm.duration ? Number(serviceForm.duration) : null,
        images: serviceForm.images.filter(Boolean),
        tagId: serviceForm.tagId,
        isActive: serviceForm.isActive,
        isStartingPrice: serviceForm.isStartingPrice,
        pricingUnit: serviceForm.pricingUnit,
        category: categoryId
      };

      if (selectedService) {
        await dispatch(
          updateServiceInCategory({
            categoryId: categoryId,
            serviceId: selectedService.id || selectedService._id,
            serviceData: serviceData,
          })
        ).unwrap();
        alert("Service updated successfully!");
      } else {
        await dispatch(
          addServiceToCategory({
            categoryId: categoryId,
            serviceData: serviceData,
          })
        ).unwrap();
        alert("Service created successfully!");
      }

      handleCloseDialog();
      dispatch(fetchServices({ category: categoryId }));
    } catch (error) {
      console.error("Error saving service:", error);
      alert(typeof error === 'string' ? error : (error.message || "Error saving service"));
    }
  };

  const handleDeleteService = async (serviceId, serviceName) => {
    if (window.confirm(`Are you sure you want to delete "${serviceName}"?`)) {
      try {
        const categoryId = category?.id || category?._id;
        await dispatch(
          removeServiceFromCategory({
            categoryId: categoryId,
            serviceId,
          })
        ).unwrap();
        alert("Service deleted successfully!");
        // Refresh services
        dispatch(fetchServices({ category: categoryId }));
      } catch (error) {
        console.error("Error deleting service:", error);
        alert(`Error: ${error.message || error}`);
      }
    }
  };

  if (loading.services) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Back to Categories
          </Button>
          <Box>
            <Typography variant="h4" component="h1">
              {category?.name} Services
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage services in {category?.name} category • ID:{" "}
              {category?.id || category?._id}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenServiceDialog()}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
            },
          }}
        >
          Add Service
        </Button>
      </Box>

      {/* Category Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <WorkIcon sx={{ fontSize: 30 }} />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h6" gutterBottom>
                {category?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {category?.description || "No description available"}
              </Typography>
              <Box display="flex" gap={2} alignItems="center">
                <Chip
                  label={`${categoryServices.length} Services`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={category?.isActive !== false ? "Active" : "Inactive"}
                  color={category?.isActive !== false ? "success" : "default"}
                  size="small"
                />
                <Chip
                  label={`Auto-Category: ${category?.id || category?._id}`}
                  color="info"
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Display */}
      {errors.services && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.services}
        </Alert>
      )}

      {/* Debug Info Card (Remove in production) */}
      <Card
        sx={{ mb: 3, backgroundColor: "#f0f7ff", border: "1px dashed #2196f3" }}
      >
        <CardContent sx={{ py: 2 }}>
          <Typography
            variant="body2"
            color="primary"
            sx={{ fontWeight: "bold", mb: 1 }}
          >
            🔧 Debug Info (Auto Category Extraction):
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Category ID: {category?.id || category?._id || "Not found"} |
            Services Found: {categoryServices.length} | Services in Redux:{" "}
            {services?.length || 0}
          </Typography>
        </CardContent>
      </Card>

      {/* Services Content */}
      {categoryServices && categoryServices.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Price
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Duration
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Status
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categoryServices.map((service) => (
                <TableRow key={service.id || service._id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        sx={{ width: 40, height: 40 }}
                        src={service.images?.[0]}
                      >
                        <WorkIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {service.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {service.id || service._id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {service.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="flex-end"
                      gap={0.5}
                    >
                      <MoneyIcon sx={{ fontSize: 16, color: "success.main" }} />
                      <Typography variant="subtitle2" fontWeight="bold">
                        ₹{(service.price / 100).toFixed(2)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {service.duration ? (
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={0.5}
                      >
                        <TimeIcon sx={{ fontSize: 16, color: "info.main" }} />
                        <Typography variant="body2">
                          {service.duration}m
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={service.isActive !== false ? "Active" : "Inactive"}
                      color={service.isActive !== false ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={1}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenServiceDialog(service)}
                        title="Edit Service"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          handleDeleteService(
                            service.id || service._id,
                            service.name
                          )
                        }
                        title="Delete Service"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Empty State */
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <WorkIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            No services in this category yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Add your first service to {category?.name}. The category will be
            automatically assigned.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => handleOpenServiceDialog()}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            Add First Service
          </Button>
        </Paper>
      )}

      {/* Service Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6">
            {selectedService ? "Edit Service" : "Create New Service"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedService
              ? "Update service details"
              : `Add a new service to ${category?.name} (Category ID: ${category?.id || category?._id
              } will be auto-assigned)`}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Auto Category Info */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Auto Category Assignment:</strong> This service will be
                automatically assigned to "{category?.name}" category.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label="Service Name"
              value={serviceForm.name}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, name: e.target.value })
              }
              margin="normal"
              required
              helperText="Enter a clear, descriptive name for the service"
            />

            <TextField
              fullWidth
              label="Description"
              value={serviceForm.description}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, description: e.target.value })
              }
              margin="normal"
              multiline
              rows={3}
              required
              helperText="Provide a detailed description of what this service includes"
            />

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Price (₹)"
                  type="number"
                  value={serviceForm.price}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, price: e.target.value })
                  }
                  margin="normal"
                  required
                  helperText="Service price in rupees"
                  InputProps={{
                    startAdornment: (
                      <MoneyIcon sx={{ mr: 1, color: "success.main" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="MRP (₹)"
                  type="number"
                  value={serviceForm.mrp}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, mrp: e.target.value })
                  }
                  margin="normal"
                  helperText="Maximum Retail Price (Optional for discounts)"
                  InputProps={{
                    startAdornment: (
                      <MoneyIcon sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  type="number"
                  value={serviceForm.duration}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, duration: e.target.value })
                  }
                  margin="normal"
                  helperText="Estimated service duration (optional)"
                  InputProps={{
                    startAdornment: (
                      <TimeIcon sx={{ mr: 1, color: "info.main" }} />
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {/* Inclusions and Exclusions */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="What's Included (1 per line)"
                  value={serviceForm.inclusions}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, inclusions: e.target.value })
                  }
                  margin="normal"
                  multiline
                  rows={4}
                  helperText="Enter each inclusion on a new line"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="What's Excluded (1 per line)"
                  value={serviceForm.exclusions}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, exclusions: e.target.value })
                  }
                  margin="normal"
                  multiline
                  rows={4}
                  helperText="Enter each exclusion on a new line"
                />
              </Grid>
            </Grid>

            {/* PRICING UNIT SELECTION */}
            <FormControl fullWidth margin="normal">
              <InputLabel>Pricing Unit</InputLabel>
              <Select
                value={serviceForm.pricingUnit || "fixed"}
                label="Pricing Unit"
                onChange={(e) => setServiceForm({ ...serviceForm, pricingUnit: e.target.value })}
              >
                <MenuItem value="fixed">Fixed Price</MenuItem>
                <MenuItem value="hourly">Per Hour</MenuItem>
                <MenuItem value="sq_ft">Per Sq. Ft.</MenuItem>
              </Select>
            </FormControl>

            {/* TAG SELECTION */}
            {category?.tags && category.tags.length > 0 && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Service Tag (Optional)</InputLabel>
                <Select
                  value={serviceForm.tagId || ""}
                  label="Service Tag (Optional)"
                  onChange={(e) => setServiceForm({ ...serviceForm, tagId: e.target.value })}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {category.tags.map((tag) => (
                    <MenuItem key={tag._id} value={tag._id}>
                      {tag.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Image Upload */}
            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <ImageIcon sx={{ fontSize: 20 }} />
              Service Image
            </Typography>

            <Box display="flex" flexDirection="column" gap={2} mb={2}>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {/* Existing Images or Previews */}
                {serviceForm.images?.filter(Boolean).map((img, index) => (
                  <Box key={index} position="relative" width={60} height={60}>
                    <Avatar
                      sx={{ width: 60, height: 60 }}
                      src={getOptimizedUrl(img)}
                      variant="rounded"
                    >
                      <WorkIcon />
                    </Avatar>
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                        padding: 0.2
                      }}
                      onClick={() => {
                        const newImages = [...serviceForm.images];
                        newImages.splice(index, 1);
                        setServiceForm({ ...serviceForm, images: newImages });
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} color="error" />
                    </IconButton>
                  </Box>
                ))}
                {isUploading && (
                  <Box width={60} height={60} display="flex" alignItems="center" justifyContent="center">
                    <CircularProgress size={24} />
                  </Box>
                )}
              </Box>

              <Box>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="service-image-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label htmlFor="service-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    size="small"
                    disabled={isUploading || (serviceForm.images?.filter(Boolean).length || 0) >= 5}
                    startIcon={isUploading ? <CircularProgress size={16} /> : <ImageIcon />}
                  >
                    {isUploading ? "Uploading..." : "Upload Images (Max 5)"}
                  </Button>
                </label>
                {serviceForm.images?.filter(Boolean).length > 0 && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setServiceForm({ ...serviceForm, images: [] })}
                    sx={{ ml: 1 }}
                    disabled={isUploading}
                  >
                    Clear All
                  </Button>
                )}
              </Box>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={serviceForm.isStartingPrice}
                  onChange={(e) => setServiceForm({ ...serviceForm, isStartingPrice: e.target.checked })}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Show 'Starts from' Label</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Turn this ON for services with variable pricing (e.g., repairs)
                  </Typography>
                </Box>
              }
              sx={{ mb: 2, mt: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={serviceForm.isActive}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      isActive: e.target.checked,
                    })
                  }
                />
              }
              label="Active Service"
              sx={{ mt: 2, display: "block" }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveService}
            variant="contained"
            disabled={loading.creating || loading.updating}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            {loading.creating || loading.updating
              ? "Saving..."
              : "Save Service"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add service"
        onClick={() => handleOpenServiceDialog()}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          display: { xs: "flex", md: "none" },
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default CategoryServicesManagement;
