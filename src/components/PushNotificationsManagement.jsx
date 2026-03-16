import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Divider,
} from "@mui/material";
import { Send as SendIcon, NotificationsActive as NotificationsIcon } from "@mui/icons-material";
import axios from "axios";

// Using the backend URL from the environment or a default
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const PushNotificationsManagement = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      setSnackbar({
        open: true,
        message: "Please provide both a title and a message.",
        severity: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken"); // Assuming token is stored here
      const response = await axios.post(
        `${API_URL}/admin/notifications/broadcast`,
        { title, message },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSnackbar({
        open: true,
        message: `Successfully sent broadcast to ${response.data.count} users!`,
        severity: "success",
      });
      setTitle("");
      setMessage("");
    } catch (error) {
      console.error("Broadcast failed:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to send broadcast notification.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box
          sx={{
            p: 3,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <NotificationsIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Marketing Broadcast
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Send push notifications to all active users instantly.
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notification Title"
                placeholder="e.g., Summer Sale is Live! ☀️"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                inputProps={{ maxLength: 50 }}
                helperText={`${title.length}/50 characters`}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message Content"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                inputProps={{ maxLength: 150 }}
                helperText={`${message.length}/150 characters`}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSendBroadcast}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: "30px",
                    fontWeight: "bold",
                    textTransform: "none",
                    boxShadow: "0 4px 14px 0 rgba(102, 126, 234, 0.39)",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "&:hover": {
                      boxShadow: "0 6px 20px rgba(118, 75, 162, 0.23)",
                    },
                  }}
                >
                  {loading ? "Sending..." : "Send Broadcast"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Paper>

      {/* Info Card */}
      <Card sx={{ mt: 3, bgcolor: "rgba(102, 126, 234, 0.05)", border: "1px dashed rgba(102, 126, 234, 0.3)" }}>
        <CardContent>
          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: "bold" }}>
            Important Note:
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manual broadcasts are sent to all users who have enabled notifications. Please ensure your content is relevant to avoid being marked as spam. Automated booking and status notifications will not be affected by this tool.
          </Typography>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PushNotificationsManagement;
