// Create this file: src/components/Categories/CategoryDetail.jsx

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";

import {
  fetchServices,
  addServiceToCategory,
  updateServiceInCategory,
  removeServiceFromCategory,
  selectServices,
  selectServicesLoading,
  selectServicesErrors,
} from "../../store/slices/servicesSlice";

const CategoryDetail = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
  });

  // Get category name from navigation state or fallback
  const categoryName = location.state?.categoryName || "Category";

  useEffect(() => {
    // Fetch services for this category
    dispatch(fetchServices({ category: categoryId }));
  }, [dispatch, categoryId]);

  useEffect(() => {
    // Filter services for this category
    if (services && Array.isArray(services)) {
      const filteredServices = services.filter(
        (service) =>
          service.category === categoryId || service.category?.id === categoryId
      );
      setCategoryServices(filteredServices);
    }
  }, [services, categoryId]);

  const handleOpenServiceDialog = (service = null) => {
    if (service) {
      setSelectedService(service);
      setServiceForm({
        name: service.name || "",
        description: service.description || "",
        price: service.price ? (service.price / 100).toString() : "",
        mrp: service.mrp ? (service.mrp / 100).toString() : "",
        inclusions: service.inclusions ? service.inclusions.join('\n') : "",
        exclusions: service.exclusions ? service.exclusions.join('\n') : "",
        duration: service.duration?.toString() || "",
        images:
          service.images && service.images.length > 0 ? service.images : [""],
        isActive: service.isActive !== false,
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
    });
  };

  const handleImageChange = (index, value) => {
    const newImages = [...serviceForm.images];
    newImages[index] = value;
    setServiceForm({ ...serviceForm, images: newImages });
  };

  const addImageField = () => {
    setServiceForm({
      ...serviceForm,
      images: [...serviceForm.images, ""],
    });
  };

  const removeImageField = (index) => {
    const newImages = serviceForm.images.filter((_, i) => i !== index);
    setServiceForm({
      ...serviceForm,
      images: newImages.length > 0 ? newImages : [""],
    });
  };

  const handleSaveService = async () => {
    try {
      // Validate required fields
      if (!serviceForm.name.trim()) {
        alert("Service name is required");
        return;
      }

      if (!serviceForm.description.trim()) {
        alert("Service description is required");
        return;
      }

      if (!serviceForm.price || isNaN(parseFloat(serviceForm.price))) {
        alert("Valid price is required");
        return;
      }

      // Prepare service data according to API requirements
      const serviceData = {
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim(),
        price: Math.round(parseFloat(serviceForm.price) * 100),
        mrp: serviceForm.mrp ? Math.round(parseFloat(serviceForm.mrp) * 100) : undefined,
        inclusions: serviceForm.inclusions ? serviceForm.inclusions.split('\n').filter(i => i.trim()) : [],
        exclusions: serviceForm.exclusions ? serviceForm.exclusions.split('\n').filter(i => i.trim()) : [],
        duration: serviceForm.duration
          ? parseInt(serviceForm.duration)
          : undefined,
        images: serviceForm.images.filter((img) => img.trim() !== ""),
        isActive: serviceForm.isActive,
      };

      if (selectedService) {
        // Update existing service
        await dispatch(
          updateServiceInCategory({
            categoryId,
            serviceId: selectedService.id,
            serviceData,
          })
        ).unwrap();
        alert("Service updated successfully!");
      } else {
        // Create new service
        await dispatch(
          addServiceToCategory({
            categoryId,
            serviceData,
          })
        ).unwrap();
        alert("Service created successfully!");
      }

      handleCloseDialog();
      // Refresh services
      dispatch(fetchServices({ category: categoryId }));
    } catch (error) {
      console.error("Error saving service:", error);
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

  const handleDeleteService = async (serviceId, serviceName) => {
    if (window.confirm(`Are you sure you want to delete "${serviceName}"?`)) {
      try {
        await dispatch(
          removeServiceFromCategory({
            categoryId,
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
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate("/admin/categories")}
          sx={{ textDecoration: "none" }}
        >
          Categories
        </Link>
        <Typography color="text.primary">{categoryName}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton
            onClick={() => navigate("/admin/categories")}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {categoryName} Services
          </Typography>
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

      {/* Error Display */}
      {errors.services && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.services}
        </Alert>
      )}

      {/* Services Table */}
      {categoryServices && categoryServices.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Service Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="center">Duration</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categoryServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {service.name}
                    </Typography>
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
                    >
                      <MoneyIcon sx={{ fontSize: 16, mr: 0.5 }} />₹
                      {(service.price / 100).toFixed(2)}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {service.duration && (
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <TimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        {service.duration}m
                      </Box>
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
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenServiceDialog(service)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        handleDeleteService(service.id, service.name)
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
        /* Empty State */
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <MoneyIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            No services in this category yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Add your first service to {categoryName}
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
        <DialogTitle>
          {selectedService ? "Edit Service" : "Create New Service"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Service Name"
              value={serviceForm.name}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, name: e.target.value })
              }
              margin="normal"
              required
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
                  rows={3}
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
                  rows={3}
                />
              </Grid>
            </Grid>

            {/* Image URLs */}
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Service Images
            </Typography>
            {serviceForm.images.map((image, index) => (
              <Box
                key={index}
                display="flex"
                gap={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <TextField
                  fullWidth
                  label={`Image URL ${index + 1}`}
                  value={image}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  size="small"
                />
                {serviceForm.images.length > 1 && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeImageField(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button
              variant="text"
              size="small"
              onClick={addImageField}
              sx={{ mt: 1 }}
            >
              Add Another Image
            </Button>

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
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveService}
            variant="contained"
            disabled={loading.creating || loading.updating}
          >
            {loading.creating || loading.updating ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryDetail;
