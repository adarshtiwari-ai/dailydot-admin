import React, { useState, useEffect } from "react";
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
  Button,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip
} from "@mui/material";
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  Category as CategoryIcon,
  Engineering as ServiceIcon
} from "@mui/icons-material";
import { waitlistAPI, apiUtils } from "../services/api";

const WaitlistManagement = () => {
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDemands = async () => {
    try {
      setLoading(true);
      const response = await waitlistAPI.getAll();
      if (response.data && response.data.success) {
        setDemands(response.data.data);
      }
      setError(null);
    } catch (err) {
      setError(apiUtils.formatError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemands();
  }, []);

  const filteredDemands = demands.filter((d) => {
    return (
      !searchTerm ||
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone?.includes(searchTerm) ||
      d.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const downloadCSV = () => {
    if (demands.length === 0) return;

    const headers = ["Date", "Name", "Phone", "Category", "Service", "Location"];
    const rows = demands.map((d) => [
      new Date(d.createdAt).toLocaleString(),
      d.name,
      d.phone,
      d.categoryName,
      d.serviceName,
      d.location || "Mandla"
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `waitlist_demands_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Waitlist Demands (Demand Center)</Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={downloadCSV}
          disabled={demands.length === 0}
        >
          Download CSV
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by name, phone, service or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell><strong>Date & Time</strong></TableCell>
                  <TableCell><strong>User Details</strong></TableCell>
                  <TableCell><strong>Target Service</strong></TableCell>
                  <TableCell><strong>Category</strong></TableCell>
                  <TableCell><strong>Location</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDemands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No demand entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDemands.map((demand) => (
                    <TableRow key={demand._id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ScheduleIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {new Date(demand.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{demand.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{demand.phone}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ServiceIcon fontSize="small" color="primary" />
                          <Typography variant="body2">{demand.serviceName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CategoryIcon fontSize="small" color="action" />
                          <Typography variant="body2">{demand.categoryName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={demand.location || "Mandla"} size="small" color="secondary" variant="outlined" />
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

export default WaitlistManagement;
