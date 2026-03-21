import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, Grid, Avatar, Chip, 
    Tabs, Tab, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, Button, CircularProgress,
    IconButton, Divider, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, DialogContentText
} from '@mui/material';
import {
    ArrowBack, Phone, Email, Star, AccountBalanceWallet,
    History, Receipt, AccountBalance
} from '@mui/icons-material';
import axiosInstance from '../services/api.service';
import { toast } from 'react-toastify';

const ProviderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [provider, setProvider] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [transactions, setTransactions] = useState([]);

    // Settlement Modal State
    const [openSettle, setOpenSettle] = useState(false);
    const [settleAmount, setSettleAmount] = useState('');
    const [settling, setSettling] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profileRes, bookingsRes, txRes] = await Promise.all([
                axiosInstance.get(`/admin/providers/${id}`),
                axiosInstance.get(`/admin/providers/${id}/bookings`),
                axiosInstance.get(`/admin/providers/${id}/transactions`)
            ]);

            if (profileRes.data.success) {
                setProvider(profileRes.data.provider);
                setWallet(profileRes.data.wallet);
            }
            if (bookingsRes.data.success) {
                setBookings(bookingsRes.data.bookings);
            }
            if (txRes.data.success) {
                setTransactions(txRes.data.transactions);
            }
        } catch (error) {
            console.error('Failed to fetch provider details:', error);
            toast.error('Error loading provider data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleSettleSubmit = async () => {
        if (!settleAmount || isNaN(settleAmount) || Number(settleAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            setSettling(true);
            const amountInPaise = Math.round(Number(settleAmount) * 100);
            const res = await axiosInstance.post(`/admin/providers/${id}/settle`, {
                amount: amountInPaise
            });

            if (res.data.success) {
                toast.success('Wallet settled successfully');
                setOpenSettle(false);
                setSettleAmount('');
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error('Settlement error:', error);
            toast.error(error.response?.data?.message || 'Failed to settle wallet');
        } finally {
            setSettling(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!provider) {
        return (
            <Box p={4} textAlign="center">
                <Typography variant="h5">Provider not found</Typography>
                <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
                    Go Back
                </Button>
            </Box>
        );
    }

    const currentBalance = (wallet?.balance || 0) / 100;
    const isDebt = currentBalance < 0;

    return (
        <Box p={{ xs: 2, md: 4 }} sx={{ bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={4}>
                <IconButton onClick={() => navigate(-1)} sx={{ mr: 2, bgcolor: 'white', '&:hover': { bgcolor: '#eee' } }}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">Provider Details</Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Profile Card */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Avatar 
                                src={provider.photo} 
                                sx={{ width: 120, height: 120, mx: 'auto', mb: 2, border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                            >
                                {provider.name.charAt(0)}
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>{provider.name}</Typography>
                            <Chip 
                                label={provider.isActive ? "Active" : "Inactive"} 
                                color={provider.isActive ? "success" : "default"} 
                                size="small" 
                                sx={{ mb: 3 }}
                            />
                            
                            <Box display="flex" flexDirection="column" gap={2} alignItems="center" mb={4}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Phone color="action" fontSize="small" />
                                    <Typography variant="body1">{provider.phone}</Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Email color="action" fontSize="small" />
                                    <Typography variant="body1">{provider.email || 'No email'}</Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Star sx={{ color: '#f1c40f' }} fontSize="small" />
                                    <Typography variant="body1" fontWeight="bold">{provider.averageRating.toFixed(1)}</Typography>
                                    <Typography variant="body2" color="textSecondary">({provider.totalRatings} reviews)</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDebt ? 'rgba(211, 47, 47, 0.05)' : 'rgba(46, 125, 50, 0.05)' }}>
                                <Typography variant="overline" color="textSecondary">Current Balance</Typography>
                                <Typography variant="h4" fontWeight="bold" color={isDebt ? 'error.main' : 'success.main'}>
                                    {isDebt ? '-' : ''}₹{Math.abs(currentBalance).toFixed(2)}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {isDebt ? "Provider owes commission" : "Owed to provider"}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Content Tabs */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={tabValue} onChange={handleTabChange} sx={{ px: 2 }}>
                                <Tab icon={<History />} iconPosition="start" label="Service History" />
                                <Tab icon={<AccountBalanceWallet />} iconPosition="start" label="Financial Ledger" />
                            </Tabs>
                        </Box>

                        <CardContent sx={{ p: 0 }}>
                            {/* Tab 1: Service History */}
                            {tabValue === 0 && (
                                <TableContainer>
                                    <Table>
                                        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                            <TableRow>
                                                <TableCell fontWeight="bold">Date</TableCell>
                                                <TableCell fontWeight="bold">Customer</TableCell>
                                                <TableCell fontWeight="bold">Service</TableCell>
                                                <TableCell fontWeight="bold">Bill Amount</TableCell>
                                                <TableCell fontWeight="bold">Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {bookings.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center">No bookings found</TableCell>
                                                </TableRow>
                                            ) : (
                                                bookings.map((booking) => (
                                                    <TableRow key={booking._id} hover>
                                                        <TableCell>{new Date(booking.scheduledDate).toLocaleDateString()}</TableCell>
                                                        <TableCell>{booking.userId?.name || 'Unknown'}</TableCell>
                                                        <TableCell>{booking.items?.[0]?.name || 'N/A'}</TableCell>
                                                        <TableCell fontWeight="bold">₹{(booking.totalAmount / 100).toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={booking.status} 
                                                                size="small" 
                                                                color={booking.status?.toLowerCase() === 'completed' ? 'success' : 'default'} 
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {/* Tab 2: Financial Ledger */}
                            {tabValue === 1 && (
                                <Box>
                                    <Box p={2} display="flex" justifyContent="flex-end">
                                        <Button 
                                            variant="contained" 
                                            startIcon={<AccountBalance />}
                                            onClick={() => setOpenSettle(true)}
                                        >
                                            Settle Wallet
                                        </Button>
                                    </Box>
                                    <TableContainer>
                                        <Table>
                                            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                                <TableRow>
                                                    <TableCell fontWeight="bold">Date</TableCell>
                                                    <TableCell fontWeight="bold">Type</TableCell>
                                                    <TableCell fontWeight="bold">Amount</TableCell>
                                                    <TableCell fontWeight="bold">Description</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {transactions.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="center">No transactions found</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    transactions.map((tx) => (
                                                        <TableRow key={tx._id} hover>
                                                            <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={tx.type.replace(/_/g, ' ')} 
                                                                    size="small" 
                                                                    variant="outlined"
                                                                    color={tx.type === 'COMMISSION_DEBIT' ? 'error' : 'success'}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>
                                                                ₹{(tx.amount / 100).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell color="textSecondary">
                                                                {tx.description}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Settlement Modal */}
            <Dialog open={openSettle} onClose={() => setOpenSettle(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Manual Wallet Settlement</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Record a manual settlement to adjust the provider's wallet balance.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Amount (in ₹)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={settleAmount}
                        onChange={(e) => setSettleAmount(e.target.value)}
                        placeholder="e.g. 500"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSettle(false)} disabled={settling}>Cancel</Button>
                    <Button 
                        onClick={handleSettleSubmit} 
                        variant="contained" 
                        disabled={settling}
                        startIcon={settling ? <CircularProgress size={20} /> : null}
                    >
                        Confirm Settlement
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProviderDetails;
