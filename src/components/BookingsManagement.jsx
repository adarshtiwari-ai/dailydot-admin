// src/components/BookingsManagement.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Autocomplete,
  Divider,
  TextField,
} from "@mui/material";
import BookingAdjustmentModal from "./BookingAdjustmentModal";
import { formatCurrency } from "../utils/currency";
import axiosInstance from "../services/api.service";

// Import the Redux actions we just created
import {
  fetchBookings,
  updateBookingStatus,
  addBookingMaterial,
  selectBookings,
  selectBookingsLoading,
  selectBookingsError,
} from "../store/slices/bookingsSlice";

const BookingsManagement = () => {
  const dispatch = useDispatch();
  const bookings = useSelector(selectBookings);
  const loading = useSelector(selectBookingsLoading);
  const error = useSelector(selectBookingsError);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [status, setStatus] = useState("");
  const [proName, setProName] = useState("");
  const [proPhone, setProPhone] = useState("");
  const [availablePros, setAvailablePros] = useState([]);
  const [fetchingPros, setFetchingPros] = useState(false);
  const [materialName, setMaterialName] = useState("");
  const [materialCost, setMaterialCost] = useState("");
  const [customDiscountName, setCustomDiscountName] = useState("");
  const [customDiscountAmount, setCustomDiscountAmount] = useState("");
  
  // Settlement Specific States
  const [settlementMaterialCost, setSettlementMaterialCost] = useState("");
  const [settlementAdminCommission, setSettlementAdminCommission] = useState("");

  // Fetch bookings when component loads
  useEffect(() => {
    dispatch(fetchBookings());
    fetchAvailablePros();
  }, [dispatch]);

  const fetchAvailablePros = async () => {
    try {
      setFetchingPros(true);
      const response = await axiosInstance.get("/professionals");
      if (response.data.success) {
        setAvailablePros(response.data.professionals || []);
      }
    } catch (err) {
      console.error("Failed to fetch professionals:", err);
    } finally {
      setFetchingPros(false);
    }
  };

  const handleOpenDialog = (booking) => {
    console.log("Opening Dialog for:", booking._id || booking.id);
    setSelectedBooking(booking);
    setStatus(booking.status);
    setProName("");
    setProPhone("");
    setMaterialName("");
    setMaterialCost("");
    setCustomDiscountName("");
    setCustomDiscountAmount("");
    setSettlementMaterialCost("");
    setSettlementAdminCommission("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBooking(null);
  };

  const handleUpdateStatus = async () => {
    if (selectedBooking && status) {
      console.log("Updating Status for:", selectedBooking._id || selectedBooking.id, "to", status);
      try {
        await dispatch(updateBookingStatus({
          id: selectedBooking._id || selectedBooking.id,
          status: status.toLowerCase(),
          proName: status === "confirmed" ? proName : undefined,
          proPhone: status === "confirmed" ? proPhone : undefined,
          materialCost: status === "completed" ? Number(settlementMaterialCost) : undefined,
          adminCommission: status === "completed" ? Number(settlementAdminCommission) : undefined
        })).unwrap();
        handleCloseDialog();
      } catch (err) {
        console.error("Failed to update status:", err);
        // Extract useful error message
        const errorMessage = typeof err === 'object' ? (err.message || JSON.stringify(err)) : String(err);
        alert(`Failed to update status: ${errorMessage}`);
      }
    }
  };

  const handleAddMaterial = async () => {
    if (selectedBooking && materialName && materialCost) {
      console.log("Adding Material for:", selectedBooking._id || selectedBooking.id, materialName, materialCost);
      try {
        const updatedBooking = await dispatch(addBookingMaterial({
          id: selectedBooking._id || selectedBooking.id,
          name: materialName,
          cost: Number(materialCost)
        })).unwrap();
        // Update local selectedBooking state without closing the dialog
        setSelectedBooking(updatedBooking);
        setMaterialName("");
        setMaterialCost("");
        dispatch(fetchBookings());
      } catch (err) {
        console.error("Failed to add material:", err);
        const errorMessage = typeof err === 'object' ? (err.message || JSON.stringify(err)) : String(err);
        alert(`Failed to add material: ${errorMessage}`);
      }
    }
  };

  const handleApplyCustomDiscount = async () => {
    if (selectedBooking && customDiscountName && customDiscountAmount) {
      console.log("Applying Custom Discount for:", selectedBooking._id || selectedBooking.id, customDiscountName, customDiscountAmount);
      try {
        await dispatch(addBookingMaterial({
          id: selectedBooking._id || selectedBooking.id,
          name: `Discount: ${customDiscountName}`,
          cost: -Number(customDiscountAmount)
        })).unwrap();
        
        setCustomDiscountName("");
        setCustomDiscountAmount("");
        dispatch(fetchBookings());
        const updated = bookings.find(b => (b._id || b.id) === (selectedBooking._id || selectedBooking.id));
        if (updated) setSelectedBooking(updated);
      } catch (err) {
        console.error("Failed to apply discount:", err);
        alert(`Failed to apply discount: ${err.message || 'Unknown error'}`);
      }
    }
  };

  // Status color helper
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "warning";
      case "confirmed":
        return "info";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  // Show loading spinner
  if (loading.bookings) {
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

  // Show error if any
  if (error.bookings) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading bookings: {error.bookings}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Bookings Management
      </Typography>

      <Card>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            All Bookings ({bookings.length})
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell>
                    <strong>Booking ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Service</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Customer</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Date</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Amount</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking._id || booking.id}>
                      <TableCell>{(booking._id || booking.id).substring(0, 8)}...</TableCell>
                      <TableCell>
                        {booking.items && booking.items.length > 0
                          ? booking.items.map((i) => i.name).join(", ")
                          : booking.service?.name || booking.serviceName || "N/A"}
                      </TableCell>
                      <TableCell>
                        {booking.userId?.name || booking.name || "Guest"}
                      </TableCell>
                      <TableCell>
                        {booking.scheduledDate
                          ? new Date(booking.scheduledDate).toLocaleDateString() + " " + (booking.scheduledTime || "")
                          : new Date(booking.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={getStatusColor(booking.status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        ₹{formatCurrency(booking.totalAmount || booking.amount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenDialog(booking)}
                        >
                          View & Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Card>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          key={selectedBooking._id || selectedBooking.id}
        >
          <DialogTitle>
            Booking Details
            <Typography variant="subtitle2" color="textSecondary">
              ID: {selectedBooking._id || selectedBooking.id}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              {/* LEFT COLUMN: Operations & Basic Info */}
              <Grid item xs={12} md={7}>
                <Grid container spacing={2}>
                  {/* Service Details Table */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Service Items (Operations)</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                            <TableCell><strong>Item Name</strong></TableCell>
                            <TableCell align="right"><strong>Price</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedBooking.items && selectedBooking.items.length > 0 ? (
                            selectedBooking.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.name || item.serviceId?.name || "N/A"} (x{item.quantity || 1})</TableCell>
                                <TableCell align="right">₹{formatCurrency(item.price || item.serviceId?.price || 0)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell>{selectedBooking.service?.name || selectedBooking.serviceName || "N/A"}</TableCell>
                              <TableCell align="right">₹{formatCurrency(selectedBooking.totalAmount || selectedBooking.amount)}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  {/* Customer & Location Info */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 'bold' }}>Customer Details</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2"><strong>Name:</strong> {selectedBooking.userId?.name || selectedBooking.name || "Guest"}</Typography>
                      <Typography variant="body2"><strong>Phone:</strong> {selectedBooking.userId?.phone || selectedBooking.phone || "N/A"}</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 'bold' }}>Location</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2">{selectedBooking.serviceAddress?.addressLine1 || selectedBooking.address || "N/A"}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {selectedBooking.serviceAddress?.city || ""}, {selectedBooking.serviceAddress?.pincode || ""}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Update Status Form */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Management</Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Update Status</InputLabel>
                      <Select
                        value={status}
                        label="Update Status"
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="confirmed">Confirmed</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>

                    {status === "confirmed" && (
                      <Box sx={{ p: 2, bgcolor: "#f0f9ff", borderRadius: 1, border: "1px dashed #0ea5e9" }}>
                         <Typography variant="caption" display="block" sx={{ mb: 1 }}>Assign professional details:</Typography>
                         <TextField fullWidth label="Pro Name" size="small" value={proName} onChange={(e) => setProName(e.target.value)} sx={{ mb: 1.5 }} />
                         <TextField fullWidth label="Pro Phone" size="small" value={proPhone} onChange={(e) => setProPhone(e.target.value)} />
                      </Box>
                    )}

                    {status === "completed" && (
                      <Box sx={{ p: 2, bgcolor: "#f0fdf4", borderRadius: 1, border: "1px dashed #22c55e" }}>
                         <Typography variant="caption" display="block" sx={{ mb: 1 }}>Final settlement costs:</Typography>
                         <Grid container spacing={2}>
                            <Grid item xs={6}><TextField fullWidth label="Material Cost" size="small" type="number" value={settlementMaterialCost} onChange={(e) => setSettlementMaterialCost(e.target.value)} /></Grid>
                            <Grid item xs={6}><TextField fullWidth label="Commission" size="small" type="number" value={settlementAdminCommission} onChange={(e) => setSettlementAdminCommission(e.target.value)} /></Grid>
                         </Grid>
                      </Box>
                    )}
                  </Grid>

                  {/* Operational Controls (Add Material / Adjust Price) */}
                  <Grid item xs={12}>
                     <BookingAdjustmentModal
                        bookingId={selectedBooking._id || selectedBooking.id}
                        onSuccess={() => {
                          dispatch(fetchBookings());
                          handleCloseDialog();
                        }}
                      />
                  </Grid>
                </Grid>
              </Grid>

              {/* RIGHT COLUMN: Billing Breakdown & Internal P&L */}
              <Grid item xs={12} md={5}>
                <Paper sx={{ p: 2, bgcolor: '#f8fafc', height: '100%', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🧾 Customer Receipt
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    {selectedBooking.items?.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{item.name || item.serviceId?.name} (x{item.quantity || 1})</Typography>
                        <Typography variant="body2">₹{formatCurrency((item.price || item.serviceId?.price || 0) * (item.quantity || 1))}</Typography>
                      </Box>
                    ))}
                    
                    {(selectedBooking.materialCost || 0) > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Material Charges</Typography>
                        <Typography variant="body2">₹{formatCurrency(selectedBooking.materialCost)}</Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
                    
                    {/* Taxes and Fees */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="textSecondary">Platform Fee</Typography>
                      <Typography variant="caption" color="textSecondary">₹{formatCurrency(selectedBooking.taxDetails?.platformFee || 0)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="textSecondary">CGST (9%)</Typography>
                      <Typography variant="caption" color="textSecondary">₹{formatCurrency(selectedBooking.taxDetails?.cgst || 0)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="textSecondary">SGST (9%)</Typography>
                      <Typography variant="caption" color="textSecondary">₹{formatCurrency(selectedBooking.taxDetails?.sgst || 0)}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 1, borderTop: '2px solid #cbd5e1' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total Payable</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                        ₹{formatCurrency(selectedBooking.totalAmount || selectedBooking.finalTotal)}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={selectedBooking.paymentMethod?.toUpperCase() || "PAYMENT PENDING"} 
                        size="small" 
                        color={selectedBooking.paymentMethod === 'cod' ? 'warning' : 'info'} 
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  {/* Admin P&L Section (The Wall) */}
                  {selectedBooking.isSettled && (
                    <Box sx={{ mt: 4, p: 2, bgcolor: '#ecfdf5', borderRadius: 2, border: '1px solid #10b981' }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: '#065f46', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                        🛡️ Internal Admin P&L
                      </Typography>
                      <Divider sx={{ mb: 1.5, opacity: 0.3 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption">Net Platform Profit</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#065f46' }}>
                          ₹{formatCurrency(selectedBooking.netPlatformProfit || selectedBooking.adminCommission)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption">Provider Payout</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#047857' }}>
                          ₹{formatCurrency((selectedBooking.totalAmount || selectedBooking.finalTotal) - (selectedBooking.materialCost || 0) - (selectedBooking.adminCommission || 0))}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} color="inherit">Close</Button>
            <Button variant="contained" onClick={handleUpdateStatus} color="primary" disabled={loading.updating}>
              Save & Update Status
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default BookingsManagement;
