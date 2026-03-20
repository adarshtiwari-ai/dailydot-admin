// src/components/ReviewsManagement.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Card,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Rating,
  TextField,
  InputAdornment,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Search as SearchIcon,
  Star as StarIcon,
  RateReview as ReviewIcon,
  ThumbUp as ThumbUpIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

// Import the Redux actions
import {
  fetchReviews,
  fetchReviewStats,
  moderateReview,
  deleteReview,
  selectReviews,
  selectReviewsLoading,
  selectReviewsError,
  selectReviewsStats,
} from "../store/slices/reviewsSlice";

const ReviewsManagement = () => {
  const dispatch = useDispatch();
  const reviews = useSelector(selectReviews);
  const loading = useSelector(selectReviewsLoading);
  const error = useSelector(selectReviewsError);
  const stats = useSelector(selectReviewsStats);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  // Fetch reviews and stats when component loads
  useEffect(() => {
    dispatch(fetchReviews());
    dispatch(fetchReviewStats());
  }, [dispatch]);

  // Filter reviews based on search and status
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      (!searchTerm) ||
      review.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.serviceId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || review.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Action Handlers
  const handleApprove = (reviewId) => {
    dispatch(moderateReview({ reviewId, status: "approved" }));
  };

  const handleReject = (reviewId) => {
    dispatch(moderateReview({ reviewId, status: "rejected" }));
  };

  const handleDelete = (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      dispatch(deleteReview(reviewId));
    }
  };

  const handleOpenReply = (review) => {
    setSelectedReviewId(review._id);
    setReplyText(review.adminResponse?.message || "");
    setReplyDialogOpen(true);
  };

  const handleCloseReply = () => {
    setReplyDialogOpen(false);
    setReplyText("");
    setSelectedReviewId(null);
  };

  const handleSubmitReply = () => {
    if (replyText.trim().length < 10) {
      alert("Response must be at least 10 characters long.");
      return;
    }
    dispatch(respondToReview({ reviewId: selectedReviewId, message: replyText }));
    handleCloseReply();
  };

  // Stats cards data
  const statsCards = [
    {
      title: "Total Reviews",
      value: stats.totalReviews || 0,
      icon: ReviewIcon,
      color: "#2196f3",
    },
    {
      title: "Average Rating",
      value: `${stats.averageRating || 0}/5`,
      icon: StarIcon,
      color: "#ff9800",
    },
    {
      title: "Pending Approval",
      value: stats.pendingReviews || 0,
      icon: ThumbUpIcon,
      color: "#9c27b0", // Purple for pending
    },
    {
      title: "Flagged",
      value: stats.flaggedReviews || 0,
      icon: RejectIcon,
      color: "#f44336",
    },
  ];

  // Show loading spinner
  if (loading.reviews && reviews.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const getStatusChipColor = (status) => {
    switch (status) {
      case "approved": return "success";
      case "rejected": return "error";
      case "flagged": return "warning";
      default: return "default"; // pending
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Reviews Management
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <Box sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
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

      {/* Main Reviews Table */}
      <Card>
        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" mb={2} gap={2}>
            {/* Search Bar */}
            <TextField
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
              size="small"
            />

            {/* Filter Buttons */}
            <Box>
              <Button
                variant={filterStatus === 'all' ? "contained" : "outlined"}
                onClick={() => setFilterStatus('all')}
                sx={{ mr: 1 }}
              >All</Button>
              <Button
                variant={filterStatus === 'pending' ? "contained" : "outlined"}
                color="warning"
                onClick={() => setFilterStatus('pending')}
                sx={{ mr: 1 }}
              >Pending</Button>
              <Button
                variant={filterStatus === 'approved' ? "contained" : "outlined"}
                color="success"
                onClick={() => setFilterStatus('approved')}
              >Approved</Button>
            </Box>
          </Box>

          <Typography variant="h6" sx={{ mb: 2 }}>
            {filterStatus === 'all' ? 'All' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Reviews ({filteredReviews.length})
          </Typography>

          {filteredReviews.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
              <ReviewIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No reviews found
              </Typography>
            </Box>
          ) : (
            <Box>
              {filteredReviews.map((review) => (
                <Card key={review._id} sx={{ mb: 2, border: "1px solid #e0e0e0" }}>
                  <Box sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar>{review.userId?.name?.charAt(0) || "U"}</Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                            {review.userId?.name || "Anonymous"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {review.serviceId?.name || "Service Deleted"} •{" "}
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Date N/A"}
                          </Typography>
                        </Box>
                      </Box>
                      <Box textAlign="right">
                        <Rating value={review.rating || 0} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {review.rating || 0}/5 stars
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Admin Response Section */}
                    {review.adminResponse?.message && (
                      <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1, borderLeft: "4px solid #757575" }}>
                        <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary" }}>
                          Admin Response ({review.adminResponse.respondedAt ? new Date(review.adminResponse.respondedAt).toLocaleDateString() : "Date N/A"}):
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {review.adminResponse.message}
                        </Typography>
                      </Box>
                    )}

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip
                          label={review.status.toUpperCase()}
                          color={getStatusChipColor(review.status)}
                          size="small"
                        />
                        {review.bookingId && (
                          <Chip 
                            label={`Booking: ${typeof review.bookingId === 'object' ? review.bookingId.bookingNumber : String(review.bookingId).slice(-6)}`} 
                            variant="outlined" 
                            size="small" 
                          />
                        )}
                      </Box>

                      <Box>
                        {/* Moderation Toggles */}
                        {review.status !== 'approved' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => handleApprove(review._id)}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                        )}

                        {review.status !== 'rejected' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            startIcon={<RejectIcon />}
                            onClick={() => handleReject(review._id)}
                            sx={{ mr: 1 }}
                          >
                            Reject
                          </Button>
                        )}

                        {/* Reply Button */}
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<ReviewIcon />}
                          onClick={() => handleOpenReply(review)}
                          sx={{ mr: 1 }}
                        >
                          {review.adminResponse?.message ? "Edit Reply" : "Reply"}
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(review._id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onClose={handleCloseReply} maxWidth="sm" fullWidth>
        <DialogTitle>
          {replyText ? "Edit Response" : "Public Response to Review"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your response will be visible to all users on the mobile app.
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            placeholder="Type your response here (min 10 characters)..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReply}>Cancel</Button>
          <Button 
            onClick={handleSubmitReply} 
            variant="contained" 
            color="primary"
            disabled={replyText.trim().length < 10}
          >
            Submit Response
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewsManagement;
