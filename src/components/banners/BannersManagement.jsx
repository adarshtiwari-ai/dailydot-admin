import React, { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Switch,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    FormControlLabel,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Autocomplete
} from '@mui/material';
import { Grid } from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Image as ImageIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';
import api from '../../config/api';
import { uploadToCloudinary } from '../../utils/uploadToCloudinary';
import { getBannerUrl } from '../../utils/getOptimizedUrl';

const BannersManagement = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Force HMR update
    const [openDialog, setOpenDialog] = useState(false);
    const cardRef = useRef(null);
    const [cardDimensions, setCardDimensions] = useState({ width: 0, height: 0 });

    // Data for dropdowns
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);

    useEffect(() => {
        if (cardRef.current) {
            const { width, height } = cardRef.current.getBoundingClientRect();
            setCardDimensions({ width, height });
        }
    }, [banners]); // Recalculate if layout might change with banners load

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        image: '',
        imageFile: null,
        imagePreview: '',
        redirectUrl: '',
        isActive: true,
        sortOrder: 0,
        placement: 'home',
        referenceId: null
    });
    const [selectedBanner, setSelectedBanner] = useState(null);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${api.baseURL}/banners`);
            setBanners(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching banners:', err);
            setError('Failed to fetch banners. Please make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [catRes, servRes] = await Promise.all([
                axios.get(`${api.baseURL}/categories`),
                axios.get(`${api.baseURL}/services`)
            ]);
            setCategories(catRes.data.categories || []);
            setServices(servRes.data.services || []);
        } catch (err) {
            console.error("Error fetching dropdown data", err);
        }
    }

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return getBannerUrl(imagePath, cardDimensions.width, cardDimensions.height);
        if (imagePath.startsWith('data:')) return imagePath; // Handle file preview
        // api.baseURL is http://localhost:3000/api/v1
        // We want http://localhost:3000
        const baseUrl = api.baseURL.replace('/api/v1', '');
        return `${baseUrl}${imagePath}`;
    };

    useEffect(() => {
        fetchBanners();
        fetchDropdownData();
    }, []);

    const handleOpenDialog = (banner = null) => {
        if (banner) {
            setSelectedBanner(banner);
            setFormData({
                title: banner.title || '',
                subtitle: banner.subtitle || '',
                image: banner.image || '',
                imagePreview: banner.image || '',
                redirectUrl: banner.redirectUrl || '',
                isActive: banner.isActive,
                sortOrder: banner.sortOrder || 0,
                placement: banner.placement || 'home',
                referenceId: banner.referenceId || null
            });
        } else {
            setSelectedBanner(null);
            setFormData({
                title: '',
                subtitle: '',
                image: '',
                imageFile: null,
                imagePreview: '',
                redirectUrl: '',
                isActive: true,
                sortOrder: 0,
                placement: 'home',
                referenceId: null
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedBanner(null);
    };

    const handleSave = async () => {
        try {
            if (!formData.title) {
                alert('Title is required');
                return;
            }

            let imageUrl = formData.image;

            if (formData.imageFile) {
                try {
                    setLoading(true);

                    // Client-side compression
                    const options = {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 2000,
                        useWebWorker: true,
                        initialQuality: 0.8
                    };

                    let fileToUpload = formData.imageFile;
                    try {
                        console.log('Compressing image...', fileToUpload.size / 1024, 'KB');
                        fileToUpload = await imageCompression(formData.imageFile, options);
                        console.log('Compressed image size:', fileToUpload.size / 1024, 'KB');
                    } catch (compressionError) {
                        console.error("Compression failed, using original file:", compressionError);
                        fileToUpload = formData.imageFile; // Fallback to original
                    }

                    imageUrl = await uploadToCloudinary(fileToUpload);
                } catch (error) {
                    console.error("Upload error:", error);
                    alert("Failed to upload banner image to Cloudinary");
                    setLoading(false);
                    return;
                }
            } else if (!selectedBanner && !formData.image) {
                alert('Image is required for new banners');
                return;
            }

            const payload = {
                title: formData.title,
                subtitle: formData.subtitle || '',
                redirectUrl: formData.redirectUrl || '',
                sortOrder: formData.sortOrder,
                isActive: formData.isActive,
                placement: formData.placement,
                image: imageUrl,
                referenceId: formData.referenceId
            };

            if (selectedBanner) {
                await axios.put(`${api.baseURL}/banners/${selectedBanner._id}`, payload);
            } else {
                await axios.post(`${api.baseURL}/banners`, payload);
            }
            fetchBanners();
            handleCloseDialog();
        } catch (err) {
            console.error('Error saving banner:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to save banner';
            alert(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this banner?')) {
            try {
                await axios.delete(`${api.baseURL}/banners/${id}`);
                fetchBanners();
            } catch (err) {
                console.error('Error deleting banner:', err);
                alert('Failed to delete banner');
            }
        }
    };

    const handleToggleActive = async (banner) => {
        try {
            await axios.put(`${api.baseURL}/banners/${banner._id}`, {
                ...banner,
                isActive: !banner.isActive
            });
            fetchBanners();
        } catch (err) {
            console.error('Error updating banner status:', err);
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Banners Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                    Add Banner
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {banners.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center' }}>
                    <ImageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">No banners found. Create one to get started.</Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {banners.map((banner, index) => (
                        <Grid item xs={12} sm={6} md={4} key={banner._id} ref={index === 0 ? cardRef : null}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                <CardMedia
                                    component="img"
                                    height="180"
                                    image={getImageUrl(banner.image)}
                                    alt={banner.title}
                                    sx={{ objectFit: 'cover' }}
                                />
                                {!banner.isActive && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: 180,
                                            bgcolor: 'rgba(0,0,0,0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <BannerInactiveLabel />
                                    </Box>
                                )}
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" gutterBottom>{banner.title}</Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>{banner.subtitle}</Typography>

                                    <Chip
                                        label={banner.placement.toUpperCase()}
                                        size="small"
                                        color={banner.placement === 'home' ? 'primary' : 'secondary'}
                                        sx={{ mt: 1, mb: 1 }}
                                    />

                                    <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                                        <FormControlLabel
                                            control={<Switch checked={banner.isActive} onChange={() => handleToggleActive(banner)} />}
                                            label={banner.isActive ? "Active" : "Inactive"}
                                        />
                                        <Box>
                                            <IconButton color="primary" onClick={() => handleOpenDialog(banner)}><EditIcon /></IconButton>
                                            <IconButton color="error" onClick={() => handleDelete(banner._id)}><DeleteIcon /></IconButton>
                                        </Box>
                                    </Box>
                                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.disabled' }}>
                                        Order: {banner.sortOrder}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedBanner ? 'Edit Banner' : 'New Banner'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Subtitle"
                            value={formData.subtitle}
                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        />

                        <FormControl fullWidth margin="normal">
                            <InputLabel>Placement</InputLabel>
                            <Select
                                value={formData.placement}
                                label="Placement"
                                onChange={(e) => setFormData({ ...formData, placement: e.target.value, referenceId: null })}
                            >
                                <MenuItem value="home">Home</MenuItem>
                                <MenuItem value="category">Category Detail</MenuItem>
                                <MenuItem value="service">Service Detail</MenuItem>
                            </Select>
                        </FormControl>

                        {formData.placement === 'category' && (
                            <Autocomplete
                                options={categories}
                                getOptionLabel={(option) => option.name}
                                value={categories.find(c => c._id === formData.referenceId) || null}
                                onChange={(event, newValue) => {
                                    setFormData({ ...formData, referenceId: newValue ? newValue._id : null });
                                }}
                                renderInput={(params) => <TextField {...params} label="Select Category" margin="normal" />}
                            />
                        )}

                        {formData.placement === 'service' && (
                            <Autocomplete
                                options={services}
                                getOptionLabel={(option) => option.name}
                                value={services.find(s => s._id === formData.referenceId) || null}
                                onChange={(event, newValue) => {
                                    setFormData({ ...formData, referenceId: newValue ? newValue._id : null });
                                }}
                                renderInput={(params) => <TextField {...params} label="Select Service" margin="normal" />}
                            />
                        )}

                        <Box sx={{ mt: 2, mb: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>Banner Image</Typography>
                            <Box display="flex" alignItems="center" gap={2}>
                                {formData.imagePreview && (
                                    <Box
                                        component="img"
                                        src={getImageUrl(formData.imagePreview)}
                                        alt="Preview"
                                        sx={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 1 }}
                                    />
                                )}
                                <Button
                                    variant="outlined"
                                    component="label"
                                >
                                    Upload File
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setFormData({
                                                    ...formData,
                                                    imageFile: file,
                                                    imagePreview: URL.createObjectURL(file)
                                                });
                                            }
                                        }}
                                    />
                                </Button>
                            </Box>
                        </Box>

                        <TextField
                            margin="normal"
                            fullWidth
                            label="Redirect URL (Optional)"
                            value={formData.redirectUrl}
                            onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Sort Order"
                            type="number"
                            value={formData.sortOrder}
                            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                        />
                        <FormControlLabel
                            control={<Switch checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />}
                            label="Active"
                            sx={{ mt: 2 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={!formData.title || (!selectedBanner && !formData.imageFile && !formData.image)}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

const BannerInactiveLabel = () => (
    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
        Inactive
    </Typography>
);

export default BannersManagement;
