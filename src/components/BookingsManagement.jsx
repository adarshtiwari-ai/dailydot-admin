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
  IconButton,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import DeleteIcon from "@mui/icons-material/Delete";
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

  // Draft State for Workspace (Non-Committal)
  const [draftMaterials, setDraftMaterials] = useState([]);
  const [draftDiscount, setDraftDiscount] = useState(0); // in paise
  const [draftBasePrice, setDraftBasePrice] = useState(""); // Editable Base in Rupees (as string)
  const [draftFinalTotal, setDraftFinalTotal] = useState(0); // Read-only from Server (in Paise)
  const [draftBreakdown, setDraftBreakdown] = useState({ platformFee: 0, taxAmount: 0, appliedFees: [] });
  const [initialDraftState, setInitialDraftState] = useState({ materials: [], quote: "" });
  const [isCalculating, setIsCalculating] = useState(false);

  // Settlement Specific States
  const [settlementMaterialCost, setSettlementMaterialCost] = useState("");
  const [settlementAdminCommission, setSettlementAdminCommission] = useState("");
  const [customTaxRate, setCustomTaxRate] = useState("18"); // Default 18%

  // Service Request States
  const [quotedTotal, setQuotedTotal] = useState("");
  const [adminQuoteNotes, setAdminQuoteNotes] = useState("");
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [bestCostTotal, setBestCostTotal] = useState(0); // Track taxable base

  // Payment recording states
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

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

    // --- Open Modal & Initialize Draft Workspace ---
    const handleOpenDialog = (booking) => {
        setSelectedBooking(booking);
        setStatus(booking.status);
        
        // Calculate the immutable bestCostTotal for taxing purposes
        const bct = (booking.items || []).reduce((sum, item) => {
            const bcp = item.serviceId?.bestCostPrice || item.serviceId?.price || item.price || 0;
            return sum + (bcp * (item.quantity || 1));
        }, 0);
        setBestCostTotal(bct);

        // Initialize UI Drafts
        const initialQuote = booking.totalAmount ? (booking.totalAmount / 100).toString() : "";
        setDraftMaterials([...(booking.materials || [])]);
        setDraftDiscount(0);
        setDraftBasePrice(initialQuote);
        setOpenDialog(true);
    };

  // --- Dynamic Pricing Hook (Server-Authoritative) ---
  useEffect(() => {
    if (openDialog && selectedBooking && draftBasePrice !== undefined) {
      const getCalculatedTotal = async () => {
        try {
          setIsCalculating(true);
          const response = await axiosInstance.post("/bookings/calculate", {
            baseCost: Math.round(Number(draftBasePrice) * 100),
            bestCostTotal: bestCostTotal, // Isolated taxing base
            items: selectedBooking.items || [],
            materials: draftMaterials,
            adjustments: draftDiscount > 0 ? [{ reason: "Adjustment", amount: -draftDiscount }] : []
          });
          if (response.data.success) {
            const { finalTotal, platformFee, convenienceFee, taxAmount } = response.data.receipt || response.data;
            setDraftFinalTotal(finalTotal);
            setDraftBreakdown({ platformFee, convenienceFee, taxAmount });
          }
        } catch (err) {
          console.error("Pricing calc failed:", err);
        } finally {
          setIsCalculating(false);
        }
      };

      const debounceTimer = setTimeout(getCalculatedTotal, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [draftBasePrice, draftMaterials, draftDiscount, openDialog]);

  const handleCloseDialog = () => {
    const hasMaterialsChanged = draftMaterials.length !== initialDraftState.materials.length;
    const hasQuoteChanged = draftBasePrice !== initialDraftState.quote;
    const hasDiscount = draftDiscount > 0;

    if (hasMaterialsChanged || hasQuoteChanged || hasDiscount) {
      if (!window.confirm("You have unsaved draft changes. These will be lost. Are you sure you want to close?")) {
        return;
      }
    }
    setOpenDialog(false);
    setSelectedBooking(null);
  };

  const handleUpdateStatus = async () => {
    if (selectedBooking && status) {
      console.log("Updating Status for:", selectedBooking._id || selectedBooking.id, "to", status);
      const isConfirmed = status.toLowerCase() === "confirmed";
      const isCompleted = status.toLowerCase() === "completed";

      // Validation for Confirm & Assign step
      if (isConfirmed && (!proName || !proPhone)) {
        alert("Please select or enter professional details to confirm.");
        return;
      }

      try {
        const response = await dispatch(updateBookingStatus({
          id: selectedBooking._id || selectedBooking.id,
          status: status.toLowerCase(),
          proName: isConfirmed ? proName : undefined,
          proPhone: isConfirmed ? proPhone : undefined,
          materialCost: isCompleted ? Math.round(Number(settlementMaterialCost) * 100) : undefined,
          adminCommission: isCompleted ? Math.round(Number(settlementAdminCommission) * 100) : undefined,
          taxAmount: isCompleted ? Math.round(Number(selectedBooking.baseCost || selectedBooking.totalAmount) * (Number(customTaxRate) / 100)) : undefined
        })).unwrap();
        
        // Update local state if successful to reflect changes in modal
        setSelectedBooking(response.booking || response);
        // We don't always want to close the dialog, but let's refresh list
        dispatch(fetchBookings());
        if (isCompleted || status === 'cancelled') handleCloseDialog();
      } catch (err) {
        console.error("Failed to update status:", err);
        const errorMessage = typeof err === 'object' ? (err.message || JSON.stringify(err)) : String(err);
        alert(`Failed to update status: ${errorMessage}`);
      }
    }
  };

  const handleAddMaterial = () => {
    if (materialName && materialCost) {
      const newMaterial = {
        name: materialName,
        cost: Math.round(Number(materialCost) * 100) // Keep in paise internally
      };
      setDraftMaterials([...draftMaterials, newMaterial]);
      setMaterialName("");
      setMaterialCost("");
    }
  };

  const handleRemoveMaterial = (index) => {
    const newList = [...draftMaterials];
    newList.splice(index, 1);
    setDraftMaterials(newList);
  };

  const handleApplyCustomDiscount = () => {
    if (customDiscountAmount) {
      const discountVal = Math.round(Number(customDiscountAmount) * 100);
      setDraftDiscount(discountVal);
      // We don't add to materials array here yet, we just stage the discount value
      // or we could add it as a negative material. Let's stick to the staged discount value
      // as requested in the plan.
    }
  };

  const handleSubmitMasterUpdate = async () => {
    if (!selectedBooking || !draftFinalTotal) return;
    setIsSubmittingQuote(true);
    try {
      const bookingId = selectedBooking._id || selectedBooking.id;

      // 1. Add NEW staged materials (Strict Halt on failure)
      const existingMaterialKeys = new Set((selectedBooking.materials || []).map(m => `${m.name}-${m.cost}`));
      const newMaterials = draftMaterials.filter(m => !existingMaterialKeys.has(`${m.name}-${m.cost}`));

      for (const mat of newMaterials) {
        await axiosInstance.post(`/admin/bookings/${bookingId}/materials`, mat);
      }

      // 2. Apply Staged Discount if any (as a negative material)
      if (draftDiscount > 0) {
        await axiosInstance.post(`/admin/bookings/${bookingId}/materials`, {
          name: customDiscountName || "Ad-Hoc Discount",
          cost: -draftDiscount
        });
      }

      // 3. Submit Final Quote (DICTATED BY SERVER CALCULATION)
      const response = await axiosInstance.post(`/admin/bookings/${bookingId}/submit-quote`, {
        totalAmount: draftFinalTotal,
        breakdown: {
          basePrice: Math.round(Number(draftBasePrice) * 100),
          tax: draftBreakdown.taxAmount,
          materials: draftMaterials.reduce((sum, mat) => sum + mat.cost, 0),
          platformFee: draftBreakdown.platformFee,
          convenienceFee: draftBreakdown.convenienceFee,
          total: draftFinalTotal
        },
        notes: adminQuoteNotes
      });

      if (response.data.success) {
        alert("Quote and materials saved successfully!");
        setInitialDraftState({ materials: draftMaterials, quote: draftBasePrice });
        setDraftDiscount(0);
        dispatch(fetchBookings());
        // Reload local booking data
        const updated = await axiosInstance.get(`/bookings/${bookingId}`);
        setSelectedBooking(updated.data.booking || updated.data.data);
      }
    } catch (err) {
      console.error("Master update failed:", err);
      alert("CRITICAL ERROR: Failed to save changes. The update process was halted to prevent data inconsistency. Please check your connection and try again.");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleForceApprove = async () => {
    if (!selectedBooking) return;
    const confirmApprove = window.confirm("Are you sure you want to manually approve this quote? This will bypass customer confirmation.");
    if (!confirmApprove) return;

    try {
      const response = await axiosInstance.post(`/bookings/${selectedBooking._id || selectedBooking.id}/approve-quote`);
      if (response.data.success) {
        alert("Booking Force Approved!");
        const updated = await axiosInstance.get(`/bookings/${selectedBooking._id || selectedBooking.id}`);
        setSelectedBooking(updated.data.booking || updated.data.data);
        dispatch(fetchBookings());
        // Reset pro assignment states
        setProName("");
        setProPhone("");
      }
    } catch (err) {
      alert(`Force Approval failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    if (!window.confirm("Are you sure you want to CANCEL this booking? This action is permanent.")) return;
    
    try {
      await dispatch(updateBookingStatus({
        id: selectedBooking._id || selectedBooking.id,
        status: "cancelled"
      })).unwrap();
      
      handleCloseDialog();
      dispatch(fetchBookings());
    } catch (err) {
      alert("Cancellation failed.");
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedBooking || !paymentAmount) return;
    setIsRecordingPayment(true);
    try {
      const response = await axiosInstance.post(`/bookings/${selectedBooking._id || selectedBooking.id}/record-payment`, {
        amount: Math.round(Number(paymentAmount) * 100),
        method: paymentMethod
      });
      if (response.data.success) {
        alert("Payment recorded!");
        setPaymentAmount("");
        dispatch(fetchBookings());
        // Refresh local view
        const updatedResponse = await axiosInstance.get(`/bookings/${selectedBooking._id || selectedBooking.id}`);
        setSelectedBooking(updatedResponse.data.booking);
      }
    } catch (err) {
      alert(`Payment recording failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Status color helper
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "pending_visit":
        return "warning";
      case "confirmed":
      case "quote_sent":
        return "info";
      case "approved":
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  // Payment status color helper
  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "failed":
      case "refunded":
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
                    <strong>Payment</strong>
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
                        {booking.bookingType === 'consultation' && (
                          <Chip
                            label="Consultation"
                            size="small"
                            color="info"
                            variant="outlined"
                            sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                          />
                        )}
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
                          label={booking.billingStatus || booking.status}
                          color={getStatusColor(booking.billingStatus || booking.status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={booking.paymentStatus || 'Pending'}
                          color={getPaymentStatusColor(booking.paymentStatus || 'pending')}
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
                          variant="contained"
                          color="primary"
                          onClick={() => handleOpenDialog(booking)}
                        >
                          Manage
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
                        {draftMaterials && draftMaterials.length > 0 ? (
                          draftMaterials.map((mat, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{mat.name}</TableCell>
                              <TableCell align="right">
                                ₹{formatCurrency(mat.cost)}
                                {(!selectedBooking.materials || !selectedBooking.materials.some(em => em.name === mat.name && em.cost === mat.cost)) && (
                                  <IconButton size="small" color="error" onClick={() => handleRemoveMaterial(idx)} sx={{ ml: 1 }}>
                                    <DeleteIcon fontSize="inherit" />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} align="center">No additional materials added.</TableCell>
                          </TableRow>
                        )}
                        {/* Dynamic Fees from Settings */}
                        {draftBreakdown.platformFee !== undefined && (
                          <TableRow>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>Platform Fee (from Settings)</TableCell>
                            <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                              ₹{formatCurrency(draftBreakdown.platformFee)}
                            </TableCell>
                          </TableRow>
                        )}
                        {draftBreakdown.convenienceFee !== undefined && (
                          <TableRow>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>Convenience Fee (from Settings)</TableCell>
                            <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                              ₹{formatCurrency(draftBreakdown.convenienceFee)}
                            </TableCell>
                          </TableRow>
                        )}
                        {draftBreakdown.taxAmount !== undefined && (
                          <TableRow>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>GST (18% on Service Base)</TableCell>
                            <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                              ₹{formatCurrency(draftBreakdown.taxAmount)}
                            </TableCell>
                          </TableRow>
                        )}
                        {/* Draft Preview Row (Subtotal of Staged changes) */}
                        {(draftMaterials.length > 0 || draftDiscount > 0) && (
                          <TableRow sx={{ bgcolor: '#fff7ed' }}>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Staged Change Sum</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              ₹{formatCurrency(draftMaterials.reduce((s, m) => s + m.cost, 0) - draftDiscount)}
                            </TableCell>
                          </TableRow>
                        )}
                        {/* Final Authoritative Total */}
                        <TableRow sx={{ bgcolor: '#f0fdf4' }}>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>Calculated Grand Total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '1.1rem' }}>
                            ₹{formatCurrency(draftFinalTotal)}
                          </TableCell>
                        </TableRow>
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

              {/* Financial & Payment Summary */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Financial Summary</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">Payment Status</Typography>
                      <Chip
                        label={selectedBooking.paymentStatus || 'Pending'}
                        color={getPaymentStatusColor(selectedBooking.paymentStatus || 'pending')}
                        size="small"
                        sx={{ mt: 0.5, textTransform: 'capitalize' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">Payment Method</Typography>
                      <Typography sx={{ textTransform: 'uppercase', fontWeight: 'bold', mt: 0.5 }}>
                        {selectedBooking.paymentMethod || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="textSecondary">Razorpay Order ID</Typography>
                      <Typography sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        mt: 0.5,
                        bgcolor: '#f1f5f9',
                        p: 0.5,
                        borderRadius: 0.5,
                        border: '1px solid #e2e8f0'
                      }}>
                        {selectedBooking.paymentOrderId || 'Not Available'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Consultation Notes */}
              {selectedBooking.notes && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>Customer Query / Notes</Typography>
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#e3f2fd' }}>
                    <Typography style={{ whiteSpace: 'pre-line' }}>{selectedBooking.notes}</Typography>
                  </Paper>
                </Grid>
              )}

              {/* Service Location & Contact */}
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

              {/* Unified Workflow Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">Manage Booking Workflow</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderLeft: '5px solid #1976d2' }}>
                  
                  {/* Phase 1: Quoting (New Request) */}
                  {selectedBooking.billingStatus === 'pending_visit' && (
                    <Box>
                      <Typography variant="subtitle2" color="primary" gutterBottom>Phase 1: Assessing & Quoting (DRAFT MODE)</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Staging Area: Add materials and calculate the final quote. Changes are only push to the customer once "Save & Send" is clicked.
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={6}>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f0fdf4' }}>
                            <Typography variant="caption" color="textSecondary">Final Grand Total (Read-Only)</Typography>
                            <Typography variant="h5" color="success.main">
                              ₹{formatCurrency(draftFinalTotal)}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#eff6ff' }}>
                            <Typography variant="caption" color="textSecondary">Base Cost Reference</Typography>
                            <Typography variant="h5">
                              ₹{formatCurrency(selectedBooking.baseCost || selectedBooking.totalAmount)}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth label="Adjusted Base Price (₹)" size="small" type="number"
                            value={draftBasePrice} onChange={(e) => setDraftBasePrice(e.target.value)}
                            helperText="Adjust the core service price before fees."
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth label="Calculated Quote (Read-Only)" size="small"
                            value={formatCurrency(draftFinalTotal)}
                            disabled
                            InputProps={{ readOnly: true }}
                            helperText="Calculated by server (Includes GST & Fees)"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth label="Optional Notes" size="small"
                            value={adminQuoteNotes} onChange={(e) => setAdminQuoteNotes(e.target.value)}
                          />
                        </Grid>
                      </Grid>
                      <Button
                        variant="contained" fullWidth sx={{ mt: 2, py: 1.5, fontWeight: 'bold' }}
                        color="success"
                        onClick={handleSubmitMasterUpdate} 
                        disabled={!draftFinalTotal || isSubmittingQuote || isCalculating}
                      >
                        {isSubmittingQuote ? "Saving & Notifying..." : isCalculating ? "Calculating Fees..." : "Save Draft & Send Update to Customer"}
                      </Button>
                    </Box>
                  )}

                  {/* Phase 2: Customer Approval (Waiting for response) */}
                  {selectedBooking.billingStatus === 'quote_sent' && (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="subtitle2" color="warning.main">Phase 2: Awaiting Customer Approval</Typography>
                      <Typography variant="body2" sx={{ mt: 1, mb: 3 }}>
                        The quote has been sent. The customer must approve it on their mobile app.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="warning" 
                        onClick={handleForceApprove}
                        startIcon={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'warning.main' }} />}
                      >
                        Admin Override: Force Approve Quote
                      </Button>
                    </Box>
                  )}

                  {/* Phase 3: Selection & Execution (Confirmed/Approved) */}
                  {(selectedBooking.billingStatus === 'approved' || selectedBooking.status?.toLowerCase() === 'confirmed') && selectedBooking.status?.toLowerCase() !== 'completed' && selectedBooking.status?.toLowerCase() !== 'cancelled' && (
                    <Box>
                      <Typography variant="subtitle2" color="success.main" gutterBottom>
                        Phase 3: Service Execution
                      </Typography>

                      {/* Sub-step: Assignment */}
                      {!selectedBooking.assignedPro?._id ? (
                        <Box sx={{ p: 2, bgcolor: "#f0f7ff", borderRadius: 1, border: "1px dashed #2196f3", mb: 2 }}>
                          <Typography variant="caption" display="block" sx={{ mb: 1, fontWeight: 'bold' }}>
                            Step 1: Confirm & Assign Professional
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Autocomplete
                                fullWidth freeSolo size="small" options={availablePros}
                                getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                                onInputChange={(e, val) => setProName(val)}
                                onChange={(e, val) => {
                                  if (val && typeof val === 'object') {
                                    setProName(val.name);
                                    setProPhone(val.phone || "");
                                  }
                                }}
                                renderInput={(params) => <TextField {...params} label="Professional Name" />}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth label="Phone" size="small" value={proPhone}
                                onChange={(e) => setProPhone(e.target.value)}
                              />
                            </Grid>
                          </Grid>
                          <Button 
                            variant="contained" fullWidth sx={{ mt: 2 }}
                            onClick={() => { setStatus("confirmed"); setTimeout(() => handleUpdateStatus(), 0); }}
                            disabled={!proName || !proPhone}
                          >
                            Confirm & Assign Pro
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                           <Typography variant="caption" display="block" sx={{ mb: 2, color: 'text.secondary' }}>
                            Professional {selectedBooking.assignedPro.name} is assigned. Move to next logic step:
                          </Typography>
                          <Grid container spacing={2}>
                            {selectedBooking.status?.toLowerCase() === 'confirmed' || selectedBooking.status?.toLowerCase() === 'assigned' ? (
                              <Grid item xs={12}>
                                <Button 
                                  variant="contained" fullWidth color="info"
                                  onClick={() => { setStatus("on_the_way"); setTimeout(() => handleUpdateStatus(), 0); }}
                                >
                                  Mark as 'On The Way'
                                </Button>
                              </Grid>
                            ) : null}

                            {selectedBooking.status?.toLowerCase() === 'on_the_way' ? (
                              <Grid item xs={12}>
                                <Button 
                                  variant="contained" fullWidth color="warning"
                                  onClick={() => { setStatus("in_progress"); setTimeout(() => handleUpdateStatus(), 0); }}
                                >
                                  Mark as 'In Progress' (Start Work)
                                </Button>
                              </Grid>
                            ) : null}
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Phase 4: Finalization (Completion) */}
                  {selectedBooking.status?.toLowerCase() === 'in_progress' && (
                    <Box>
                      <Typography variant="subtitle2" color="success.main" gutterBottom>Phase 4: Completion & Settlement</Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white', mb: 2 }}>
                        <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>Enter final cost details to settle with provider.</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth label="Final Material Cost (₹)" size="small" type="number"
                              value={settlementMaterialCost} onChange={(e) => setSettlementMaterialCost(e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth label="Admin Commission (₹)" size="small" type="number"
                              value={settlementAdminCommission} onChange={(e) => setSettlementAdminCommission(e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth label="GST Rate (%)" size="small" type="number"
                              value={customTaxRate} onChange={(e) => setCustomTaxRate(e.target.value)}
                            />
                          </Grid>
                        </Grid>
                        <Button 
                          variant="contained" color="success" fullWidth sx={{ mt: 2 }}
                          onClick={() => { setStatus("completed"); setTimeout(() => handleUpdateStatus(), 0); }}
                        >
                          Complete Job & Generate Invoice
                        </Button>
                      </Paper>
                    </Box>
                  )}

                  {/* Terminal State Display */}
                  {(selectedBooking.status?.toLowerCase() === 'completed' || selectedBooking.status?.toLowerCase() === 'cancelled') && (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Alert severity={selectedBooking.status?.toLowerCase() === 'completed' ? "success" : "error"}>
                        This booking is <strong>{selectedBooking.status?.toUpperCase()}</strong>. No further status changes allowed.
                      </Alert>
                    </Box>
                  )}

                </Paper>
              </Grid>

              {/* Status Update (Legacy - Removed as per requirements but keeping handle fallback) */}
              
              <Grid item xs={12}>
                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="textSecondary">Dangerous Actions:</Typography>
                  <Button 
                    variant="text" 
                    color="error" 
                    size="small" 
                    onClick={handleCancelBooking}
                    disabled={selectedBooking.status?.toLowerCase() === 'completed' || selectedBooking.status?.toLowerCase() === 'cancelled'}
                  >
                    Cancel Entire Booking
                  </Button>
                </Box>
              </Grid>

              {/* Financial Settlement Form - Only show when completing */}
              {status === "completed" && (
                <Grid item xs={12}>
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
                        <TextField
                          fullWidth
                          label="Tax Rate (%)"
                          size="small"
                          type="number"
                          value={customTaxRate}
                          onChange={(e) => setCustomTaxRate(e.target.value)}
                          placeholder="e.g. 18"
                        />
                      </Grid>
                      <Grid item xs={12} md={12}>
                        <Box sx={{ p: 1, mt: 1, bgcolor: "white", borderRadius: 1, border: "1px solid #e2e8f0", display: 'flex', justifyContent: 'space-around' }}>
                          <Box>
                            <Typography variant="caption" color="textSecondary">Live Tax (Auto)</Typography>
                            <Typography variant="subtitle1" fontWeight="bold">
                              ₹{formatCurrency(Math.round(Number(selectedBooking.baseCost || selectedBooking.totalAmount) * (Number(customTaxRate) / 100)))}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="textSecondary">Live Payout Preview</Typography>
                            <Typography variant="h6" color="primary.main">
                              ₹{formatCurrency(
                                (Number(selectedBooking.baseCost || 0)) +
                                (Math.round(Number(selectedBooking.baseCost) * (Number(customTaxRate) / 100))) +
                                (Number(selectedBooking.totalDynamicFees) || 0) -
                                (Math.round(Number(settlementAdminCommission) * 100) || 0)
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #c6f6d5', display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2"><strong>Total Bill:</strong> ₹{formatCurrency(selectedBooking.finalTotal || selectedBooking.totalAmount)}</Typography>
                      <Typography variant="body2" color="success.main"><strong>Net Platform Profit:</strong> ₹{formatCurrency(Number(settlementAdminCommission) || 0)}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

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
