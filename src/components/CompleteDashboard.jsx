import UsersManagement from "./UsersManagement";
import SettingsPage from "./SettingsPage";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ReviewsManagement from "./ReviewsManagement";
import PaymentsManagement from "./PaymentsManagement";
import BookingsManagement from "./BookingsManagement";
import BannersManagement from "./banners/BannersManagement";
import TopBookedManagement from "./services/TopBookedManagement";
import CarOnWheelsManagement from "./services/CarOnWheelsManagement";
import DecorGuruManagement from "./services/DecorGuruManagement";
import ProfessionalsManagement from "./ProfessionalsManagement";
import AppConfigManagement from "./AppConfigManagement";
import TrendingServicesManager from "./services/TrendingServicesManager";
import ProviderLedger from "./ProviderLedger";
import PushNotificationsManagement from "./PushNotificationsManagement";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Badge,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Grid,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Build as ServicesIcon,
  Event as BookingsIcon,
  People as UsersIcon,
  Payment as PaymentsIcon,
  Star as ReviewsIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout as LogoutIcon,
  TrendingUp,
  AttachMoney,
  Assignment,
  ViewCarousel as BannersIcon,
  Handyman as QuickFixIcon,
  StarOutline as TopBookedIcon,
  DirectionsCar as CarIcon,
  Weekend as DecorIcon,
  Smartphone as AppConfigIcon,
  AccountBalanceWallet as LedgerIcon
} from "@mui/icons-material";
import {
  selectDashboardStats,
  selectRecentBookings,
  selectRevenueChart,
  selectServiceDistribution,
  fetchDashboardStats,
  fetchRecentBookings,
  fetchRevenueChart,
  fetchServiceDistribution,
} from "../store/slices/dashboardSlice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { logoutAdmin, selectUser } from "../store/slices/authSlice";
import CategoriesDashboard from "./categories/CategoriesDashboard";
import CategoryServicesManagement from "./categories/CategoryServicesManagement";

const drawerWidth = 260;

const menuItems = [
  { text: "Dashboard", icon: DashboardIcon, value: "dashboard" },
  { text: "Categories", icon: ServicesIcon, value: "categories" },
  { text: "Bookings", icon: BookingsIcon, value: "bookings" },
  { text: "Users", icon: UsersIcon, value: "users" },
  { text: "Payments", icon: PaymentsIcon, value: "payments" },
  { text: "Reviews", icon: ReviewsIcon, value: "reviews" },
  { text: "Analytics", icon: AnalyticsIcon, value: "analytics" },
  { text: "Settings", icon: SettingsIcon, value: "settings" },
  { text: "Banners", icon: BannersIcon, value: "banners" },
  { text: "Top Booked", icon: TopBookedIcon, value: "top-booked" },
  { text: "Car on Wheels", icon: CarIcon, value: "car-on-wheels" },
  { text: "Decor Guru", icon: DecorIcon, value: "decor-guru" },
  { text: "Professionals", icon: Assignment, value: "professionals" },
  { text: "App Config", icon: AppConfigIcon, value: "app-config" },
  { text: "Trending", icon: TrendingUp, value: "trending-services" },
  { text: "Provider Ledger", icon: LedgerIcon, value: "provider-ledger" },
  { text: "Push Notifications", icon: NotificationsIcon, value: "push-notifications" },
];

const StatCard = ({ title, value, growth, icon: StatIcon, color = "#3498db" }) => ( // eslint-disable-line no-unused-vars
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography
            variant="h4"
            component="div"
            sx={{ color: "#2c3e50", fontWeight: "bold" }}
          >
            {value}
          </Typography>
          {growth && (
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUp sx={{ fontSize: 16, mr: 0.5, color: "#27ae60" }} />
              <Typography
                variant="body2"
                sx={{ color: "#27ae60", fontSize: "12px" }}
              >
                +{growth}% from last month
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: "10px",
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <StatIcon />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "success";
    case "in progress":
      return "info";
    case "pending":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

const DashboardContent = () => {
  const dispatch = useDispatch();
  const stats = useSelector(selectDashboardStats);
  const recentBookings = useSelector(selectRecentBookings);
  const revenueData = useSelector(selectRevenueChart);
  const serviceDistribution = useSelector(selectServiceDistribution);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchRecentBookings(5));
    dispatch(fetchRevenueChart("6months"));
    dispatch(fetchServiceDistribution());
  }, [dispatch]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings?.toLocaleString() || "0"}
            growth={stats.bookingGrowth}
            icon={Assignment}
            color="#3498db"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue?.toLocaleString() || "0"}`}
            growth={stats.revenueGrowth}
            icon={AttachMoney}
            color="#27ae60"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers?.toLocaleString() || "0"}
            growth={stats.userGrowth}
            icon={UsersIcon}
            color="#f39c12"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Services"
            value={stats.activeServices?.toLocaleString() || "0"}
            growth={stats.serviceGrowth}
            icon={ServicesIcon}
            color="#9b59b6"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Revenue Trend
              </Typography>
              <Box
                sx={{
                  height: 200,
                  background: `linear-gradient(45deg, #f8f9fa 25%, transparent 25%),
                              linear-gradient(-45deg, #f8f9fa 25%, transparent 25%),
                              linear-gradient(45deg, transparent 75%, #f8f9fa 75%),
                              linear-gradient(-45deg, transparent 75%, #f8f9fa 75%)`,
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  border: "2px dashed #ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#7f8c8d",
                  fontSize: "14px",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3498db" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Service Distribution
              </Typography>
              <Box
                sx={{
                  height: 200,
                  background: `linear-gradient(45deg, #f8f9fa 25%, transparent 25%),
                              linear-gradient(-45deg, #f8f9fa 25%, transparent 25%),
                              linear-gradient(45deg, transparent 75%, #f8f9fa 75%),
                              linear-gradient(-45deg, transparent 75%, #f8f9fa 75%)`,
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  border: "2px dashed #ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#7f8c8d",
                  fontSize: "14px",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {serviceDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Bookings Table */}
      <Card>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
          }}
        >
          <Typography variant="h6">Recent Bookings</Typography>
          <Box>
            <Button variant="outlined" size="small" sx={{ mr: 1 }}>
              Export
            </Button>
            <Button variant="contained" size="small">
              View All
            </Button>
          </Box>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <TableRow key={booking._id || booking.id} hover>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {booking.bookingNumber}
                    </TableCell>
                    <TableCell>{booking.serviceId?.name}</TableCell>
                    <TableCell>{booking.userId?.name}</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      ${booking.totalAmount}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={booking.status}
                        color={getStatusColor(booking.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(booking.scheduledDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        sx={{ mr: 1, minWidth: "auto", p: 0.5 }}
                      >
                        👁️
                      </Button>
                      <Button size="small" sx={{ minWidth: "auto", p: 0.5 }}>
                        ✏️
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // Fallback data if Redux data is not available
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="textSecondary">
                      No recent bookings found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

const CompleteDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [anchorEl, setAnchorEl] = useState(null);

  // Add state for category navigation
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logoutAdmin());
    handleProfileMenuClose();
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setSelectedCategory(null); // Reset selected category when changing views
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Add handler for category view
  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setCurrentView("category-services");
  };

  // Add handler to go back to categories
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCurrentView("categories");
  };

  const getPageTitle = (view) => {
    const titles = {
      dashboard: "Dashboard",
      categories: "Categories Management",
      "category-services": selectedCategory
        ? `${selectedCategory.name} Services`
        : "Category Services",
      bookings: "Bookings Management",
      users: "User Management",
      payments: "Payment Management",
      reviews: "Review Management",
      analytics: "Analytics",
      settings: "Settings",
      banners: "Banners Management",
      "top-booked": "Top Booked Services",
      "car-on-wheels": "Car on Wheels Management",
      "decor-guru": "Decor Guru Management",
      professionals: "Professionals Management",
      "app-config": "App Mobile Configuration",
      "trending-services": "Trending Services Management",
      "provider-ledger": "Provider Ledger & Settlements",
      "push-notifications": "Push Notification Broadcast",
    };
    return titles[view] || "Dashboard";
  };

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardContent />;

      case "categories":
        return <CategoriesDashboard onViewCategory={handleViewCategory} />;

      case "category-services":
        return (
          <CategoryServicesManagement
            category={selectedCategory}
            onBack={handleBackToCategories}
          />
        );

      case "bookings":
        return <BookingsManagement />;

      case "users":
        return <UsersManagement />;

      case "payments":
        return <PaymentsManagement />;

      case "reviews":
        return <ReviewsManagement />;

      case "analytics":
        return <AnalyticsDashboard />;

      case "settings":
        return <SettingsPage />;

      case "banners":
        return <BannersManagement />;

      case "top-booked":
        return <TopBookedManagement />;

      case "car-on-wheels":
        return <CarOnWheelsManagement />;

      case "decor-guru":
        return <DecorGuruManagement />;

      case "professionals":
        return <ProfessionalsManagement />;

      case "app-config":
        return <AppConfigManagement />;

      case "trending-services":
        return <TrendingServicesManager />;

      case "provider-ledger":
        return <ProviderLedger />;

      case "push-notifications":
        return <PushNotificationsManagement />;

      default:
        return <DashboardContent />;
    }
  };

  const drawer = (
    <Box>
      <Box
        sx={{
          p: 2.5,
          textAlign: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 0.5 }}>
          Dailydot
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Admin Dashboard
        </Typography>
      </Box>
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={
                  currentView === item.value ||
                  (currentView === "category-services" &&
                    item.value === "categories")
                }
                onClick={() => handleViewChange(item.value)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  "&.Mui-selected": {
                    backgroundColor: "rgba(102, 126, 234, 0.1)",
                    borderLeft: "3px solid #667eea",
                    "&:hover": {
                      backgroundColor: "rgba(102, 126, 234, 0.15)",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      currentView === item.value ||
                        (currentView === "category-services" &&
                          item.value === "categories")
                        ? "#667eea"
                        : "inherit",
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    "& .MuiListItemText-primary": {
                      color:
                        currentView === item.value ||
                          (currentView === "category-services" &&
                            item.value === "categories")
                          ? "#667eea"
                          : "inherit",
                      fontWeight:
                        currentView === item.value ||
                          (currentView === "category-services" &&
                            item.value === "categories")
                          ? 600
                          : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: "white",
          color: "#2c3e50",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            {getPageTitle(currentView)}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TextField
              placeholder="Search..."
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "20px",
                  width: "250px",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <IconButton>
              <Badge badgeContent={5} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton onClick={handleProfileMenuOpen}>
              <Avatar sx={{ width: 35, height: 35, background: "#3498db" }}>
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: "#f5f7fa",
          minHeight: "100vh",
        }}
      >
        {renderContent()}
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CompleteDashboard;
