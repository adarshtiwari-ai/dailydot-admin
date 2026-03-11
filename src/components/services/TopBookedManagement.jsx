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
    Typography,
    Alert,
    CircularProgress,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    TextField,
    InputAdornment
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Star as StarIcon,
    Search as SearchIcon,
    Work as WorkIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchServices,
    updateService,
    selectServices,
    selectServicesLoading,
    selectServicesErrors
} from '../../store/slices/servicesSlice';

const TopBookedManagement = () => {
    const dispatch = useDispatch();
    const services = useSelector(selectServices);
    const loading = useSelector(selectServicesLoading);
    const error = useSelector(selectServicesErrors);

    const [openDialog, setOpenDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [topBookedServices, setTopBookedServices] = useState([]);

    useEffect(() => {
        dispatch(fetchServices({}));
    }, [dispatch]);

    useEffect(() => {
        if (services) {
            setTopBookedServices(services.filter(s => s.isTopBooked));
        }
    }, [services]);

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setSearchQuery('');
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleToggleTopBooked = async (service, isTopBooked) => {
        try {
            // We need to send other required fields if the backend validation is strict,
            // but based on typical update implementation, partial updates might be allowed 
            // OR we need to send the whole object. 
            // Looking at the updateServiceInCategory thunk (which likely uses the same update endpoint),
            // it uses FormData.
            // Let's assume the PUT /services/:id endpoint accepts partial updates or at least 
            // doesn't fail if we send just one field if validation allows it.
            // However, typical express-validator checks might require name/description etc. if not conditional.
            // Let's check the route again.
            // Route: PUT /:id [auth, adminAuth] ...
            // It uses findByIdAndUpdate with req.body.
            // It runs validators!
            // The validators are checked in the PUT route?
            // Re-reading service routes... 
            // PUT route: router.put("/:id", ... async (req, res) => { ... await Service.findByIdAndUpdate(..., req.body, { runValidators: true }) })
            // It does NOT have express-validator middleware chain like POST does.
            // So partial update IS supported as long as schema validation passes.
            // `isTopBooked` is optional in schema (default false), so updating it alone is fine.

            // Wait, servicesSlice likely uses 'updateService' thunk.
            // I need to check how to use it.

            await dispatch(updateService({
                id: service._id || service.id,
                serviceData: { isTopBooked }
            })).unwrap();

            // dispatch(fetchServices({})); // Refetch to ensure state consistency
        } catch (err) {
            console.error('Error updating service:', err);
            alert('Failed to update service status');
        }
    };

    // Filter available services for the dialog
    // Exclude those that are already top booked
    const availableServices = services.filter(s =>
        !s.isTopBooked &&
        (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading.services && services.length === 0) {
        return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4">Top Booked Services</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage services appearing in the "Top Booked" section on the home screen
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenDialog}
                    sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                    Add Service
                </Button>
            </Box>

            {error.services && <Alert severity="error" sx={{ mb: 3 }}>{error.services}</Alert>}

            {topBookedServices.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center' }}>
                    <StarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">No Top Booked services selected yet.</Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {topBookedServices.map((service) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={service._id || service.id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                transition: '0.3s',
                                '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
                            }}>
                                <Box sx={{ position: 'relative', height: 140, overflow: 'hidden' }}>
                                    <Avatar
                                        variant="square"
                                        src={service.images?.[0] || ''}
                                        sx={{ width: '100%', height: '100%' }}
                                    >
                                        <WorkIcon sx={{ fontSize: 50, opacity: 0.5 }} />
                                    </Avatar>
                                    <Chip
                                        label={service.category?.name || 'Service'}
                                        size="small"
                                        color="primary"
                                        sx={{ position: 'absolute', top: 10, right: 10 }}
                                    />
                                </Box>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" gutterBottom noWrap title={service.name}>
                                        {service.name}
                                    </Typography>

                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="body2" color="success.main" fontWeight="bold">
                                            ₹{service.price}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {service.duration} mins
                                        </Typography>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        mb: 2,
                                        height: 40
                                    }}>
                                        {service.description}
                                    </Typography>

                                    <Button
                                        variant="outlined"
                                        color="error"
                                        fullWidth
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleToggleTopBooked(service, false)}
                                    >
                                        Remove
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Add Service Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Add to Top Booked</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, mb: 2 }}>
                        <TextField
                            fullWidth
                            placeholder="Search services..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {availableServices.length > 0 ? (
                            availableServices.map((service) => (
                                <ListItem key={service._id || service.id} divider>
                                    <ListItemAvatar>
                                        <Avatar src={service.images?.[0]} variant="rounded">
                                            <WorkIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={service.name}
                                        secondary={`${service.category?.name} • ₹${service.price}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => handleToggleTopBooked(service, true)}
                                        >
                                            Add
                                        </Button>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))
                        ) : (
                            <Box p={3} textAlign="center">
                                <Typography color="text.secondary">
                                    {searchQuery ? 'No matching services found' : 'All services are already in Top Booked'}
                                </Typography>
                            </Box>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TopBookedManagement;
