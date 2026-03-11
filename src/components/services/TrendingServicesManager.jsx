import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Switch,
    Snackbar,
    Alert,
    CircularProgress,
    TextField,
    InputAdornment
} from '@mui/material';
import { Search, TrendingUp } from '@mui/icons-material';
import axiosInstance from '../../services/api.service';

const TrendingServicesManager = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/services');
            if (response.data.success) {
                setServices(response.data.services);
            }
        } catch (error) {
            console.error('Fetch services error:', error);
            showSnackbar('Failed to fetch services', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTrending = async (serviceId, currentStatus) => {
        try {
            // Optimistic update
            const updatedServices = services.map(s =>
                s._id === serviceId ? { ...s, isTrending: !currentStatus } : s
            );
            setServices(updatedServices);

            const response = await axiosInstance.patch(`/services/${serviceId}`, { isTrending: !currentStatus });
            if (response.data.success) {
                showSnackbar(`Service ${!currentStatus ? 'added to' : 'removed from'} Trending`, 'success');
            }
        } catch (error) {
            console.error('Toggle trending error:', error);
            showSnackbar('Failed to update trending status', 'error');
            fetchServices(); // Revert on error
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const filteredServices = (services || []).filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center">
                    <TrendingUp sx={{ mr: 1, color: '#4f46e5' }} />
                    <Typography variant="h5" fontWeight="bold">Trending Services Manager</Typography>
                </Box>
                <TextField
                    size="small"
                    placeholder="Search services..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                {loading && (
                    <Box display="flex" justifyContent="center" p={5}>
                        <CircularProgress color="primary" />
                    </Box>
                )}
                {!loading && (
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell>Service Name</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredServices.map((service) => (
                                <TableRow key={service._id} hover>
                                    <TableCell fontWeight="medium">{service.name}</TableCell>
                                    <TableCell>{service.category?.name || 'Uncategorized'}</TableCell>
                                    <TableCell>₹{service.price}</TableCell>
                                    <TableCell align="center">
                                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                            <Typography variant="caption" color={service.isTrending ? "primary" : "textSecondary"}>
                                                Make Trending
                                            </Typography>
                                            <Switch
                                                size="small"
                                                checked={service.isTrending || false}
                                                onChange={() => handleToggleTrending(service._id, service.isTrending)}
                                            />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TrendingServicesManager;
