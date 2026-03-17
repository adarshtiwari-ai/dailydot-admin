// src/components/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from "@mui/material";
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
  Payments as PaymentsIcon,
} from "@mui/icons-material";

// Import Redux actions
import {
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  updateSystemSettings,
  updateNotificationSettings,
  resetSuccessFlags,
  selectAdminProfile,
  selectSystemSettings,
  selectNotificationSettings,
  selectSettingsLoading,
  selectSettingsError,
  selectSettingsSuccess,
  getSettings,
  selectBillingSettings,
} from "../store/slices/settingsSlice";

const SettingsPage = () => {
  const dispatch = useDispatch();
  const adminProfile = useSelector(selectAdminProfile);
  const systemSettings = useSelector(selectSystemSettings);
  const billingSettings = useSelector(selectBillingSettings);
  const notificationSettings = useSelector(selectNotificationSettings);
  const loading = useSelector(selectSettingsLoading);
  const error = useSelector(selectSettingsError);
  const success = useSelector(selectSettingsSuccess);

  const [tabValue, setTabValue] = useState(0);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Local system settings state
  const [localSystemSettings, setLocalSystemSettings] =
    useState(systemSettings);
  const [localBillingSettings, setLocalBillingSettings] =
    useState(billingSettings);
  const [localNotificationSettings, setLocalNotificationSettings] =
    useState(notificationSettings);

  // Initialize profile form when admin profile loads
  useEffect(() => {
    if (adminProfile) {
      setProfileForm({
        name: adminProfile.name || "",
        email: adminProfile.email || "",
        phone: adminProfile.phone || "",
      });
    }
  }, [adminProfile]);

  // Load admin profile on component mount
  useEffect(() => {
    dispatch(getAdminProfile());
    dispatch(getSettings());
  }, [dispatch]);

  // Update local settings when Redux state changes
  useEffect(() => {
    setLocalSystemSettings(systemSettings);
    setLocalBillingSettings(billingSettings);
    setLocalNotificationSettings(notificationSettings);
  }, [systemSettings, billingSettings, notificationSettings]);

  // Clear success messages after 3 seconds
  // Clear success messages after 3 seconds - FIXED VERSION
  useEffect(() => {
    if (
      success &&
      (success.profileUpdate ||
        success.passwordChange ||
        success.settingsUpdate)
    ) {
      const timer = setTimeout(() => {
        dispatch(resetSuccessFlags());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateAdminProfile(profileForm)).unwrap();
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  };

  // Handle password change submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    try {
      await dispatch(
        changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        })
      ).unwrap();

      // Clear password form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Password change failed:", error);
    }
  };

  // Handle system settings save
  const handleSystemSettingsSave = async () => {
    try {
      await dispatch(updateSystemSettings({ system: localSystemSettings })).unwrap();
    } catch (error) {
      console.error("Failed to update system settings:", error);
    }
  };

  // Handle notification settings save
  const handleNotificationSettingsSave = async () => {
    try {
      await dispatch(updateSystemSettings({ notifications: localNotificationSettings })).unwrap();
    } catch (error) {
      console.error("Failed to update notification settings:", error);
    }
  };

  // Handle billing settings save
  const handleBillingSettingsSave = async () => {
    try {
      // Logic to send top-level billing object
      await dispatch(updateSystemSettings({ billing: localBillingSettings })).unwrap();
    } catch (error) {
      console.error("Failed to update billing settings:", error);
    }
  };

  const handleAddFee = () => {
    setLocalBillingSettings({
      ...localBillingSettings,
      globalFees: [
        ...(localBillingSettings.globalFees || []),
        { name: "", amount: 0, type: "flat", isActive: true }
      ]
    });
  };

  const handleRemoveFee = (index) => {
    const updatedFees = [...localBillingSettings.globalFees];
    updatedFees.splice(index, 1);
    setLocalBillingSettings({
      ...localBillingSettings,
      globalFees: updatedFees
    });
  };

  const handleFeeChange = (index, field, value) => {
    const updatedFees = [...localBillingSettings.globalFees];
    updatedFees[index] = { ...updatedFees[index], [field]: value };
    setLocalBillingSettings({
      ...localBillingSettings,
      globalFees: updatedFees
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Settings
      </Typography>

      {/* Success Messages - FIXED VERSION */}
      {success?.profileUpdate && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Profile updated successfully!
        </Alert>
      )}
      {success?.passwordChange && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Password changed successfully!
        </Alert>
      )}
      {success?.settingsUpdate && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings updated successfully!
        </Alert>
      )}

      {/* Error Messages - FIXED VERSION */}
      {error?.updating && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Profile update failed: {error.updating}
        </Alert>
      )}
      {error?.changingPassword && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Password change failed: {error.changingPassword}
        </Alert>
      )}

      {/* Settings Navigation */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
        >
          <Tab label="Profile" icon={<PersonIcon />} />
          <Tab label="Security" icon={<SecurityIcon />} />
          <Tab label="System" icon={<SettingsIcon />} />
          <Tab label="Billing" icon={<PaymentsIcon />} />
          <Tab label="Notifications" icon={<NotificationIcon />} />
        </Tabs>
      </Card>

      {/* Profile Tab */}
      {tabValue === 0 && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Admin Profile
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  textAlign="center"
                >
                  <Avatar
                    sx={{ width: 120, height: 120, mb: 2, fontSize: "48px" }}
                  >
                    {adminProfile?.name?.charAt(0) || "A"}
                  </Avatar>
                  <Typography variant="h6">
                    {adminProfile?.name || "Admin User"}
                  </Typography>
                  <Chip
                    label="Administrator"
                    color="primary"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Member since{" "}
                    {adminProfile?.createdAt
                      ? new Date(adminProfile.createdAt).toLocaleDateString()
                      : "N/A"}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={8}>
                <Box component="form" onSubmit={handleProfileSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value,
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={
                          loading.updating ? (
                            <CircularProgress size={20} />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        disabled={loading.updating}
                      >
                        {loading.updating ? "Updating..." : "Update Profile"}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Card>
      )}

      {/* Security Tab */}
      {tabValue === 1 && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Change Password
            </Typography>

            <Box
              component="form"
              onSubmit={handlePasswordSubmit}
              sx={{ maxWidth: 500 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    required
                    helperText="Password must be at least 6 characters long"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                    error={
                      passwordForm.newPassword !==
                      passwordForm.confirmPassword &&
                      passwordForm.confirmPassword !== ""
                    }
                    helperText={
                      passwordForm.newPassword !==
                        passwordForm.confirmPassword &&
                        passwordForm.confirmPassword !== ""
                        ? "Passwords do not match"
                        : ""
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                      loading.changingPassword ? (
                        <CircularProgress size={20} />
                      ) : (
                        <SecurityIcon />
                      )
                    }
                    disabled={loading.changingPassword}
                  >
                    {loading.changingPassword
                      ? "Changing Password..."
                      : "Change Password"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Card>
      )}

      {/* System Settings Tab */}
      {tabValue === 2 && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              System Configuration
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    General Settings
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Site Name"
                      value={localSystemSettings.siteName}
                      onChange={(e) =>
                        setLocalSystemSettings({
                          ...localSystemSettings,
                          siteName: e.target.value,
                        })
                      }
                      sx={{ mb: 2 }}
                    />
                  </Box>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={localSystemSettings.currency}
                      onChange={(e) =>
                        setLocalSystemSettings({
                          ...localSystemSettings,
                          currency: e.target.value,
                        })
                      }
                      label="Currency"
                    >
                      <MenuItem value="INR">INR (₹)</MenuItem>
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={localSystemSettings.timezone}
                      onChange={(e) =>
                        setLocalSystemSettings({
                          ...localSystemSettings,
                          timezone: e.target.value,
                        })
                      }
                      label="Timezone"
                    >
                      <MenuItem value="Asia/Kolkata">Asia/Kolkata</MenuItem>
                      <MenuItem value="America/New_York">
                        America/New_York
                      </MenuItem>
                      <MenuItem value="Europe/London">Europe/London</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Active Map Provider</InputLabel>
                    <Select
                      value={localSystemSettings.activeMapProvider || 'ola'}
                      onChange={(e) =>
                        setLocalSystemSettings({
                          ...localSystemSettings,
                          activeMapProvider: e.target.value,
                        })
                      }
                      label="Active Map Provider"
                    >
                      <MenuItem value="ola">Ola Maps</MenuItem>
                      <MenuItem value="google">Google Maps</MenuItem>
                    </Select>
                  </FormControl>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    System Controls
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Maintenance Mode"
                        secondary="Enable to temporarily disable the application"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={localSystemSettings.maintenanceMode}
                          onChange={(e) =>
                            setLocalSystemSettings({
                              ...localSystemSettings,
                              maintenanceMode: e.target.checked,
                            })
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText
                        primary="Allow User Registrations"
                        secondary="Allow new users to register"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={localSystemSettings.allowRegistrations}
                          onChange={(e) =>
                            setLocalSystemSettings({
                              ...localSystemSettings,
                              allowRegistrations: e.target.checked,
                            })
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText
                        primary="Auto Backup"
                        secondary="Automatically backup data daily"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={localSystemSettings.autoBackup}
                          onChange={(e) =>
                            setLocalSystemSettings({
                              ...localSystemSettings,
                              autoBackup: e.target.checked,
                            })
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    onClick={handleSystemSettingsSave}
                    startIcon={<SaveIcon />}
                  >
                    Save System Settings
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Card>
      )}

      {/* Billing Tab */}
      {tabValue === 3 && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Billing & Fees Configuration
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      Platform & Global Fees
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<PaymentsIcon />} 
                      onClick={handleAddFee}
                      size="small"
                    >
                      Add Custom Fee
                    </Button>
                  </Box>

                  <List>
                    {(localBillingSettings.globalFees || []).map((fee, index) => (
                      <ListItem 
                        key={index} 
                        sx={{ 
                          flexDirection: 'column', 
                          alignItems: 'stretch', 
                          bgcolor: 'background.paper', 
                          mb: 2, 
                          borderRadius: 2, 
                          border: '1px solid',
                          borderColor: 'divider',
                          p: 2
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Fee Name"
                              placeholder="e.g. Service Charge"
                              value={fee.name}
                              onChange={(e) => handleFeeChange(index, 'name', e.target.value)}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <TextField
                              fullWidth
                              label="Amount"
                              type="number"
                              value={fee.amount}
                              onChange={(e) => handleFeeChange(index, 'amount', Number(e.target.value))}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Type</InputLabel>
                              <Select
                                value={fee.type}
                                label="Type"
                                onChange={(e) => handleFeeChange(index, 'type', e.target.value)}
                              >
                                <MenuItem value="flat">Flat (₹)</MenuItem>
                                <MenuItem value="percentage">Percentage (%)</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={fee.isActive}
                                    onChange={(e) => handleFeeChange(index, 'isActive', e.target.checked)}
                                    size="small"
                                  />
                                }
                                label="Active"
                              />
                              <Button 
                                color="error" 
                                size="small" 
                                onClick={() => handleRemoveFee(index)}
                              >
                                Delete
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </ListItem>
                    ))}
                    {(localBillingSettings.globalFees || []).length === 0 && (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                        No global fees configured. Default legacy fees will be applied.
                      </Typography>
                    )}
                  </List>
                </Paper>
              </Grid>

              {/* Billing Preview Mock */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, bgcolor: 'grey.50', border: '1px dashed grey.400' }}>
                  <Typography variant="subtitle2" gutterBottom>Preview: Bill for ₹1,000 Service</Typography>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">₹1,000.00</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Tax ({localBillingSettings.defaultTaxRate}%):</Typography>
                    <Typography variant="body2">₹{(1000 * localBillingSettings.defaultTaxRate / 100).toFixed(2)}</Typography>
                  </Box>
                  
                  {/* Dynamic Fees Preview */}
                  {(localBillingSettings.globalFees || []).map((fee, idx) => {
                    if (!fee.isActive || !fee.name) return null;
                    const amount = fee.type === 'flat' 
                      ? fee.amount 
                      : (1000 * (fee.amount / 100));
                    return (
                      <Box key={idx} display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">{fee.name}:</Typography>
                        <Typography variant="body2">₹{amount.toFixed(2)}</Typography>
                      </Box>
                    );
                  })}

                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="subtitle2">Grand Total:</Typography>
                    <Typography variant="subtitle2" color="primary.main">
                      ₹{(
                        1000 + 
                        (1000 * localBillingSettings.defaultTaxRate / 100) + 
                        (localBillingSettings.globalFees || []).reduce((acc, fee) => {
                          if (!fee.isActive) return acc;
                          const feeAmount = fee.type === 'flat' 
                            ? fee.amount 
                            : (1000 * (fee.amount / 100));
                          return acc + feeAmount;
                        }, 0)
                      ).toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    onClick={handleBillingSettingsSave}
                    startIcon={<SaveIcon />}
                    size="large"
                    sx={{ px: 4 }}
                  >
                    Save Billing Settings
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Card>
      )}

      {/* Notifications Tab */}
      {tabValue === 4 && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Notification Preferences
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Real-time Notifications
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemText
                        primary="New Bookings"
                        secondary="Get notified when new bookings are made"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={localNotificationSettings.newBookings}
                          onChange={(e) =>
                            setLocalNotificationSettings({
                              ...localNotificationSettings,
                              newBookings: e.target.checked,
                            })
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText
                        primary="Payment Updates"
                        secondary="Get notified about payment confirmations"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={localNotificationSettings.paymentUpdates}
                          onChange={(e) =>
                            setLocalNotificationSettings({
                              ...localNotificationSettings,
                              paymentUpdates: e.target.checked,
                            })
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText
                        primary="User Registrations"
                        secondary="Get notified when new users register"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={localNotificationSettings.userRegistrations}
                          onChange={(e) =>
                            setLocalNotificationSettings({
                              ...localNotificationSettings,
                              userRegistrations: e.target.checked,
                            })
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText
                        primary="System Alerts"
                        secondary="Get notified about system issues"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={localNotificationSettings.systemAlerts}
                          onChange={(e) =>
                            setLocalNotificationSettings({
                              ...localNotificationSettings,
                              systemAlerts: e.target.checked,
                            })
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Report Notifications
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Daily Reports"
                        secondary="Receive daily business summary"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={localNotificationSettings.dailyReports}
                          onChange={(e) =>
                            setLocalNotificationSettings({
                              ...localNotificationSettings,
                              dailyReports: e.target.checked,
                            })
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText
                        primary="Weekly Reports"
                        secondary="Receive weekly business analytics"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={localNotificationSettings.weeklyReports}
                          onChange={(e) =>
                            setLocalNotificationSettings({
                              ...localNotificationSettings,
                              weeklyReports: e.target.checked,
                            })
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText
                        primary="Monthly Reports"
                        secondary="Receive monthly performance reports"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={localNotificationSettings.monthlyReports}
                          onChange={(e) =>
                            setLocalNotificationSettings({
                              ...localNotificationSettings,
                              monthlyReports: e.target.checked,
                            })
                          }
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    onClick={handleNotificationSettingsSave}
                    startIcon={<SaveIcon />}
                  >
                    Save Notification Settings
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default SettingsPage;
