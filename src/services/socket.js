import io from "socket.io-client";
import { store } from "../store/store";
import { updateRealtimeData } from "../store/slices/dashboardSlice";
import { addNotification } from "../store/slices/uiSlice";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      console.warn("No auth token found, cannot connect to socket");
      return;
    }

    // Production Sync: Point to live Render backend
    const BASE_URL = import.meta.env.VITE_SOCKET_URL || "https://dailydot-api.onrender.com";
    
    console.log("⏳ Waiting for Render to wake up...");

    this.socket = io(BASE_URL, {
      auth: {
        token,
      },
      transports: ["websocket"],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 5000,
      connectTimeout: 45000,
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("✅ Socket connected to server. ID:", this.socket.id);
      this.isConnected = true;

      // Join admin room for admin-specific events
      this.socket.emit("join-admin-room");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected from server. Reason:", reason);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("⚠️ Socket connection error:", error.message);
      this.isConnected = false;
    });

    // Admin-specific events
    this.socket.on("admin-notification", (data) => {
      store.dispatch(
        addNotification({
          type: "info",
          title: data.title,
          message: data.message,
          priority: data.priority || "medium",
        })
      );
    });

    // Real-time dashboard updates
    this.socket.on("dashboard-update", (data) => {
      store.dispatch(updateRealtimeData(data));
    });

    // Booking events
    this.socket.on("new-booking", (booking) => {
      console.log("🔥 SOCKET DATA ARRIVED AT DASHBOARD (Singleton):", booking);
      store.dispatch(
        updateRealtimeData({
          type: "NEW_BOOKING",
          data: booking,
        })
      );

      store.dispatch(
        addNotification({
          type: "success",
          title: "New Booking",
          message: `New booking received for #${booking.bookingNumber}`,
          priority: "high",
        })
      );
    });

    this.socket.on("booking-updated", (booking) => {
      store.dispatch(
        updateRealtimeData({
          type: "BOOKING_STATUS_UPDATED",
          data: booking,
        })
      );

      store.dispatch(
        addNotification({
          type: "info",
          title: "Booking Updated",
          message: `Booking ${booking.bookingNumber} status changed to ${booking.status}`,
          priority: "medium",
        })
      );
    });

    this.socket.on("booking-cancelled", (booking) => {
      store.dispatch(
        updateRealtimeData({
          type: "BOOKING_CANCELLED",
          data: booking,
        })
      );

      store.dispatch(
        addNotification({
          type: "warning",
          title: "Booking Cancelled",
          message: `Booking ${booking.bookingNumber} has been cancelled`,
          priority: "high",
        })
      );
    });

    // User events
    this.socket.on("new-user", (user) => {
      store.dispatch(
        updateRealtimeData({
          type: "NEW_USER",
          data: user,
        })
      );

      store.dispatch(
        addNotification({
          type: "success",
          title: "New User Registration",
          message: `New ${user.role} registered: ${user.name}`,
          priority: "low",
        })
      );
    });

    // Payment events
    this.socket.on("payment-completed", (payment) => {
      store.dispatch(
        addNotification({
          type: "success",
          title: "Payment Completed",
          message: `Payment of ₹${(payment.amount / 100).toLocaleString()} received`,
          priority: "medium",
        })
      );
    });

    this.socket.on("payment-failed", (payment) => {
      store.dispatch(
        addNotification({
          type: "error",
          title: "Payment Failed",
          message: `Payment failed for booking ${payment.bookingId}`,
          priority: "high",
        })
      );
    });

    // Review events
    this.socket.on("new-review", (review) => {
      store.dispatch(
        addNotification({
          type: "info",
          title: "New Review",
          message: `New ${review.rating}-star review received`,
          priority: "low",
        })
      );
    });

    // System events
    this.socket.on("system-alert", (alert) => {
      store.dispatch(
        addNotification({
          type: alert.type || "warning",
          title: alert.title,
          message: alert.message,
          priority: "high",
        })
      );
    });

    // Provider events
    this.socket.on("provider-online", (provider) => {
      store.dispatch(
        addNotification({
          type: "info",
          title: "Provider Online",
          message: `${provider.name} is now online`,
          priority: "low",
        })
      );
    });

    this.socket.on("provider-offline", (provider) => {
      store.dispatch(
        addNotification({
          type: "info",
          title: "Provider Offline",
          message: `${provider.name} went offline`,
          priority: "low",
        })
      );
    });

    // Emergency events
    this.socket.on("emergency-booking", (booking) => {
      store.dispatch(
        addNotification({
          type: "error",
          title: "Emergency Booking",
          message: `Emergency booking needs immediate attention: ${booking.bookingNumber}`,
          priority: "critical",
        })
      );
    });
  }

  // Emit events
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // Helper to get raw socket
  getSocket() {
    return this.socket;
  }

  // Join specific rooms
  joinRoom(room) {
    this.emit("join-room", room);
  }

  leaveRoom(room) {
    this.emit("leave-room", room);
  }

  // Admin-specific actions
  broadcastToProviders(message) {
    this.emit("admin-broadcast-providers", message);
  }

  broadcastToCustomers(message) {
    this.emit("admin-broadcast-customers", message);
  }

  sendSystemAlert(alert) {
    this.emit("admin-system-alert", alert);
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Reconnect
  reconnect() {
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
