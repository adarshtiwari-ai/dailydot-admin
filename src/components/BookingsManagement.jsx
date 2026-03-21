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
} from "@mui/material";
import TextField from "@mui/material/TextField";
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
          materialCost: status === "completed" ? Math.round(Number(settlementMaterialCost) * 100) : undefined,
          adminCommission: status === "completed" ? Math.round(Number(settlementAdminCommission) * 100) : undefined
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
          cost: Math.round(Number(materialCost) * 100) // Scale to subunits
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
          cost: -Math.round(Number(customDiscountAmount) * 100) // Scale to subunits (Negative for discount)
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
                        <Autocomplete
                          fullWidth
                          freeSolo
                          options={availablePros}
                          getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                          value={proName}
                          onInputChange={(event, newInputValue) => {
                            setProName(newInputValue);
                          }}
                          onChange={(event, newValue) => {
                            if (newValue && typeof newValue === 'object') {
                              setProName(newValue.name);
                              setProPhone(newValue.phone || "");
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Professional Name"
                              size="small"
                              placeholder="Select or type new name"
                            />
                          )}
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

                {/* Financial Settlement Form - Only show when completing */}
                {status === "completed" && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: "#f0fff4", borderRadius: 1, border: "1px dashed #48bb78" }}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                      🏁 Final Financial Settlement
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mb: 2, color: "text.secondary" }}>
                      Input final costs and commission to calculate provider payout and net profit.
                    </Typography>
                    
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Material Cost (₹)"
                          size="small"
                          type="number"
                          value={settlementMaterialCost}
                          onChange={(e) => setSettlementMaterialCost(e.target.value)}
                          placeholder="e.g. 500"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Admin Commission (₹)"
                          size="small"
                          type="number"
                          value={settlementAdminCommission}
                          onChange={(e) => setSettlementAdminCommission(e.target.value)}
                          placeholder="e.g. 200"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 1, bgcolor: "white", borderRadius: 1, border: "1px solid #e2e8f0" }}>
                          <Typography variant="caption" color="textSecondary">Live Payout Preview</Typography>
                          <Typography variant="h6" color="primary.main">
                            ₹{formatCurrency(
                              (selectedBooking.finalTotal || selectedBooking.totalAmount || 0) - 
                              (Number(settlementMaterialCost) || 0) - 
                              (Number(settlementAdminCommission) || 0)
                            )}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #c6f6d5', display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2"><strong>Total Bill:</strong> ₹{formatCurrency(selectedBooking.finalTotal || selectedBooking.totalAmount)}</Typography>
                      <Typography variant="body2" color="success.main"><strong>Net Platform Profit:</strong> ₹{formatCurrency(Number(settlementAdminCommission) || 0)}</Typography>
                    </Box>
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

              {/* Native Itemized Billing Breakdown (Vercel-Safe) */}
              <Grid item xs={12}>
                <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '16px', color: '#1f2937', fontFamily: 'sans-serif' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: '#111827' }}>Customer Bill Breakdown</h3>
                  
                  {/* Services (Base Cost) */}
                  {selectedBooking.items && selectedBooking.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                      <span>{item.name || item.serviceId?.name || "Service Item"} (x{item.quantity || 1})</span>
                      <span>₹{formatCurrency((item.price || 0) * (item.quantity || 1))}</span>
                    </div>
                  ))}

                  {/* Dynamic Materials */}
                  {selectedBooking.materials && selectedBooking.materials.length > 0 && selectedBooking.materials.map((mat, idx) => (
                    <div key={`mat-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#d97706' }}>
                      <span>+ {mat.name}</span>
                      <span>₹{formatCurrency(mat.cost)}</span>
                    </div>
                  ))}

                  {/* Dynamic Fees */}
                  {selectedBooking.appliedFees && selectedBooking.appliedFees.length > 0 && selectedBooking.appliedFees.map((fee, idx) => (
                    <div key={`fee-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem', color: '#6b7280' }}>
                      <span>{fee.name}</span>
                      <span>₹{formatCurrency(fee.amount)}</span>
                    </div>
                  ))}

                  {/* Dynamic Discounts */}
                  {selectedBooking.appliedDiscounts && selectedBooking.appliedDiscounts.length > 0 && selectedBooking.appliedDiscounts.map((discount, idx) => (
                    <div key={`disc-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem', color: '#ef4444', fontWeight: 'bold' }}>
                      <span>{discount.name}</span>
                      <span>- ₹{formatCurrency(Math.abs(discount.amount))}</span>
                    </div>
                  ))}

                  {/* Dynamic Adjustments */}
                  {selectedBooking.adjustments && selectedBooking.adjustments.length > 0 && selectedBooking.adjustments.map((adj, idx) => (
                    <div key={`adj-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>
                      <span>Adjustment: {adj.reason}</span>
                      <span>{adj.amount > 0 ? "+" : ""} ₹{formatCurrency(adj.amount)}</span>
                    </div>
                  ))}

                  <hr style={{ margin: '12px 0', borderColor: '#d1d5db', border: '0', borderTop: '1px solid #d1d5db' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: '#111827' }}>
                    <span>Grand Total</span>
                    <span>₹{formatCurrency(selectedBooking.finalTotal || selectedBooking.totalAmount || selectedBooking.totalPrice)}</span>
                  </div>

                  {/* Admin P&L Ledger (Internal Only) */}
                  {selectedBooking.isSettled && (
                    <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '6px', marginTop: '16px', border: '1px solid #10b981' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#065f46', fontSize: '0.95rem' }}>Internal Admin Ledger</h4>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem', color: '#065f46' }}>
                        <span>Internal Material Cost</span>
                        <span>₹{formatCurrency(selectedBooking.materialCost || 0)}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem', color: '#065f46' }}>
                        <span style={{ fontWeight: '600' }}>Platform Profit</span>
                        <span>₹{formatCurrency(selectedBooking.netPlatformProfit || selectedBooking.adminCommission || 0)}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#065f46', borderTop: '1px dashed #10b981', paddingTop: '4px', marginTop: '4px' }}>
                        <span style={{ fontWeight: 'bold' }}>Provider Payout</span>
                        <span style={{ fontWeight: 'bold' }}>
                          ₹{formatCurrency(
                            (selectedBooking.finalTotal || selectedBooking.totalAmount || selectedBooking.totalPrice || 0) - 
                            (selectedBooking.materialCost || 0) - 
                            (selectedBooking.netPlatformProfit || selectedBooking.adminCommission || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Grid>
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
