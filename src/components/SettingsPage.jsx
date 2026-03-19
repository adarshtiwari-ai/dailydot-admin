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
  Slider,
} from "@mui/material";
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
  Payments as PaymentsIcon,
  PhoneIphone as PhoneIphoneIcon,
  CloudUpload as CloudUploadIcon,
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
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

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

  // Local branding settings state — safe splash fallback prevents crashes
  const [localBrandingSettings, setLocalBrandingSettings] = useState({
    splash: systemSettings?.splash || { logoUrl: '', backgroundColor: '#0F172A' },
    homeScreen: systemSettings?.homeScreen || { 
      heroBannerUrl: '',
      gradientTopColor: 'rgba(0,0,0,0.6)',
      gradientMidColor: 'transparent',
      gradientBottomColor: 'rgba(0,0,0,0.8)',
      gradientOpacity: 1.0
    },
    featureFlags: systemSettings?.featureFlags || {
      enableWallet: false,
      enableReferrals: false,
      enableNewUI: false,
      seasonalMode: false,
      enableProviderChat: false,
    },
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

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
    // Sync branding — keep safe defaults so splash is never undefined
    setLocalBrandingSettings({
      splash: systemSettings?.splash || { logoUrl: '', backgroundColor: '#0F172A' },
      homeScreen: systemSettings?.homeScreen || { 
        heroBannerUrl: '',
        gradientTopColor: 'rgba(0,0,0,0.6)',
        gradientMidColor: 'transparent',
        gradientBottomColor: 'rgba(0,0,0,0.8)',
        gradientOpacity: 1.0
      },
      featureFlags: systemSettings?.featureFlags || {
        enableWallet: false, enableReferrals: false, enableNewUI: false,
        seasonalMode: false, enableProviderChat: false,
      },
    });
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

  // Handle branding settings save — dispatches splash + featureFlags together
  const handleBrandingSettingsSave = async () => {
    try {
      await dispatch(updateSystemSettings({
        splash: localBrandingSettings.splash,
        featureFlags: localBrandingSettings.featureFlags,
        homeScreen: localBrandingSettings.homeScreen,
      })).unwrap();
    } catch (error) {
      console.error("Failed to update branding settings:", error);
    }
  };

  // Handle logo file selection → upload to Cloudinary → store URL in state
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const secureUrl = await uploadToCloudinary(file, { folder: 'splash_logos' });
      setLocalBrandingSettings((prev) => ({
        ...prev,
        splash: { ...prev.splash, logoUrl: secureUrl },
      }));
    } catch (err) {
      console.error('Logo upload failed:', err);
    } finally {
      setIsUploadingLogo(false);
    }
  };
  
  // Handle Hero Banner upload
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const secureUrl = await uploadToCloudinary(file, { folder: 'home_banners' });
      setLocalBrandingSettings((prev) => ({
        ...prev,
        homeScreen: { ...prev.homeScreen, heroBannerUrl: secureUrl },
      }));
    } catch (err) {
      console.error('Hero Banner upload failed:', err);
    } finally {
      setIsUploadingBanner(false);
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
          <Tab label="Branding" icon={<PhoneIphoneIcon />} />
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

      {/* ── Branding Tab (index 5) ─────────────────────────────────── */}
      {tabValue === 5 && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Mobile App Branding
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Controls the splash screen logo and background colour shown when the
              mobile app boots. Changes take effect on the next app launch.
            </Typography>

            <Grid container spacing={3}>

              {/* ── Left: Upload & Colour controls ─────────────── */}
              <Grid item xs={12} md={7}>

                {/* Logo Upload */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Splash Logo
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={
                        isUploadingLogo
                          ? <CircularProgress size={18} />
                          : <CloudUploadIcon />
                      }
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo ? 'Uploading…' : 'Upload Logo to Cloudinary'}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleLogoUpload}
                      />
                    </Button>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                      PNG/SVG recommended. Transparent background works best on dark splash screens.
                    </Typography>
                  </Box>

                  {/* URL override / manual entry */}
                  <TextField
                    fullWidth
                    label="Logo URL (Cloudinary URL)"
                    placeholder="https://res.cloudinary.com/…"
                    value={localBrandingSettings.splash.logoUrl}
                    onChange={(e) =>
                      setLocalBrandingSettings((prev) => ({
                        ...prev,
                        splash: { ...prev.splash, logoUrl: e.target.value },
                      }))
                    }
                    helperText="Auto-filled on upload. You can also paste a URL directly."
                    size="small"
                  />
                </Paper>

                {/* Home Hero Banner Upload */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Home Screen Hero Banner
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={
                        isUploadingBanner
                          ? <CircularProgress size={18} />
                          : <CloudUploadIcon />
                      }
                      disabled={isUploadingBanner}
                    >
                      {isUploadingBanner ? 'Uploading…' : 'Upload Banner to Cloudinary'}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleBannerUpload}
                      />
                    </Button>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                      High-resolution landscape image (16:9) recommended. This will sit behind the search bar.
                    </Typography>
                  </Box>

                  {/* URL override / manual entry */}
                  <TextField
                    fullWidth
                    label="Hero Banner URL"
                    placeholder="https://res.cloudinary.com/…"
                    value={localBrandingSettings.homeScreen.heroBannerUrl}
                    onChange={(e) =>
                      setLocalBrandingSettings((prev) => ({
                        ...prev,
                        homeScreen: { ...prev.homeScreen, heroBannerUrl: e.target.value },
                      }))
                    }
                    helperText="Auto-filled on upload. Used for the home screen parallax effect."
                    size="small"
                  />

                  {/* Banner Preview Thumbnail */}
                  {localBrandingSettings.homeScreen.heroBannerUrl && (
                    <Box sx={{ mt: 2, width: '100%', height: 120, borderRadius: 1, overflow: 'hidden', bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>
                       <Box 
                        component="img"
                        src={localBrandingSettings.homeScreen.heroBannerUrl}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  )}

                  {/* Hero Banner Gradient Controls */}
                  <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                    Banner Gradient Overlay
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" display="block" sx={{ mb: 1 }}>Top Color</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          component="input"
                          type="color"
                          value={localBrandingSettings.homeScreen.gradientTopColor?.startsWith('rgba') ? '#000000' : localBrandingSettings.homeScreen.gradientTopColor}
                          onChange={(e) =>
                            setLocalBrandingSettings((prev) => ({
                              ...prev,
                              homeScreen: { ...prev.homeScreen, gradientTopColor: e.target.value },
                            }))
                          }
                          sx={{ width: 40, height: 40, border: '1px solid #ccc', cursor: 'pointer', p: 0, borderRadius: 1 }}
                        />
                        <TextField 
                          size="small" 
                          value={localBrandingSettings.homeScreen.gradientTopColor}
                          onChange={(e) => setLocalBrandingSettings(prev => ({ ...prev, homeScreen: { ...prev.homeScreen, gradientTopColor: e.target.value } }))}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" display="block" sx={{ mb: 1 }}>Middle Color</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          component="input"
                          type="color"
                          value={localBrandingSettings.homeScreen.gradientMidColor === 'transparent' ? '#000000' : localBrandingSettings.homeScreen.gradientMidColor}
                          onChange={(e) =>
                            setLocalBrandingSettings((prev) => ({
                              ...prev,
                              homeScreen: { ...prev.homeScreen, gradientMidColor: e.target.value },
                            }))
                          }
                          sx={{ width: 40, height: 40, border: '1px solid #ccc', cursor: 'pointer', p: 0, borderRadius: 1 }}
                        />
                        <TextField 
                          size="small" 
                          value={localBrandingSettings.homeScreen.gradientMidColor}
                          onChange={(e) => setLocalBrandingSettings(prev => ({ ...prev, homeScreen: { ...prev.homeScreen, gradientMidColor: e.target.value } }))}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" display="block" sx={{ mb: 1 }}>Bottom Color</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          component="input"
                          type="color"
                          value={localBrandingSettings.homeScreen.gradientBottomColor?.startsWith('rgba') ? '#000000' : localBrandingSettings.homeScreen.gradientBottomColor}
                          onChange={(e) =>
                            setLocalBrandingSettings((prev) => ({
                              ...prev,
                              homeScreen: { ...prev.homeScreen, gradientBottomColor: e.target.value },
                            }))
                          }
                          sx={{ width: 40, height: 40, border: '1px solid #ccc', cursor: 'pointer', p: 0, borderRadius: 1 }}
                        />
                        <TextField 
                          size="small" 
                          value={localBrandingSettings.homeScreen.gradientBottomColor}
                          onChange={(e) => setLocalBrandingSettings(prev => ({ ...prev, homeScreen: { ...prev.homeScreen, gradientBottomColor: e.target.value } }))}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" display="block" sx={{ mt: 1, mb: 1 }}>Gradient Opacity ({Math.round(localBrandingSettings.homeScreen.gradientOpacity * 100)}%)</Typography>
                      <Slider
                        value={localBrandingSettings.homeScreen.gradientOpacity}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(e, newValue) =>
                          setLocalBrandingSettings((prev) => ({
                            ...prev,
                            homeScreen: { ...prev.homeScreen, gradientOpacity: newValue },
                          }))
                        }
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Background Color */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Splash Background Color
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      component="input"
                      type="color"
                      value={localBrandingSettings.splash.backgroundColor}
                      onChange={(e) =>
                        setLocalBrandingSettings((prev) => ({
                          ...prev,
                          splash: { ...prev.splash, backgroundColor: e.target.value },
                        }))
                      }
                      sx={{
                        width: 48, height: 48, border: 'none', cursor: 'pointer',
                        borderRadius: 1, p: 0.5, bgcolor: 'transparent',
                      }}
                    />
                    <TextField
                      label="Hex Color"
                      value={localBrandingSettings.splash.backgroundColor}
                      onChange={(e) =>
                        setLocalBrandingSettings((prev) => ({
                          ...prev,
                          splash: { ...prev.splash, backgroundColor: e.target.value },
                        }))
                      }
                      size="small"
                      sx={{ width: 160 }}
                      inputProps={{ maxLength: 7 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      This is the outer gradient stop colour on the mobile splash screen.
                    </Typography>
                  </Box>
                </Paper>

                {/* Feature Flags */}
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Feature Flags
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Toggle these to remotely enable or disable features in the mobile app.
                  </Typography>
                  <List dense>
                    {[
                      { key: 'enableWallet',       label: 'Wallet',        desc: 'In-app wallet & balance top-up' },
                      { key: 'enableReferrals',    label: 'Referrals',     desc: 'Referral codes & rewards' },
                      { key: 'enableNewUI',        label: 'New UI',        desc: 'Enable redesigned home screen layout' },
                      { key: 'seasonalMode',       label: 'Seasonal Mode', desc: 'Show seasonal promotions & banners' },
                      { key: 'enableProviderChat', label: 'Provider Chat', desc: 'In-app chat with service providers' },
                    ].map(({ key, label, desc }) => (
                      <ListItem key={key} disableGutters>
                        <ListItemText primary={label} secondary={desc} />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={localBrandingSettings.featureFlags[key] ?? false}
                            onChange={(e) =>
                              setLocalBrandingSettings((prev) => ({
                                ...prev,
                                featureFlags: { ...prev.featureFlags, [key]: e.target.checked },
                              }))
                            }
                            color="primary"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* ── Right: Live Preview ─────────────────────────── */}
              <Grid item xs={12} md={5}>
                <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Live Preview
                  </Typography>
                  {/* Phone shell */}
                  <Box
                    sx={{
                      mx: 'auto',
                      width: 200,
                      height: 380,
                      borderRadius: 6,
                      border: '6px solid',
                      borderColor: 'grey.700',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(180deg, ${localBrandingSettings.splash.backgroundColor} 0%, #1E293B 50%, ${localBrandingSettings.splash.backgroundColor} 100%)`,
                    }}
                  >
                    {localBrandingSettings.splash.logoUrl ? (
                      <Box
                        component="img"
                        src={localBrandingSettings.splash.logoUrl}
                        alt="Splash logo preview"
                        sx={{ width: '65%', objectFit: 'contain', maxHeight: '40%' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <Box textAlign="center">
                        <PhoneIphoneIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                        <Typography variant="caption" color="grey.500" display="block">
                          Upload a logo to preview
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" align="center" sx={{ mt: 1.5 }}>
                    Simulated splash screen — gradient matches the mobile app.
                  </Typography>
                </Paper>
              </Grid>

              {/* Save button */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    onClick={handleBrandingSettingsSave}
                    startIcon={
                      loading.savingSettings
                        ? <CircularProgress size={20} />
                        : <SaveIcon />
                    }
                    disabled={loading.savingSettings || isUploadingLogo}
                    size="large"
                    sx={{ px: 4 }}
                  >
                    {loading.savingSettings ? 'Saving…' : 'Save Branding Settings'}
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
