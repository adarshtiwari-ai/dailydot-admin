// src/components/AnalyticsDashboard.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Assignment as BookingIcon,
  People as UsersIcon,
  Assessment as AnalyticsIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { analyticsAPI } from "../services/api";

// Import the Redux actions
import {
  fetchAnalyticsData,
  calculateRevenueTrends,
  selectAnalyticsRawData,
  selectAnalyticsMetrics,
  selectAnalyticsCharts,
  selectAnalyticsLoading,
  selectAnalyticsError,
} from "../store/slices/analyticsSlice";

const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const rawData = useSelector(selectAnalyticsRawData);
  const metrics = useSelector(selectAnalyticsMetrics);
  const charts = useSelector(selectAnalyticsCharts);
  const loading = useSelector(selectAnalyticsLoading);
  const error = useSelector(selectAnalyticsError);

  const [tabValue, setTabValue] = useState(0);
  const [timePeriod, setTimePeriod] = useState(30);
  const [overviewData, setOverviewData] = useState(null);

  // Fetch analytics data when component loads
  useEffect(() => {
    dispatch(fetchAnalyticsData());
    
    // Also fetch the real growth/overview data from our new backend math
    const loadOverview = async () => {
      try {
        const response = await analyticsAPI.getOverview();
        if (response.data.success) {
          setOverviewData(response.data);
        }
      } catch (err) {
        console.error("Failed to load overview analytics:", err);
      }
    };
    loadOverview();
  }, [dispatch]);

  // Calculate revenue trends when data is loaded
  useEffect(() => {
    if (rawData.bookings && rawData.bookings.length > 0) {
      dispatch(calculateRevenueTrends(timePeriod));
    }
  }, [dispatch, rawData.bookings, timePeriod]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  // Main metrics cards
  const metricsCards = [
    {
      title: "Total GMV",
      value: `₹${((overviewData?.totalGMV || 0) / 100).toLocaleString()}`,
      icon: MoneyIcon,
      color: "#4caf50",
      growth: overviewData?.growth?.gmv || 0,
    },
    {
      title: "Total Profit",
      value: `₹${((overviewData?.totalProfit || 0) / 100).toLocaleString()}`,
      icon: TrendingUpIcon,
      color: "#9c27b0",
      growth: overviewData?.growth?.profit || 0,
    },
    {
      title: "Total Users",
      value: (overviewData?.userCount || 0).toLocaleString(),
      icon: UsersIcon,
      color: "#2196f3",
      growth: overviewData?.growth?.users || 0,
    },
    {
      title: "Active Providers",
      value: (overviewData?.providerCount || 0).toLocaleString(),
      icon: BookingIcon,
      color: "#ff9800",
      growth: 0,
    },
  ];

  // Show loading spinner
  if (loading.data) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading analytics data...</Typography>
      </Box>
    );
  }

  // Show error if any
  if (error.data) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading analytics data: {error.data}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Analytics Dashboard
      </Typography>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metricsCards.map((metric, index) => (
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
                      {metric.title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                      {metric.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={metric.growth >= 0 ? "success.main" : "error.main"}
                      sx={{ mt: 1, display: "flex", alignItems: "center" }}
                    >
                      {metric.growth >= 0 ? "+" : ""}{metric.growth}% from last 30d
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 3,
                      backgroundColor: metric.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <metric.icon fontSize="large" />
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs for different analytics views */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Overview" icon={<AnalyticsIcon />} />
          <Tab label="Revenue Trends" icon={<TimelineIcon />} />
          <Tab label="Booking Status" icon={<PieChartIcon />} />
          <Tab label="Top Services" icon={<BarChartIcon />} />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Business Health Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Business Health
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2">Completion Rate</Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {metrics.completionRate?.toFixed(1) || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.completionRate || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2">
                      Customer Satisfaction
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      92%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={92}
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2">Service Quality</Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      88%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={88}
                    color="warning"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Quick Stats Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Quick Stats
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box
                      textAlign="center"
                      sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}
                    >
                      <Typography
                        variant="h4"
                        color="primary.main"
                        sx={{ fontWeight: "bold" }}
                      >
                        {rawData.categories.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Service Categories
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      textAlign="center"
                      sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}
                    >
                      <Typography
                        variant="h4"
                        color="secondary.main"
                        sx={{ fontWeight: "bold" }}
                      >
                        {rawData.services.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Services
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      textAlign="center"
                      sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}
                    >
                      <Typography
                        variant="h4"
                        color="success.main"
                        sx={{ fontWeight: "bold" }}
                      >
                        {charts.bookingStatusDistribution.find(
                          (s) => s.status === "completed"
                        )?.count || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed Today
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      textAlign="center"
                      sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}
                    >
                      <Typography
                        variant="h4"
                        color="warning.main"
                        sx={{ fontWeight: "bold" }}
                      >
                        {charts.bookingStatusDistribution.find(
                          (s) => s.status === "pending"
                        )?.count || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending Bookings
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <Typography variant="h6">Revenue Trends</Typography>
              <FormControl size="small">
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  label="Time Period"
                >
                  <MenuItem value={7}>Last 7 days</MenuItem>
                  <MenuItem value={30}>Last 30 days</MenuItem>
                  <MenuItem value={90}>Last 90 days</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {loading.revenue ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : charts.revenueData.length > 0 ? (
              <Box sx={{ height: 350, width: "100%", mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="formattedDate" 
                      tick={{ fontSize: 12 }}
                      interval="auto"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `₹${value / 100 >= 1000 ? (value / 100000).toFixed(1) + 'k' : value / 100}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`₹${(value / 100).toLocaleString()}`, "Revenue"]}
                      labelStyle={{ fontWeight: "bold" }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#667eea" 
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Revenue (₹)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No revenue data available for the selected period
              </Typography>
            )}
          </Box>
        </Card>
      )}

      {tabValue === 2 && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Booking Status Distribution
            </Typography>

            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.bookingStatusDistribution}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={5}
                        label={({ status, percentage }) => `${status}: ${percentage}%`}
                      >
                        {charts.bookingStatusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Count</strong></TableCell>
                        <TableCell><strong>Percentage</strong></TableCell>
                        <TableCell><strong>Progress</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {charts.bookingStatusDistribution.map((status) => (
                        <TableRow key={status.status}>
                          <TableCell>
                            <Chip
                              label={status.status.toUpperCase()}
                              size="small"
                              color={
                                status.status === "completed"
                                  ? "success"
                                  : status.status === "pending"
                                    ? "warning"
                                    : status.status === "cancelled"
                                      ? "error"
                                      : "info"
                              }
                            />
                          </TableCell>
                          <TableCell>{status.count}</TableCell>
                          <TableCell>{status.percentage}%</TableCell>
                          <TableCell>
                            <Box sx={{ width: "100px" }}>
                              <LinearProgress
                                variant="determinate"
                                value={parseFloat(status.percentage)}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        </Card>
      )}

      {tabValue === 3 && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Top Performing Services
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Service Name</strong></TableCell>
                    <TableCell><strong>Total Bookings</strong></TableCell>
                    <TableCell><strong>Total Revenue</strong></TableCell>
                    <TableCell><strong>Avg Revenue</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {charts.topServices.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              backgroundColor: "primary.main",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              mr: 2,
                            }}
                          >
                            {index + 1}
                          </Box>
                          {service.serviceName}
                        </Box>
                      </TableCell>
                      <TableCell>{service.bookings}</TableCell>
                      <TableCell>₹{service.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        ₹
                        {service.bookings > 0
                          ? Math.round(service.revenue / service.bookings).toLocaleString()
                          : 0}
                      </TableCell>
                    </TableRow>
                  ))}
                  {charts.topServices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No service data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default AnalyticsDashboard;
