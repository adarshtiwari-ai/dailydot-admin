import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    IconButton,
    CircularProgress,
    Grid,
    Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
// Use the generic axiosService from the project for auth compatibility
import axiosInstance from '../services/api.service';
import { toast } from 'react-toastify';

const BookingAdjustmentModal = ({ bookingId, onSuccess }) => {
    const [additionalItems, setAdditionalItems] = useState([{ reason: '', amount: '' }]);
    const [loading, setLoading] = useState(false);

    const handleItemChange = (index, field, value) => {
        const newItems = [...additionalItems];
        newItems[index][field] = value;
        setAdditionalItems(newItems);
    };

    const handleAddItem = () => {
        setAdditionalItems([...additionalItems, { reason: '', amount: '' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = additionalItems.filter((_, i) => i !== index);
        setAdditionalItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Filter out rows where reason or amount is missing/empty
        const validItems = additionalItems.filter(
            item => item.reason.trim() !== '' && item.amount !== '' && !isNaN(item.amount)
        );

        if (validItems.length === 0) {
            toast.error('Please enter valid items before submitting.');
            return;
        }

        try {
            setLoading(true);

            // Transform decimal Rupees into integer Paise
            const transformedItems = validItems.map(item => ({
                reason: item.reason.trim(),
                amount: Math.round(parseFloat(item.amount) * 100)
            }));

            // Submit via the axios instance to automatically include admin auth bearer token
            const response = await axiosInstance.patch(`/admin/bookings/${bookingId}/adjust`, {
                additionalItems: transformedItems
            });

            if (response.data.success) {
                toast.success('Customer bill updated and notified!');
                if (onSuccess) {
                    onSuccess();
                }
            }
        } catch (error) {
            console.error('Error updating bill:', error);
            toast.error(error.response?.data?.message || 'Failed to update the bill.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
                Post-Service Bill Adjustments
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Add additional parts or labor required during the service.
                <strong> Please enter all amounts in standard Rupees (₹)</strong>, the system will handle conversion automatically.
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', mb: 2 }}>
                {additionalItems.map((item, index) => (
                    <Grid container spacing={2} alignItems="center" key={index} sx={{ mb: index !== additionalItems.length - 1 ? 2 : 0 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Reason (e.g., Extra Pipe)"
                                value={item.reason}
                                onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                                placeholder="Description"
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={10} sm={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Amount in ₹"
                                type="number"
                                inputProps={{ step: "0.01", min: "0" }}
                                value={item.amount}
                                onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                                placeholder="₹"
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={2} sm={2} sx={{ textAlign: 'center' }}>
                            <IconButton
                                color="error"
                                onClick={() => handleRemoveItem(index)}
                                disabled={loading || additionalItems.length === 1}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                ))}

                <Box sx={{ mt: 2 }}>
                    <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        onClick={handleAddItem}
                        disabled={loading}
                        size="small"
                    >
                        Add Another Item
                    </Button>
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {loading ? 'Updating...' : 'Update Customer Bill'}
                </Button>
            </Box>
        </Box>
    );
};

export default BookingAdjustmentModal;
