import React, { useState, useEffect } from "react";
import axiosInstance from "../services/api.service";
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
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Switch,
    Alert
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";

const ProfessionalsManagement = () => {
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [currentPro, setCurrentPro] = useState(null);
    const [formData, setFormData] = useState({ name: "", isActive: true });
    const [updateLoading, setUpdateLoading] = useState(false);

    const fetchProfessionals = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/professionals");
            setProfessionals(response.data.professionals || []);
            setError(null);
        } catch (err) {
            console.error("Error fetching professionals:", err);
            setError("Failed to load professionals.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfessionals();
    }, []);

    const handleEditClick = (pro) => {
        setCurrentPro(pro);
        setFormData({
            name: pro.name,
            isActive: pro.isActive
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentPro(null);
    };

    const handleUpdate = async () => {
        if (!currentPro) return;

        try {
            setUpdateLoading(true);
            await axiosInstance.put(`/professionals/${currentPro._id}`, formData);

            // Update local state to reflect changes immediately
            setProfessionals(prev =>
                prev.map(p => p._id === currentPro._id ? { ...p, ...formData } : p)
            );

            handleCloseDialog();
        } catch (err) {
            console.error("Error updating professional:", err);
            alert("Failed to update professional.");
        } finally {
            setUpdateLoading(false);
        }
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
            <Typography variant="h4" sx={{ mb: 3 }}>
                Professionals Management
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Card>
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        All Professionals ({professionals.length})
                    </Typography>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                    <TableCell><strong>Name</strong></TableCell>
                                    <TableCell><strong>Phone</strong></TableCell>
                                    <TableCell align="center"><strong>Total Bookings</strong></TableCell>
                                    <TableCell align="center"><strong>Avg Rating</strong></TableCell>
                                    <TableCell align="center"><strong>Status</strong></TableCell>
                                    <TableCell align="center"><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {professionals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            No professionals found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    professionals.map((pro) => (
                                        <TableRow key={pro._id} hover>
                                            <TableCell>{pro.name}</TableCell>
                                            <TableCell>{pro.phone}</TableCell>
                                            <TableCell align="center">{pro.totalBookings || 0}</TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={pro.averageRating ? pro.averageRating.toFixed(1) : "N/A"}
                                                    color={pro.averageRating > 4 ? "success" : "default"}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={pro.isActive ? "Active" : "Inactive"}
                                                    color={pro.isActive ? "success" : "error"}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton onClick={() => handleEditClick(pro)} size="small">
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Edit Professional</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            sx={{ mb: 3 }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    color="success"
                                />
                            }
                            label={formData.isActive ? "Active Account" : "Inactive Account"}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleUpdate}
                        variant="contained"
                        disabled={updateLoading || !formData.name}
                    >
                        {updateLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProfessionalsManagement;
