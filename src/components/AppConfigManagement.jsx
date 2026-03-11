import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    Switch,
    FormControlLabel,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Divider,
    Card,
    CardContent,
    Snackbar,
    Alert,
    Tooltip,
    Radio,
    RadioGroup,
    FormControl,
    FormLabel
} from '@mui/material';
import { SketchPicker } from 'react-color';
import {
    DragIndicator,
    Add as AddIcon,
    Delete as DeleteIcon,
    ArrowUpward,
    ArrowDownward,
    Save as SaveIcon,
    Smartphone,
    ColorLens,
    Navigation as NavIcon,
    PowerSettingsNew,
    ViewStream,
    VerifiedUser,
    TrendingUp,
    CheckCircle
} from '@mui/icons-material';
import axiosInstance from '../services/api.service';

/**
 * App Configuration Management
 * 
 * Manages Server-Driven UI for the mobile app including:
 * - Theme colors (Primary/Secondary)
 * - Dynamic Navigation (Tabs)
 * - Maintenance Mode
 */
const AppConfigManagement = () => {
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // State for config
    const [theme, setTheme] = useState({
        primary: '#667eea',
        secondary: '#764ba2',
        backgroundType: 'solid',
        gradientColors: ['#667eea', '#764ba2']
    });
    const [navigation, setNavigation] = useState([]);
    const [homeLayout, setHomeLayout] = useState([]);
    const [safetyShield, setSafetyShield] = useState({ label1: '', label2: '', label3: '' });
    const [featuredServices, setFeaturedServices] = useState([]);
    const [services, setServices] = useState([]);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState({ primary: false, secondary: false, grad1: false, grad2: false });

    useEffect(() => {
        fetchSettings();
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await axiosInstance.get('/services');
            if (response.data.success) {
                setServices(response.data.data);
            }
        } catch (error) {
            console.error('Fetch services error:', error);
        }
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/settings');
            if (response.data.success) {
                const data = response.data.data;
                setTheme({
                    primary: data.theme?.primary || '#667eea',
                    secondary: data.theme?.secondary || '#764ba2',
                    backgroundType: data.theme?.backgroundType || 'solid',
                    gradientColors: data.theme?.gradientColors || ['#667eea', '#764ba2']
                });
                setNavigation(data.navigation || []);

                // Normalization Logic for Home Layout
                let rawLayout = data.homeLayout || [];
                const coreSections = [
                    'categories',
                    'banners',
                    'recent_bookings',
                    'trending_services',
                    'safety_shield',
                    'car_on_wheels',
                    'top_booked'
                ];

                if (rawLayout.length === 0) {
                    rawLayout = coreSections.map((section, index) => ({
                        section,
                        enabled: true,
                        order: index + 1
                    }));
                } else if (typeof rawLayout[0] === 'string') {
                    rawLayout = rawLayout.map((name, index) => ({
                        section: name,
                        enabled: true,
                        order: index + 1
                    }));
                }

                // Ensure all core sections exist in the layout (additive normalization)
                coreSections.forEach((section, index) => {
                    if (!rawLayout.find(item => item.section === section)) {
                        rawLayout.push({
                            section,
                            enabled: false, // Default to disabled for newly discovered sections
                            order: rawLayout.length + 1
                        });
                    }
                });

                setHomeLayout(rawLayout);

                setSafetyShield(data.safetyShield || { label1: 'Verified Pros', label2: 'Insured', label3: 'Quality Guaranteed' });
                setFeaturedServices(data.featuredServices || []);
                setMaintenanceMode(data.system?.maintenanceMode || false);
            }
        } catch (error) {
            console.error('Fetch settings error:', error);
            showSnackbar('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const payload = {
                theme,
                navigation,
                homeLayout,
                safetyShield,
                featuredServices,
                system: { maintenanceMode }
            };

            const response = await axiosInstance.put('/settings', payload);
            if (response.data.success) {
                showSnackbar('App Remotely Updated! 🚀', 'success');
            }
        } catch (error) {
            console.error('Save settings error:', error);
            showSnackbar('Failed to update app configuration', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleMove = (index, direction) => {
        const newItems = [...navigation];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newItems.length) {
            [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
            setNavigation(newItems);
        }
    };

    const handleRemoveTab = (index) => {
        const newItems = navigation.filter((_, i) => i !== index);
        setNavigation(newItems);
    };

    const handleAddTab = () => {
        setNavigation([...navigation, { label: 'New Tab', icon: 'home', route: 'home' }]);
    };

    const handleMoveLayout = (index, direction) => {
        const newLayout = [...homeLayout];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newLayout.length) {
            [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
            // Update order property
            newLayout.forEach((item, i) => { item.order = i + 1; });
            setHomeLayout(newLayout);
        }
    };

    const toggleLayoutVisibility = async (index) => {
        const newLayout = [...homeLayout];
        const section = newLayout[index].section;
        const newStatus = !newLayout[index].enabled;

        try {
            // Optimistic update
            newLayout[index].enabled = newStatus;
            setHomeLayout(newLayout);

            const response = await axiosInstance.patch(`/settings/layout/${section}`, { enabled: newStatus });
            if (response.data.success) {
                showSnackbar(`${section.replace('_', ' ')} ${newStatus ? 'Enabled' : 'Disabled'}!`, 'success');
            }
        } catch (error) {
            console.error('Toggle section error:', error);
            showSnackbar('Failed to update section status', 'error');
            // Revert state on error
            fetchSettings();
        }
    };

    const handleServiceToggle = (serviceId) => {
        if (featuredServices.includes(serviceId)) {
            setFeaturedServices(featuredServices.filter(id => id !== serviceId));
        } else {
            setFeaturedServices([...featuredServices, serviceId]);
        }
    };

    if (loading && !homeLayout.length) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography color="textSecondary">Loading App Configuration...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Grid container spacing={4}>
                {/* Left Side: Controls */}
                <Grid item xs={12} md={7}>
                    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                        <Box display="flex" alignItems="center" mb={3}>
                            <ColorLens sx={{ mr: 1, color: '#667eea' }} />
                            <Typography variant="h6">Theme Customization</Typography>
                        </Box>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <FormControl component="fieldset">
                                    <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem' }}>App Background Style</FormLabel>
                                    <RadioGroup
                                        row
                                        value={theme.backgroundType}
                                        onChange={(e) => setTheme({ ...theme, backgroundType: e.target.value })}
                                    >
                                        <FormControlLabel value="solid" control={<Radio size="small" />} label={<Typography variant="body2">Solid Color</Typography>} />
                                        <FormControlLabel value="gradient" control={<Radio size="small" />} label={<Typography variant="body2">Linear Gradient</Typography>} />
                                    </RadioGroup>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={theme.backgroundType === 'solid' ? 6 : 6}>
                                <Typography variant="subtitle2" gutterBottom>Primary / Brand Color</Typography>
                                <Box sx={{ position: 'relative' }}>
                                    <Box
                                        onClick={() => setShowColorPicker({ ...showColorPicker, primary: !showColorPicker.primary })}
                                        sx={{
                                            p: 0.5,
                                            background: '#fff',
                                            borderRadius: 1,
                                            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                                            display: 'inline-block',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Box sx={{ width: 36, height: 14, borderRadius: '2px', background: theme.primary }} />
                                    </Box>
                                    {showColorPicker.primary && (
                                        <Box sx={{ position: 'absolute', zIndex: 2, mt: 1 }}>
                                            <Box sx={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }} onClick={() => setShowColorPicker({ ...showColorPicker, primary: false })} />
                                            <SketchPicker color={theme.primary} onChange={(c) => setTheme({ ...theme, primary: c.hex })} />
                                        </Box>
                                    )}
                                    <TextField
                                        size="small"
                                        value={theme.primary}
                                        onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                                        sx={{ ml: 2, width: 120 }}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" gutterBottom>Secondary / Accent Color</Typography>
                                <Box sx={{ position: 'relative' }}>
                                    <Box
                                        onClick={() => setShowColorPicker({ ...showColorPicker, secondary: !showColorPicker.secondary })}
                                        sx={{
                                            p: 0.5,
                                            background: '#fff',
                                            borderRadius: 1,
                                            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                                            display: 'inline-block',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Box sx={{ width: 36, height: 14, borderRadius: '2px', background: theme.secondary || '#764ba2' }} />
                                    </Box>
                                    {showColorPicker.secondary && (
                                        <Box sx={{ position: 'absolute', zIndex: 2, mt: 1 }}>
                                            <Box sx={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }} onClick={() => setShowColorPicker({ ...showColorPicker, secondary: false })} />
                                            <SketchPicker color={theme.secondary || '#764ba2'} onChange={(c) => setTheme({ ...theme, secondary: c.hex })} />
                                        </Box>
                                    )}
                                    <TextField
                                        size="small"
                                        value={theme.secondary || '#764ba2'}
                                        onChange={(e) => setTheme({ ...theme, secondary: e.target.value })}
                                        sx={{ ml: 2, width: 120 }}
                                    />
                                </Box>
                            </Grid>

                            {theme.backgroundType === 'gradient' && (
                                <>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" gutterBottom>Gradient Start Color</Typography>
                                        <Box sx={{ position: 'relative' }}>
                                            <Box
                                                onClick={() => setShowColorPicker({ ...showColorPicker, grad1: !showColorPicker.grad1 })}
                                                sx={{
                                                    p: 0.5,
                                                    background: '#fff',
                                                    borderRadius: 1,
                                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                                                    display: 'inline-block',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Box sx={{ width: 36, height: 14, borderRadius: '2px', background: theme.gradientColors[0] }} />
                                            </Box>
                                            {showColorPicker.grad1 && (
                                                <Box sx={{ position: 'absolute', zIndex: 2, mt: 1 }}>
                                                    <Box sx={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }} onClick={() => setShowColorPicker({ ...showColorPicker, grad1: false })} />
                                                    <SketchPicker
                                                        color={theme.gradientColors[0]}
                                                        onChange={(c) => {
                                                            const newColors = [...theme.gradientColors];
                                                            newColors[0] = c.hex;
                                                            setTheme({ ...theme, gradientColors: newColors });
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                            <TextField
                                                size="small"
                                                value={theme.gradientColors[0]}
                                                onChange={(e) => {
                                                    const newColors = [...theme.gradientColors];
                                                    newColors[0] = e.target.value;
                                                    setTheme({ ...theme, gradientColors: newColors });
                                                }}
                                                sx={{ ml: 2, width: 120 }}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" gutterBottom>Gradient End Color</Typography>
                                        <Box sx={{ position: 'relative' }}>
                                            <Box
                                                onClick={() => setShowColorPicker({ ...showColorPicker, grad2: !showColorPicker.grad2 })}
                                                sx={{
                                                    p: 0.5,
                                                    background: '#fff',
                                                    borderRadius: 1,
                                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                                                    display: 'inline-block',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Box sx={{ width: 36, height: 14, borderRadius: '2px', background: theme.gradientColors[1] }} />
                                            </Box>
                                            {showColorPicker.grad2 && (
                                                <Box sx={{ position: 'absolute', zIndex: 2, mt: 1 }}>
                                                    <Box sx={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }} onClick={() => setShowColorPicker({ ...showColorPicker, grad2: false })} />
                                                    <SketchPicker
                                                        color={theme.gradientColors[1]}
                                                        onChange={(c) => {
                                                            const newColors = [...theme.gradientColors];
                                                            newColors[1] = c.hex;
                                                            setTheme({ ...theme, gradientColors: newColors });
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                            <TextField
                                                size="small"
                                                value={theme.gradientColors[1]}
                                                onChange={(e) => {
                                                    const newColors = [...theme.gradientColors];
                                                    newColors[1] = e.target.value;
                                                    setTheme({ ...theme, gradientColors: newColors });
                                                }}
                                                sx={{ ml: 2, width: 120 }}
                                            />
                                        </Box>
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </Paper>

                    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                        <Box display="flex" alignItems="center" mb={3}>
                            <ViewStream sx={{ mr: 1, color: '#667eea' }} />
                            <Typography variant="h6">Home Layout Manager</Typography>
                        </Box>
                        <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
                            Reorder your home screen sections. These updates are reflected instantly on the mobile app.
                        </Typography>
                        <List>
                            {(homeLayout || []).map((item, index) => (
                                <ListItem
                                    key={item.section}
                                    sx={{
                                        border: '1px solid #f0f0f0',
                                        borderRadius: 2,
                                        mb: 1.5,
                                        backgroundColor: item.enabled ? '#fff' : '#fafafa',
                                        opacity: item.enabled ? 1 : 0.6
                                    }}
                                    secondaryAction={
                                        <Box>
                                            <IconButton size="small" onClick={() => handleMoveLayout(index, 'up')} disabled={index === 0}>
                                                <ArrowUpward />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleMoveLayout(index, 'down')} disabled={index === homeLayout.length - 1}>
                                                <ArrowDownward />
                                            </IconButton>
                                            <Switch
                                                size="small"
                                                checked={item.enabled}
                                                onChange={() => toggleLayoutVisibility(index)}
                                            />
                                        </Box>
                                    }
                                >
                                    <ListItemIcon>
                                        <DragIndicator color="disabled" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>{item.section.replace('_', ' ')}</Typography>}
                                        secondary={`Order: ${index + 1}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>

                    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                        <Box display="flex" alignItems="center" mb={3}>
                            <VerifiedUser sx={{ mr: 1, color: '#667eea' }} />
                            <Typography variant="h6">Safety Shield Labels</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Label 1"
                                    variant="outlined"
                                    size="small"
                                    value={safetyShield.label1}
                                    onChange={(e) => setSafetyShield({ ...safetyShield, label1: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Label 2"
                                    variant="outlined"
                                    size="small"
                                    value={safetyShield.label2}
                                    onChange={(e) => setSafetyShield({ ...safetyShield, label2: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Label 3"
                                    variant="outlined"
                                    size="small"
                                    value={safetyShield.label3}
                                    onChange={(e) => setSafetyShield({ ...safetyShield, label3: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                        <Box display="flex" alignItems="center" mb={3}>
                            <TrendingUp sx={{ mr: 1, color: '#667eea' }} />
                            <Typography variant="h6">Featured Services (Trending)</Typography>
                        </Box>
                        <Box sx={{ maxHeight: 300, overflowY: 'auto', p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                            <Grid container spacing={1}>
                                {(services || []).map(service => (
                                    <Grid item xs={12} key={service._id}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    size="small"
                                                    checked={featuredServices.includes(service._id)}
                                                    onChange={() => handleServiceToggle(service._id)}
                                                />
                                            }
                                            label={<Typography variant="body2">{service.name}</Typography>}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Paper>

                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                            <PowerSettingsNew sx={{ mr: 1, color: maintenanceMode ? 'error.main' : 'success.main' }} />
                            <Typography variant="h6">System Status</Typography>
                        </Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={maintenanceMode}
                                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                                    color="error"
                                />
                            }
                            label={maintenanceMode ? "Maintenance Mode: ACTIVE (App Locked)" : "Maintenance Mode: INACTIVE (App Live)"}
                        />
                    </Paper>

                    <Box mt={4} display="flex" justifyContent="flex-end">
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={loading}
                            sx={{ minWidth: 200, py: 1.5, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                        >
                            {loading ? 'Saving...' : 'Deploy App Config'}
                        </Button>
                    </Box>
                </Grid>

                {/* Right Side: Preview */}
                <Grid item xs={12} md={5}>
                    <Box position="sticky" top={100}>
                        <Typography variant="h6" align="center" gutterBottom>
                            <Smartphone sx={{ verticalAlign: 'middle', mr: 1 }} />
                            Real-time Preview
                        </Typography>
                        <Card sx={{
                            width: 280,
                            height: 560,
                            mx: 'auto',
                            borderRadius: 4,
                            border: '12px solid #333',
                            position: 'relative',
                            overflow: 'hidden',
                            background: theme.backgroundType === 'gradient'
                                ? `linear-gradient(180deg, ${theme.gradientColors[0]} 0%, ${theme.gradientColors[1]} 100%)`
                                : '#fff'
                        }}>
                            {/* Mock Maintenance Screen */}
                            {maintenanceMode && (
                                <Box sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: theme.backgroundType === 'gradient' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.95)',
                                    zIndex: 10,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    p: 3,
                                    textAlign: 'center'
                                }}>
                                    <Box sx={{ p: 2, borderRadius: '50%', background: '#fff1f0', mb: 2 }}>
                                        <PowerSettingsNew color="error" sx={{ fontSize: 40 }} />
                                    </Box>
                                    <Typography variant="h6" color={theme.backgroundType === 'gradient' ? '#fff' : 'error'}>System Update</Typography>
                                    <Typography variant="caption" color={theme.backgroundType === 'gradient' ? '#ccc' : 'textSecondary'}>App is temporarily unavailable</Typography>
                                </Box>
                            )}

                            {/* Mock Content area */}
                            <Box p={2}>
                                <Box width="100%" height={120} sx={{
                                    background: theme.backgroundType === 'gradient' ? 'rgba(255,255,255,0.2)' : theme.primary,
                                    borderRadius: 2,
                                    opacity: theme.backgroundType === 'gradient' ? 1 : 0.1,
                                    mb: 2,
                                    border: theme.backgroundType === 'gradient' ? '1px solid rgba(255,255,255,0.3)' : 'none'
                                }} />
                                <Grid container spacing={1}>
                                    {[1, 2, 3, 4].map(i => (
                                        <Grid item xs={3} key={i}>
                                            <Box width="100%" height={40} sx={{
                                                background: theme.backgroundType === 'gradient' ? 'rgba(255,255,255,0.1)' : theme.secondary,
                                                borderRadius: 1,
                                                opacity: theme.backgroundType === 'gradient' ? 1 : 0.1,
                                                border: theme.backgroundType === 'gradient' ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                            }} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            {/* MOCK BOTTOM BAR */}
                            <Box sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 60,
                                background: '#fff',
                                borderTop: '1px solid #eee',
                                display: 'flex',
                                justifyContent: 'space-around',
                                alignItems: 'center',
                                px: 1
                            }}>
                                {navigation.slice(0, 5).map((item, i) => (
                                    <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Box sx={{ color: i === 0 ? theme.primary : '#999', fontSize: 20 }}>
                                            <Smartphone sx={{ fontSize: 22 }} />
                                        </Box>
                                        <Typography variant="caption" sx={{ fontSize: 9, color: i === 0 ? theme.primary : '#999', fontWeight: 600 }}>
                                            {item.label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Card>
                        <Typography variant="caption" color="textSecondary" align="center" display="block" sx={{ mt: 2 }}>
                            Mock visualization of the mobile interface.
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AppConfigManagement;
