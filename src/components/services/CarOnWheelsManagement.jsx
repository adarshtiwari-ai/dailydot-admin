import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Typography,
    Alert,
    CircularProgress,
    Avatar,
    TextField,
    MenuItem,
    InputAdornment,
    Grid
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    DirectionsCar as CarIcon,
    Search as SearchIcon,
    AccessTime as TimeIcon,
    AttachMoney as MoneyIcon,
    CloudUpload as UploadIcon
} from '@mui/icons-material';
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import { getOptimizedUrl, getBannerUrl } from "../../utils/getOptimizedUrl";
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchServices,
    addServiceToCategory, // We might need a different action if not attached to a category, or we just assign a dummy/default category?
    // Actually, "Car on Wheels" is a SECTION, but services still need a category?
    // The requirement didn't specify category. It just said section='car_on_wheels'.
    // If category is required by Schema, we might need to handle it.
    // Schema says category is ref 'Category', required: true?
    // Let's check Schema... viewed earlier... category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }
    // So we DO need a category. Maybe "Car on Wheels" services belong to a "Car Services" category?
    // Or we repurpose addServiceToCategory to strict addService.
    // The user didn't specify creating a category.
    // I can fetch categories and let user pick, or create a "Car on Wheels" category automatically?
    // Let's allow picking a category for now, or just use the generic createService if we made one?
    // servicesSlice has `createCategory` but `addServiceToCategory` is used for creating services.
    // I'll use `addServiceToCategory` and let user pick a category, OR just pick the first available one if hidden.
    // Better: Allow category selection in the form.
    fetchCategories,
    updateService,
    removeServiceFromCategory, // This deletes the service
    selectServices,
    selectCategories,
    selectServicesLoading,
    selectServicesErrors
} from '../../store/slices/servicesSlice';

// We need a generic createService thunk if we don't want to bind to a specific category ID in the helper?
// `addServiceToCategory` takes `categoryId`.
// Let's just use `fetchServices({ section: 'car_on_wheels' })` to list.
// And for creation, we need a category. I will add a Category selector to the form.

const CarOnWheelsManagement = () => {
    const dispatch = useDispatch();
    const services = useSelector(selectServices);
    const categories = useSelector(selectCategories);
    const loading = useSelector(selectServicesLoading);
    const error = useSelector(selectServicesErrors);

    const [openDialog, setOpenDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        mrp: '',
        inclusions: '',
        exclusions: '',
        duration: '',
        category: '',
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        dispatch(fetchServices({ section: 'car_on_wheels' }));
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleOpenDialog = (service = null) => {
        if (service) {
            setIsEditing(true);
            setCurrentService(service);
            setFormData({
                name: service.name,
                description: service.description,
                price: service.price ? (service.price / 100).toString() : '',
                mrp: service.mrp ? (service.mrp / 100).toString() : '',
                inclusions: service.inclusions ? service.inclusions.join(', ') : '',
                exclusions: service.exclusions ? service.exclusions.join(', ') : '',
                duration: service.duration,
                category: service.category?._id || service.category || '',
            });
            setImagePreview(service.images?.[0] || null);
            setSelectedImage(null);
        } else {
            setIsEditing(false);
            setCurrentService(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                mrp: '',
                inclusions: '',
                exclusions: '',
                duration: '',
                category: categories.length > 0 ? categories[0].id : '',
            });
            setImagePreview(null);
            setSelectedImage(null);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                setIsUploading(true);
                // Car on Wheels: Landscape aspect ratio (4:3) -> 800x600 or 1200x900
                const imageUrl = await uploadToCloudinary(file);
                setSelectedImage(imageUrl);
                setImagePreview(imageUrl);
                setFormData({ ...formData, image: imageUrl });
            } catch (error) {
                console.error("Upload error:", error);
                alert("Failed to upload image to Cloudinary");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSubmit = async () => {
        try {
            const serviceData = {
                name: formData.name,
                description: formData.description,
                price: Math.round(Number(formData.price) * 100),
                mrp: formData.mrp ? Math.round(Number(formData.mrp) * 100) : undefined,
                inclusions: formData.inclusions ? formData.inclusions.split(',').map(i => i.trim()).filter(Boolean) : [],
                exclusions: formData.exclusions ? formData.exclusions.split(',').map(i => i.trim()).filter(Boolean) : [],
                duration: Number(formData.duration),
                category: formData.category,
                section: 'car_on_wheels',
                images: imagePreview ? [imagePreview] : []
            };

            if (isEditing) {
                await dispatch(updateService({
                    id: currentService._id || currentService.id,
                    serviceData: serviceData
                })).unwrap();
            } else {
                await dispatch(addServiceToCategory({
                    categoryId: formData.category,
                    serviceData: serviceData
                })).unwrap();
            }

            setOpenDialog(false);
            dispatch(fetchServices({ section: 'car_on_wheels' }));
        } catch (err) {
            console.error('Error saving service:', err);
            // The Thunk returns a string error on rejectWithValue
            alert(`Failed to save service: ${typeof err === 'string' ? err : err.message || 'Unknown error'}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            // We can use removeServiceFromCategory or a generic deleteService if we had one.
            // removeServiceFromCategory uses: axiosInstance.delete(`/services/${serviceId}`);
            // It needs categoryId for state updates but the API call only needs serviceId.
            // We can pass a dummy categoryId? Or Fix the slice to have generic delete.
            // deleteService doesn't exist in slice?
            // `removeServiceFromCategory` is what we have. API route is generic.
            // We'll use it.
            await dispatch(removeServiceFromCategory({ serviceId: id, categoryId: 'dummy' }));
            dispatch(fetchServices({ section: 'car_on_wheels' }));
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CarIcon fontSize="large" color="primary" />
                        Car on Wheels
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage Packers, Movers, and Ride services.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' }}
                >
                    Add Service
                </Button>
            </Box>

            {loading.services && <CircularProgress />}
            {error.services && <Alert severity="error">{error.services}</Alert>}

            <Grid container spacing={3}>
                {services.map((service) => (
                    <Grid item xs={12} sm={6} md={4} key={service._id || service.id}>
                        <Card sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: '0.3s',
                            '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
                        }}>
                            <Box sx={{ position: 'relative', height: 160, overflow: 'hidden', bgcolor: '#f5f5f5' }}>
                                {service.images?.[0] ? (
                                    <Avatar
                                        variant="square"
                                        src={getBannerUrl(service.images[0])}
                                        sx={{ width: '100%', height: '100%' }}
                                    />
                                ) : (
                                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                        <CarIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3 }} />
                                    </Box>
                                )}
                            </Box>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" gutterBottom>{service.name}</Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    {service.description}
                                </Typography>
                                <Box display="flex" gap={2} mt={2}>
                                    <Chip icon={<MoneyIcon />} label={`₹${service.price}`} size="small" color="success" variant="outlined" />
                                    <Chip icon={<TimeIcon />} label={`${service.duration} min`} size="small" variant="outlined" />
                                </Box>
                                <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                                    <IconButton size="small" onClick={() => handleOpenDialog(service)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleDelete(service._id || service.id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditing ? 'Edit Service' : 'Add Car on Wheels Service'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>

                        {/* Image Upload Section */}
                        <Box display="flex" flexDirection="column" alignItems="center" gap={2} mb={2}>
                            <Box
                                sx={{
                                    width: 120,
                                    height: 120,
                                    border: '2px dashed #ccc',
                                    borderRadius: 2,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    overflow: 'hidden',
                                    cursor: 'pointer'
                                }}
                                onClick={() => fileInputRef.current.click()}
                            >
                                {imagePreview ? (
                                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        {isUploading && (
                                            <Box sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                bgcolor: 'rgba(255,255,255,0.7)',
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <CircularProgress size={24} />
                                            </Box>
                                        )}
                                    </Box>
                                ) : (
                                    isUploading ? <CircularProgress size={24} /> : <UploadIcon color="action" />
                                )}
                            </Box>
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            <Button
                                size="small"
                                onClick={() => fileInputRef.current.click()}
                                disabled={isUploading}
                                startIcon={isUploading ? <CircularProgress size={16} /> : null}
                            >
                                {isUploading ? "Uploading..." : "Upload Image"}
                            </Button>
                        </Box>

                        <TextField
                            label="Service Name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <TextField
                            select
                            label="Category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            helperText="Select a backend category for grouping (e.g. Transport)"
                        >
                            {categories.map((cat) => (
                                <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>
                                    {cat.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Box display="flex" gap={2}>
                            <TextField
                                label="Price (₹)"
                                name="price"
                                type="number"
                                value={formData.price}
                                helperText="Entered in Rupees, saved in Paise for precision."
                                onChange={handleInputChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                            <TextField
                                label="MRP"
                                name="mrp"
                                type="number"
                                value={formData.mrp}
                                onChange={handleInputChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                                helperText="Optional strike-through price"
                            />
                            <TextField
                                label="Duration (min)"
                                name="duration"
                                type="number"
                                value={formData.duration}
                                onChange={handleInputChange}
                                fullWidth
                            />
                        </Box>
                        <TextField
                            label="What's Included (comma-separated)"
                            name="inclusions"
                            value={formData.inclusions}
                            onChange={handleInputChange}
                            fullWidth
                            multiline
                            rows={2}
                            helperText="Enter items separated by commas"
                        />
                        <TextField
                            label="What's Excluded (comma-separated)"
                            name="exclusions"
                            value={formData.exclusions}
                            onChange={handleInputChange}
                            fullWidth
                            multiline
                            rows={2}
                            helperText="Enter items separated by commas"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CarOnWheelsManagement;
