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
} from "@mui/material";
import TextField from "@mui/material/TextField";
import BookingAdjustmentModal from "./BookingAdjustmentModal";
import { formatCurrency } from "../utils/currency";

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
  const [materialName, setMaterialName] = useState("");
  const [materialCost, setMaterialCost] = useState("");
  const [customDiscountName, setCustomDiscountName] = useState("");
  const [customDiscountAmount, setCustomDiscountAmount] = useState("");

  // Fetch bookings when component loads
  useEffect(() => {
    dispatch(fetchBookings());
  }, [dispatch]);

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
          proPhone: status === "confirmed" ? proPhone : undefined
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
          key={selectedBooking._id || selectedBooking.id} // Force re-render for new booking
        >
          <DialogTitle>
            Booking Details
            <Typography variant="subtitle2" color="textSecondary">
              ID: {selectedBooking._id || selectedBooking.id}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              {/* Service Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Service Items</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell><strong>Item Name</strong></TableCell>
                        <TableCell><strong>Category</strong></TableCell>
                        <TableCell align="right"><strong>Price</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedBooking.items && selectedBooking.items.length > 0 ? (
                        selectedBooking.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.category || "N/A"}</TableCell>
                            <TableCell align="right">₹{formatCurrency(item.price)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell>{selectedBooking.service?.name || selectedBooking.serviceName || "N/A"}</TableCell>
                          <TableCell>N/A</TableCell>
                          <TableCell align="right">₹{formatCurrency(selectedBooking.totalAmount || selectedBooking.amount)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell colSpan={2} align="right"><strong>Base Cost</strong></TableCell>
                        <TableCell align="right"><strong>₹{formatCurrency(selectedBooking.baseCost || selectedBooking.totalAmount || selectedBooking.amount)}</strong></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Additional Materials */}
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Additional Materials</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#fff3e0" }}>
                          <TableCell><strong>Material / Equipment</strong></TableCell>
                          <TableCell align="right"><strong>Cost</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedBooking.materials && selectedBooking.materials.length > 0 ? (
                          selectedBooking.materials.map((mat, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{mat.name}</TableCell>
                              <TableCell align="right">₹{formatCurrency(mat.cost)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} align="center">No additional materials added.</TableCell>
                          </TableRow>
                        )}
                        {selectedBooking.materials && selectedBooking.materials.length > 0 && (
                          <TableRow>
                            <TableCell align="right"><strong>Final Total</strong></TableCell>
                            <TableCell align="right"><strong>₹{formatCurrency(selectedBooking.finalTotal)}</strong></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Add Material Form */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      label="Item Name"
                      size="small"
                      value={materialName}
                      onChange={(e) => setMaterialName(e.target.value)}
                      sx={{ flexGrow: 1 }}
                    />
                    <TextField
                      label="Cost (₹)"
                      size="small"
                      type="number"
                      value={materialCost}
                      onChange={(e) => setMaterialCost(e.target.value)}
                      sx={{ width: 120 }}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleAddMaterial}
                      disabled={!materialName || !materialCost || loading.updating}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>

                {/* Ad-Hoc Discount Section */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 3, p: 2, bgcolor: '#fef2f2', borderRadius: 1, border: '1px dashed #ef4444' }}>
                  <Typography variant="subtitle2" color="error.main" sx={{ minWidth: 120 }}>
                    Apply Ad-Hoc Discount:
                  </Typography>
                  <TextField 
                    size="small" 
                    label="Reason (e.g., Apology)" 
                    sx={{ flexGrow: 1 }}
                    value={customDiscountName} 
                    onChange={(e) => setCustomDiscountName(e.target.value)}
                  />
                  <TextField 
                    size="small" 
                    type="number" 
                    label="Amount (₹)" 
                    sx={{ width: 120 }}
                    value={customDiscountAmount} 
                    onChange={(e) => setCustomDiscountAmount(e.target.value)}
                  />
                  <Button 
                    variant="contained" 
                    color="error" 
                    onClick={handleApplyCustomDiscount}
                    disabled={!customDiscountName || !customDiscountAmount || loading.updating}
                  >
                    Apply
                  </Button>
                </Box>
              </Grid>

              {/* Booking & Customer Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Customer Details</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography><strong>Account Name:</strong> {selectedBooking.userId?.name || selectedBooking.name || "Guest"}</Typography>
                  <Typography><strong>Account Phone:</strong> {selectedBooking.userId?.phone || selectedBooking.phone || "N/A"}</Typography>
                  <Typography><strong>Email:</strong> {selectedBooking.userId?.email || "N/A"}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Booking Details</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography><strong>Booking ID:</strong> {selectedBooking._id || selectedBooking.id}</Typography>
                  <Typography><strong>Booked On:</strong> {new Date(selectedBooking.createdAt).toLocaleString()}</Typography>
                  <Typography><strong>Scheduled:</strong> {new Date(selectedBooking.scheduledDate).toLocaleDateString()} {selectedBooking.scheduledTime}</Typography>

                  {selectedBooking.assignedPro && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                      <Typography variant="subtitle2" color="primary">Assigned Professional</Typography>
                      <Typography><strong>Name:</strong> {selectedBooking.assignedPro.name}</Typography>
                      <Typography><strong>Phone:</strong> {selectedBooking.assignedPro.phone}</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Address & Receiver Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Service Location & Contact</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="textSecondary">Address</Typography>
                      <Typography>{selectedBooking.serviceAddress?.addressLine1 || selectedBooking.address || "N/A"}</Typography>
                      <Typography>
                        {selectedBooking.serviceAddress?.city || ""}, {selectedBooking.serviceAddress?.state || ""} - {selectedBooking.serviceAddress?.pincode || ""}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="textSecondary">Receiver / On-Site Contact</Typography>
                      <Typography><strong>Name:</strong> {selectedBooking.serviceAddress?.receiverName || "Same as Customer"}</Typography>
                      <Typography><strong>Phone:</strong> {selectedBooking.serviceAddress?.receiverPhone || "Same as Customer"}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Status Update */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Update Status</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    label="Status"
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>

                {/* Professional Assignment Inputs - Only show when confirming */}
                {status === "confirmed" && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: "#f0f7ff", borderRadius: 1, border: "1px dashed #2196f3" }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Assign Professional (Optional)
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mb: 2, color: "text.secondary" }}>
                      Enter details to auto-assign/create a professional account.
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Professional Name"
                          size="small"
                          value={proName}
                          onChange={(e) => setProName(e.target.value)}
                          placeholder="e.g. John Doe"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Professional Phone"
                          size="small"
                          value={proPhone}
                          onChange={(e) => setProPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Grid>

              {/* Dynamic Billing Ledger Adjustments */}
              {status === "completed" || status === "confirmed" ? (
                <Grid item xs={12}>
                  <BookingAdjustmentModal
                    bookingId={selectedBooking._id || selectedBooking.id}
                    onSuccess={() => {
                      dispatch(fetchBookings());
                      handleCloseDialog();
                    }}
                  />
                </Grid>
              ) : null}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
            <Button variant="contained" onClick={handleUpdateStatus} color="primary">
              Update Status
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default BookingsManagement;
