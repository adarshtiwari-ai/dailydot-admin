import React, { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Modal, TextField,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  Chip, Grid, Autocomplete, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import { promotionsAPI, servicesAPI } from '../services/api';

const modalStyle = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 700, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4,
  maxHeight: '90vh', overflowY: 'auto'
};

const PromotionsManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [services, setServices] = useState([]);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: '',
    maxDiscountAmount: '',
    bannerImage: '',
    imageFile: null,
    imagePreview: '',
    isUniversal: true,
    applicableServices: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true
  });

  useEffect(() => {
    loadPromotions();
    loadServices();
  }, []);

  const loadPromotions = async () => {
    try {
      const response = await promotionsAPI.getAll();
      setPromotions(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch promotions", error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await servicesAPI.getAll();
      setServices(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch services", error);
    }
  };

  const handleOpen = (promo = null) => {
    if (promo) {
      setIsEditing(true);
      setSelectedId(promo._id);
      setFormData({
        ...promo,
        value: promo.value.toString(),
        maxDiscountAmount: promo.maxDiscountAmount ? promo.maxDiscountAmount.toString() : '',
        bannerImage: promo.bannerImage || '',
        imagePreview: promo.bannerImage || '',
        imageFile: null,
        isUniversal: promo.isUniversal ?? true,
        applicableServices: promo.applicableServices || []
      });
    } else {
      setIsEditing(false);
      setFormData({
        name: '', code: '', type: 'percentage', value: '', maxDiscountAmount: '',
        bannerImage: '', imageFile: null, imagePreview: '', isUniversal: true, applicableServices: [],
        startDate: new Date().toISOString().split('T')[0], endDate: '', isActive: true
      });
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      let finalBannerUrl = formData.bannerImage;

      // Handle Image Upload if a file is selected
      if (formData.imageFile) {
        // 1. Compress Image
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true
        };
        try {
          const compressedFile = await imageCompression(formData.imageFile, options);
          // 2. Upload to Cloudinary
          finalBannerUrl = await uploadToCloudinary(compressedFile);
        } catch (uploadErr) {
          console.error("Image Processing Failed:", uploadErr);
          alert("Failed to upload image. Using fallback URL.");
        }
      }

      const payload = {
        ...formData,
        bannerImage: finalBannerUrl,
        code: formData.code.toUpperCase().trim(),
        value: Number(formData.value),
        maxDiscountAmount: Number(formData.maxDiscountAmount) || 0,
        applicableServices: formData.isUniversal ? [] : formData.applicableServices.map(s => s._id || s)
      };

      if (isEditing) {
        await promotionsAPI.update(selectedId, payload);
      } else {
        await promotionsAPI.create(payload);
      }

      setOpen(false);
      loadPromotions();
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this promotion?")) {
      try {
        await promotionsAPI.delete(id);
        loadPromotions();
      } catch (error) {
        console.error("Delete failed", error);
      }
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="800" color="#1e293b">Promotions Engine</Typography>
          <Typography variant="body2" color="textSecondary">Manage universal and service-specific discounts</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{ borderRadius: 2, px: 3, py: 1.2, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
        >
          Create New Campaign
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell><b>Campaign & Code</b></TableCell>
              <TableCell><b>Value</b></TableCell>
              <TableCell><b>Scope</b></TableCell>
              <TableCell><b>Validity</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell align="right"><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {promotions.map((promo) => (
              <TableRow key={promo._id} hover>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">{promo.name}</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#e2e8f0', px: 0.5, borderRadius: 0.5 }}>
                    {promo.code}
                  </Typography>
                  {promo.bannerImage && (
                    <Tooltip title="Has Banner Image">
                      <ImageIcon sx={{ fontSize: 14, ml: 1, color: '#64748b', verticalAlign: 'middle' }} />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="600">
                    {promo.type === 'percentage' ? `${promo.value}%` : `₹${promo.value}`}
                  </Typography>
                  {promo.maxDiscountAmount > 0 && (
                    <Typography variant="caption" color="textSecondary">Capped at ₹{promo.maxDiscountAmount}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={promo.isUniversal ? "Universal" : `${promo.applicableServices?.length} Services`}
                    variant="outlined"
                    color={promo.isUniversal ? "primary" : "secondary"}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" display="block">
                    Start: {new Date(promo.startDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" display="block" color={promo.endDate ? "inherit" : "textSecondary"}>
                    End: {promo.endDate ? new Date(promo.endDate).toLocaleDateString() : 'No expiry'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={promo.isActive ? "Active" : "Paused"}
                    sx={{ bgcolor: promo.isActive ? '#dcfce7' : '#fee2e2', color: promo.isActive ? '#166534' : '#991b1b', fontWeight: 'bold' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => handleOpen(promo)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(promo._id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h5" mb={3} fontWeight="800" color="#1e293b">
            {isEditing ? 'Edit Promotion' : 'Launch New Campaign'}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Campaign Name" placeholder="e.g. Diwali Flash Sale"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Promo Code" placeholder="e.g. DIWALI50"
                value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                inputProps={{ style: { textTransform: 'uppercase', fontFamily: 'monospace' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={formData.type} label="Type" onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                  <MenuItem value="flat">Flat Amount (₹)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Value" type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max Cap (₹)"
                type="number"
                disabled={formData.type !== 'percentage'}
                value={formData.maxDiscountAmount}
                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mt: 1, p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" gutterBottom color="#475569">Campaign Banner Image</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  {formData.imagePreview ? (
                    <Box
                      component="img"
                      src={formData.imagePreview}
                      sx={{ width: 120, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #cbd5e1' }}
                    />
                  ) : (
                    <Box sx={{ width: 120, height: 60, bgcolor: '#e2e8f0', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon sx={{ color: '#94a3b8' }} />
                    </Box>
                  )}
                  <Box>
                    <Button variant="outlined" component="label" size="small" sx={{ textTransform: 'none' }}>
                      {formData.imagePreview ? 'Change Image' : 'Upload Banner'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setFormData({
                              ...formData,
                              imageFile: file,
                              imagePreview: URL.createObjectURL(file)
                            });
                          }
                        }}
                      />
                    </Button>
                    <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 0.5 }}>
                      Recommended: 1200x600px (Max 1MB)
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }}
                value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="End Date (Optional)" type="date" InputLabelProps={{ shrink: true }}
                value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <FormControlLabel
                  control={<Switch checked={formData.isUniversal} onChange={(e) => setFormData({ ...formData, isUniversal: e.target.checked })} />}
                  label={<Typography variant="subtitle2">Make this a Universal Discount</Typography>}
                />

                {!formData.isUniversal && (
                  <Box sx={{ mt: 2 }}>
                    <Autocomplete
                      multiple
                      options={services}
                      getOptionLabel={(option) => option.name}
                      value={services.filter(s => formData.applicableServices.some(as => (as._id || as) === (s._id || s)))}
                      onChange={(event, newValue) => setFormData({ ...formData, applicableServices: newValue })}
                      renderInput={(params) => (
                        <TextField {...params} label="Select Applicable Services" placeholder="Search services..." />
                      )}
                    />
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button fullWidth variant="outlined" onClick={() => setOpen(false)} sx={{ borderRadius: 2, py: 1.5 }}>Cancel</Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={!formData.name || !formData.code || !formData.value}
              sx={{ borderRadius: 2, py: 1.5, bgcolor: '#2563eb' }}
            >
              {isEditing ? 'Save Changes' : 'Launch Campaign'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default PromotionsManagement;
