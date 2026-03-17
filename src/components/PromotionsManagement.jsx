import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Modal, TextField, 
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Chip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { promotionsAPI } from '../services/api'; // Adjust path if needed

const modalStyle = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 400, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 24, p: 4,
};

const PromotionsManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'percentage', value: '', isUniversal: true, isActive: true
  });

  // Fetch Discounts on Load
  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const response = await promotionsAPI.getAll();
      setPromotions(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch promotions", error);
    }
  };

  const handleCreate = async () => {
    try {
      await promotionsAPI.create({
        ...formData,
        value: Number(formData.value)
      });
      setOpen(false);
      loadPromotions(); // Refresh table
      setFormData({ name: '', type: 'percentage', value: '', isUniversal: true, isActive: true });
    } catch (error) {
      console.error("Failed to create promotion", error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Promotions & Billing</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Create Discount
        </Button>
      </Box>

      {/* Promotions Data Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Type</b></TableCell>
              <TableCell><b>Value</b></TableCell>
              <TableCell><b>Scope</b></TableCell>
              <TableCell><b>Status</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {promotions.map((promo) => (
              <TableRow key={promo._id}>
                <TableCell>{promo.name}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{promo.type}</TableCell>
                <TableCell>
                  {promo.type === 'percentage' ? `${promo.value}%` : `₹${promo.value}`}
                </TableCell>
                <TableCell>
                  <Chip size="small" label={promo.isUniversal ? "Universal" : "Specific Services"} color={promo.isUniversal ? "primary" : "default"} />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={promo.isActive ? "Active" : "Disabled"} color={promo.isActive ? "success" : "error"} />
                </TableCell>
              </TableRow>
            ))}
            {promotions.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center">No promotions found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Promotion Modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2} fontWeight="bold">Create New Discount</Typography>
          
          <TextField fullWidth label="Discount Name (e.g., Diwali Special)" margin="normal" 
            value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} 
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Discount Type</InputLabel>
            <Select value={formData.type} label="Discount Type"
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <MenuItem value="percentage">Percentage (%)</MenuItem>
              <MenuItem value="flat">Flat Amount (₹)</MenuItem>
            </Select>
          </FormControl>
          
          <TextField fullWidth label="Value" type="number" margin="normal" 
            value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} 
          />
          
          <FormControlLabel sx={{ mt: 1 }}
            control={<Switch checked={formData.isUniversal} onChange={(e) => setFormData({...formData, isUniversal: e.target.checked})} />}
            label="Universal (Applies to all services)"
          />

          <Button fullWidth variant="contained" sx={{ mt: 3, py: 1.5 }} onClick={handleCreate} disabled={!formData.name || !formData.value}>
            Generate Discount
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default PromotionsManagement;
