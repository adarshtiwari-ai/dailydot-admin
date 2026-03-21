    Box, Typography, Card, CardContent, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Button, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import { Link } from 'react-router-dom';
import axiosInstance from '../services/api.service';
import { toast } from 'react-toastify';

const ProviderLedger = () => {
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Settlement Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [settling, setSettling] = useState(false);

    const fetchWallets = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/admin/providers/wallets');
            if (res.data.success) {
                setWallets(res.data.wallets);
            }
        } catch (error) {
            console.error('Failed to fetch provider wallets:', error);
            toast.error('Failed to load ledger data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallets();
    }, []);

    const handleOpenSettle = (wallet) => {
        setSelectedWallet(wallet);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedWallet(null);
    };

    const handleSettleDues = async () => {
        if (!selectedWallet || selectedWallet.balance >= 0) return;

        // The debt amount is the absolute value of the negative balance
        const debtPaise = Math.abs(selectedWallet.balance);

        try {
            setSettling(true);
            const res = await axiosInstance.post(`/admin/providers/${selectedWallet.providerId._id}/settle`, {
                amount: debtPaise
            });

            if (res.data.success) {
                toast.success(`Successfully settled dues for ${selectedWallet.providerId.name}`);
                handleCloseDialog();
                fetchWallets(); // Refresh table
            }
        } catch (error) {
            console.error('Error settling dues:', error);
            toast.error(error.response?.data?.message || 'Failed to settle dues');
        } finally {
            setSettling(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>Provider Ledger</Typography>

            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Provider Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Phone / Email</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Wallet Balance</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {wallets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1" color="textSecondary">
                                                No provider wallets found.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    wallets.map((wallet) => {
                                        const balanceRupees = wallet.balance / 100;
                                        const isDebt = wallet.balance < 0;
                                        const isPayout = wallet.balance > 0;

                                        return (
                                            <TableRow key={wallet._id} hover>
                                                <TableCell sx={{ fontWeight: 'medium' }}>
                                                    <Link 
                                                        to={`/providers/${wallet.providerId?._id}`}
                                                        style={{ 
                                                            textDecoration: 'none', 
                                                            color: '#667eea',
                                                            fontWeight: 'bold',
                                                            '&:hover': { textDecoration: 'underline' }
                                                        }}
                                                    >
                                                        {wallet.providerId?.name || 'Unknown Provider'}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    {wallet.providerId?.phone || 'N/A'}<br />
                                                    <Typography variant="caption" color="textSecondary">
                                                        {wallet.providerId?.email}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: isDebt ? '#d32f2f' : isPayout ? '#0288d1' : '#2e7d32' }}>
                                                    {isDebt ? `-₹${Math.abs(balanceRupees).toFixed(2)}` : `₹${balanceRupees.toFixed(2)}`}
                                                </TableCell>
                                                <TableCell>
                                                    {isDebt ? (
                                                        <Chip label="Owes Commission" color="error" size="small" />
                                                    ) : isPayout ? (
                                                        <Chip label="Owed Payout" color="info" size="small" />
                                                    ) : (
                                                        <Chip label="Settled / Clear" color="success" size="small" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="small"
                                                        disabled={!isDebt}
                                                        onClick={() => handleOpenSettle(wallet)}
                                                    >
                                                        Settle Dues
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Settlement Confirmation Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Cash Settlement</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Has the provider <strong>{selectedWallet?.providerId?.name}</strong> fully paid their outstanding commission dues of <strong>₹{selectedWallet ? (Math.abs(selectedWallet.balance) / 100).toFixed(2) : '0.00'}</strong>?
                        <br /><br />
                        This action will log a MANUAL_SETTLEMENT transaction and clear their negative balance.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={settling}>Cancel</Button>
                    <Button
                        onClick={handleSettleDues}
                        color="primary"
                        variant="contained"
                        disabled={settling}
                        startIcon={settling ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {settling ? 'Settling...' : 'Confirm Paid'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProviderLedger;
