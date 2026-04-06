// src/components/UsersManagement.jsx
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
  Avatar,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Badge,
} from "@mui/material";
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";

// Import the Redux actions we just created
import {
  fetchUsers,
  selectUsers,
  selectUsersLoading,
  selectUsersError,
} from "../store/slices/usersSlice";

const UsersManagement = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);

  const [searchTerm, setSearchTerm] = useState("");
  const [tabValue, setTabValue] = useState(0); // 0 = All, 1 = Customers, 2 = Admins

  // Fetch users when component loads
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Filter users based on search and tab
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);

    const matchesTab =
      tabValue === 0 ||
      (tabValue === 1 && user.role === "user") ||
      (tabValue === 2 && user.role === "admin");

    return matchesSearch && matchesTab;
  });

  // Get user counts for tabs
  const userCounts = {
    total: users.length,
    customers: users.filter((u) => u.role === "user").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  // Role color helper
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "error";
      case "user":
        return "primary";
      default:
        return "default";
    }
  };

  // Show loading spinner
  if (loading.users) {
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
  if (error.users) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading users: {error.users}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Users Management
      </Typography>

      <Card>
        <Box sx={{ p: 2 }}>
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search users by name, email, or phone..."
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

          {/* Tabs for filtering */}
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ mb: 2 }}
          >
            <Tab
              label={
                <Badge badgeContent={userCounts.total} color="primary">
                  All Users
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={userCounts.customers} color="primary">
                  Customers
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={userCounts.admins} color="primary">
                  Admins
                </Badge>
              }
            />
          </Tabs>

          <Typography variant="h6" sx={{ mb: 2 }}>
            {tabValue === 0 && `All Users (${filteredUsers.length})`}
            {tabValue === 1 && `Customers (${filteredUsers.length})`}
            {tabValue === 2 && `Admins (${filteredUsers.length})`}
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell>
                    <strong>User</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Contact</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Role</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Joined</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Last Login</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user._id || user.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar>
                            {user.role === "admin" ? (
                              <AdminIcon />
                            ) : (
                              <PersonIcon />
                            )}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {user.name || "N/A"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {user._id || user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={0.5}
                          >
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {user.email || "N/A"}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {user.phone || "N/A"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role?.toUpperCase() || "USER"}
                          color={getRoleColor(user.role)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => console.log("View user:", user._id)}
                        >
                          View
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
    </Box>
  );
};

export default UsersManagement;
