// src/components/PaymentsManagement.jsx
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
  Grid,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Payment as PaymentIcon,
  Undo as RefundIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";

// Import the Redux actions we just created
import {
  fetchPayments,
  processRefund,
  selectPayments,
  selectPaymentsLoading,
  selectPaymentsError,
  selectPaymentsStats,
} from "../store/slices/paymentsSlice";

const PaymentsManagement = () => {
  const dispatch = useDispatch();
  const payments = useSelector(selectPayments);
  const loading = useSelector(selectPaymentsLoading);
  const error = useSelector(selectPaymentsError);
  const stats = useSelector(selectPaymentsStats);

  const [searchTerm, setSearchTerm] = useState("");
  const [refundDialog, setRefundDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Fetch payments when component loads
  useEffect(() => {
    dispatch(fetchPayments());
  }, [dispatch]);

  // Filter payments based on search
  const filteredPayments = payments.filter((payment) => {
    if (!searchTerm) return true;

    return (
      payment.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Payment status color helper
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      case "refunded":
        return "info";
      default:
        return "default";
    }
  };

  // Handle refund
  const handleRefund = async () => {
    if (!selectedPayment || !refundAmount || !refundReason) {
      alert("Please fill in all refund details");
      return;
    }

    try {
      await dispatch(
        processRefund({
          paymentId: selectedPayment._id || selectedPayment.id,
          amount: parseFloat(refundAmount),
          reason: refundReason,
        })
      ).unwrap();

      alert("Refund processed successfully!");
      setRefundDialog(false);
      setSelectedPayment(null);
      setRefundAmount("");
      setRefundReason("");

      // Refresh payments
      dispatch(fetchPayments());
    } catch (error) {
      alert(`Refund failed: ${error}`);
    }
  };

  // Stats cards data
  const statsCards = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue?.toLocaleString() || 0}`,
      icon: MoneyIcon,
      color: "#4caf50",
    },
    {
      title: "Total Transactions",
      value: stats.totalTransactions?.toLocaleString() || 0,
      icon: ReceiptIcon,
      color: "#2196f3",
    },
    {
      title: "Successful Payments",
      value: stats.successfulPayments || 0,
      icon: TrendingUpIcon,
      color: "#4caf50",
    },
    {
      title: "Failed Payments",
      value: stats.failedPayments || 0,
      icon: ErrorIcon,
      color: "#f44336",
    },
  ];

  // Show loading spinner
  if (loading.payments) {
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
  if (error.payments) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading payments: {error.payments}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Payments Management
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <Box sx={{ p: 2 }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 2,
                      backgroundColor: stat.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <stat.icon />
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Payments Table */}
      <Card>
        <Box sx={{ p: 2 }}>
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search by booking ID, transaction ID, customer name, or payment method..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Typography variant="h6" sx={{ mb: 2 }}>
            All Payments ({filteredPayments.length})
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell>
                    <strong>Transaction ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Booking ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Customer</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Amount</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Method</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Date</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment._id || payment.id}>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {payment.transactionId || payment._id || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {payment.bookingId || payment.booking?._id || "N/A"}
                      </TableCell>
                      <TableCell>
                        {payment.customerName || payment.user?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: "bold" }}
                        >
                          ₹{payment.amount?.toLocaleString() || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.paymentMethod || "Online"}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status || "pending"}
                          color={getStatusColor(payment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {payment.createdAt
                          ? new Date(payment.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() =>
                                console.log("View payment:", payment._id)
                              }
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {payment.status === "completed" && (
                            <Tooltip title="Process Refund">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setRefundAmount(
                                    payment.amount?.toString() || ""
                                  );
                                  setRefundDialog(true);
                                }}
                              >
                                <RefundIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Card>

      {/* Refund Dialog */}
      <Dialog
        open={refundDialog}
        onClose={() => setRefundDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Process Refund</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Processing refund for Transaction:{" "}
              {selectedPayment?.transactionId || selectedPayment?._id}
            </Typography>

            <TextField
              fullWidth
              label="Refund Amount"
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₹</InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Refund Reason"
              multiline
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Enter reason for refund..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRefund}
            variant="contained"
            disabled={loading.refunding}
          >
            {loading.refunding ? (
              <CircularProgress size={20} />
            ) : (
              "Process Refund"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentsManagement;
