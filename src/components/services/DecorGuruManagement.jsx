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
    FormControl,
    InputLabel,
    Select,
    Autocomplete,
    InputAdornment,
    Grid
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Weekend as DecorIcon, // Changed Icon
    Search as SearchIcon,
    AccessTime as TimeIcon,
    AttachMoney as MoneyIcon,
    CloudUpload as UploadIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import { getOptimizedUrl, getBannerUrl } from "../../utils/getOptimizedUrl";
import {
    fetchServices,
    addServiceToCategory,
    fetchCategories,
    updateService,
    removeServiceFromCategory,
    selectServices,
    selectCategories,
    selectServicesLoading,
    selectServicesErrors
} from '../../store/slices/servicesSlice';

const DecorGuruManagement = () => {
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
        pricingUnit: 'fixed',
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        dispatch(fetchServices({ section: 'decor' })); // Fetch Decor services
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
                pricingUnit: service.pricingUnit || 'fixed',
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
                pricingUnit: 'fixed',
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
                // Decor Guru: Portrait aspect ratio (2:3) -> 800x1200
                const imageUrl = await uploadToCloudinary(file);
                setSelectedImage(imageUrl);
                setImagePreview(imageUrl);
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
                section: 'decor',
                pricingUnit: formData.pricingUnit || 'fixed',
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
            dispatch(fetchServices({ section: 'decor' }));
        } catch (err) {
            console.error('Error saving service:', err);
            alert(`Failed to save service: ${typeof err === 'string' ? err : err.message || 'Unknown error'}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            await dispatch(removeServiceFromCategory({ serviceId: id, categoryId: 'dummy' }));
            dispatch(fetchServices({ section: 'decor' }));
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DecorIcon fontSize="large" color="primary" />
                        Decor Guru
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage Home Decor and Design services.
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
                            display: 'flex', // Portrait card roughly 2:3 ratio in mobile, here just fitting grid
                            flexDirection: 'column',
                            transition: '0.3s',
                            '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
                        }}>
                            {/* Taller image aspect ratio for Admin preview to match mobile intent */}
                            <Box sx={{ position: 'relative', height: 240, overflow: 'hidden', bgcolor: '#f5f5f5' }}>
                                {service.images?.[0] ? (
                                    <Avatar
                                        variant="square"
                                        src={getBannerUrl(service.images[0])}
                                        sx={{ width: '100%', height: '100%' }}
                                    />
                                ) : (
                                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                        <DecorIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3 }} />
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
                <DialogTitle>{isEditing ? 'Edit Decor Service' : 'Add Decor Guru Service'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>

                        {/* Image Upload Section - Vertical Preview */}
                        <Box display="flex" flexDirection="column" alignItems="center" gap={2} mb={2}>
                            <Box
                                sx={{
                                    width: 120,
                                    height: 180, // Portrait aspect ratio 2:3
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
                            <Typography variant="caption" color="textSecondary">
                                Recommend: Portrait Image (2:3 aspect ratio)
                            </Typography>
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
                            helperText="Select a backend category for grouping"
                        >
                            {categories.map((cat) => (
                                <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>
                                    {cat.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            label="Pricing Unit"
                            name="pricingUnit"
                            value={formData.pricingUnit || 'fixed'}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        >
                            <MenuItem value="fixed">Fixed Price</MenuItem>
                            <MenuItem value="hourly">Per Hour</MenuItem>
                            <MenuItem value="sq_ft">Per Sq. Ft.</MenuItem>
                        </TextField>
                        <Box display="flex" gap={2}>
                            <TextField
                                label="Price (₹)"
                                helperText="Entered in Rupees, saved in Paise for precision."
                                name="price"
                                type="number"
                                value={formData.price}
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

export default DecorGuruManagement;
