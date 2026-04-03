import React, { useState, useEffect } from 'react';
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
    Grid,
    IconButton,
    Paper,
    Switch,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    FormControlLabel,
    InputAdornment
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Build as BuildIcon,
    Timer as TimerIcon,
    AttachMoney as MoneyIcon,
    ColorLens as ColorIcon
} from '@mui/icons-material';
import axios from 'axios';
import api from '../../config/api';

// Simple icon picker or list of allowed icons could be improvements, 
// for now we'll accept Ionicon names as text.

const QuickFixManagement = () => {
    const [quickFixes, setQuickFixes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        duration: '60 mins',
        icon: 'construct-outline',
        iconColor: '#4f46e5',
        isActive: true,
        sortOrder: 0
    });
    const [selectedQuickFix, setSelectedQuickFix] = useState(null);

    const fetchQuickFixes = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${api.baseURL}/quick-fixes?all=true`);
            setQuickFixes(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching quick fixes:', err);
            setError('Failed to fetch quick fixes. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuickFixes();
    }, []);

    const handleOpenDialog = (quickFix = null) => {
        if (quickFix) {
            setSelectedQuickFix(quickFix);
            setFormData({
                title: quickFix.title || '',
                price: quickFix.price ? (quickFix.price / 100).toString() : '',
                duration: quickFix.duration || '',
                icon: quickFix.icon || 'construct-outline',
                iconColor: quickFix.iconColor || '#4f46e5',
                isActive: quickFix.isActive,
                sortOrder: quickFix.sortOrder || 0
            });
        } else {
            setSelectedQuickFix(null);
            setFormData({
                title: '',
                price: '',
                duration: '60 mins',
                icon: 'construct-outline',
                iconColor: '#4f46e5',
                isActive: true,
                sortOrder: 0
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedQuickFix(null);
    };

    const handleSave = async () => {
        try {
            if (!formData.title || !formData.price) {
                alert('Title and Price are required');
                return;
            }

            const payload = {
                ...formData,
                price: Math.round(Number(formData.price) * 100) // Scale to subunits
            };

            if (selectedQuickFix) {
                await axios.put(`${api.baseURL}/quick-fixes/${selectedQuickFix._id}`, payload);
            } else {
                await axios.post(`${api.baseURL}/quick-fixes`, payload);
            }
            fetchQuickFixes();
            handleCloseDialog();
        } catch (err) {
            console.error('Error saving quick fix:', err);
            alert('Failed to save quick fix');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this Quick Fix?')) {
            try {
                await axios.delete(`${api.baseURL}/quick-fixes/${id}`);
                fetchQuickFixes();
            } catch (err) {
                console.error('Error deleting quick fix:', err);
                alert('Failed to delete quick fix');
            }
        }
    };

    const handleToggleActive = async (quickFix) => {
        try {
            await axios.put(`${api.baseURL}/quick-fixes/${quickFix._id}`, {
                ...quickFix,
                isActive: !quickFix.isActive
            });
            fetchQuickFixes();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Quick Fixes Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }} // Amber/Orange theme
                >
                    Add Quick Fix
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {quickFixes.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center' }}>
                    <BuildIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">No Quick Fixes found. Create one to get started.</Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {quickFixes.map((item) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', borderTop: `4px solid ${item.iconColor}` }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                        <Box
                                            sx={{
                                                bgcolor: `${item.iconColor}20`,
                                                p: 1.5,
                                                borderRadius: '50%',
                                                color: item.iconColor
                                            }}
                                        >
                                            <Typography variant="h6" component="span" sx={{ fontFamily: 'monospace' }}>
                                                {/* In a real app we'd render the actual icon based on the string name */}
                                                🔧
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={item.isActive ? 'Active' : 'Inactive'}
                                            color={item.isActive ? 'success' : 'default'}
                                            size="small"
                                            variant={item.isActive ? 'filled' : 'outlined'}
                                        />
                                    </Box>

                                    <Typography variant="h6" gutterBottom>{item.title}</Typography>

                                    <Box display="flex" alignItems="center" gap={1} mb={0.5} color="text.secondary">
                                        <MoneyIcon fontSize="small" />
                                        <Typography variant="body2">₹{item.price}</Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1} mb={2} color="text.secondary">
                                        <TimerIcon fontSize="small" />
                                        <Typography variant="body2">{item.duration}</Typography>
                                    </Box>

                                    <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" color="text.disabled">
                                            Order: {item.sortOrder}
                                        </Typography>
                                        <Box>
                                            <IconButton color="primary" onClick={() => handleOpenDialog(item)}><EditIcon /></IconButton>
                                            <IconButton color="error" onClick={() => handleDelete(item._id)}><DeleteIcon /></IconButton>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedQuickFix ? 'Edit Quick Fix' : 'New Quick Fix'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Title (e.g., Tap Leaking)"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    label="Price (₹)"
                                    type="number"
                                    value={formData.price}
                                    helperText="Entered in Rupees, saved in Paise for precision."
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    label="Duration (e.g., 45 mins)"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    label="Icon Name (Ionicons)"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    helperText="e.g., water, flash, hammer"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    label="Icon Color (Hex)"
                                    value={formData.iconColor}
                                    onChange={(e) => setFormData({ ...formData, iconColor: e.target.value })}
                                    helperText="e.g., #EA580C"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Box sx={{ width: 20, height: 20, bgcolor: formData.iconColor, borderRadius: '50%' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>

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
                    <Button onClick={handleSave} variant="contained" disabled={!formData.title || !formData.price}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default QuickFixManagement;
