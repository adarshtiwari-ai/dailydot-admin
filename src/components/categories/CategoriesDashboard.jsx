// Updated CategoriesDashboard.jsx - Remove React Router dependencies

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// Remove: import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

// ✅ FIXED: Import from categoriesSlice
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../store/slices/categoriesSlice";
import { toast } from "react-toastify";

const CategoriesDashboard = ({ onViewCategory }) => {
  const dispatch = useDispatch();

  // ✅ FIXED: Use direct state access to categories slice
  const categories = useSelector((state) => state.categories.categories);
  const loading = useSelector((state) => state.categories.loading);
  const errors = useSelector((state) => state.categories.error);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    image: "",
    isComingSoon: false,
    tags: [],
    newTagName: "",
    newTagIcon: "",
    newTagFile: null,
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // ✅ ADD: Debug logging when categories update
  useEffect(() => {
    console.log("=== CATEGORIES STATE UPDATED ===");
    console.log("Number of categories:", categories?.length);
    console.log("Categories data:", categories);

    if (categories && categories.length > 0) {
      console.log("First category sample:", categories[0]);
      console.log("First category has 'id'?", "id" in categories[0]);
      console.log("First category has '_id'?", "_id" in categories[0]);
    }
  }, [categories]);

  // Auto-generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        icon: category.icon || "",
        image: category.image || "",
        isActive: category.isActive !== false,
        showOnHome: category.showOnHome !== false,
        isComingSoon: category.isComingSoon || false,
        sortOrder: category.sortOrder || 0,
        tags: category.tags || [],
        newTagName: "",
        newTagIcon: "",
        newTagFile: null,
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        icon: "",
        image: "",
        isActive: true,
        showOnHome: true,
        isComingSoon: false,
        sortOrder: 0,
        tags: [],
        newTagName: "",
        newTagIcon: "",
        newTagFile: null,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon: "",
      image: "",
      isActive: true,
      showOnHome: true,
      isComingSoon: false,
      sortOrder: 0,
      tags: [],
      newTagName: "",
      newTagIcon: "",
      newTagFile: null,
    });
  };

  // Helper to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:3000${imagePath}`;
  };



  // Tag Handlers
  const handleAddTag = () => {
    if (formData.newTagName?.trim() && formData.newTagIcon?.trim()) {
      const newTag = {
        name: formData.newTagName.trim(),
        icon: formData.newTagIcon.trim(), // Context: this will be the data URL for preview, or string if manual (not applicable here anymore)
        file: formData.newTagFile // Store the file
      };
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag],
        newTagName: "",
        newTagIcon: "",
        newTagFile: null,
      });
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, index) => index !== indexToRemove),
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({
          ...formData,
          imageFile: file,
          imagePreview: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error("Category name is required");
        return;
      }

      const categoryFormData = new FormData();
      categoryFormData.append("name", formData.name.trim());
      categoryFormData.append("slug", formData.slug.trim() || generateSlug(formData.name));
      categoryFormData.append("description", formData.description.trim());
      categoryFormData.append("isActive", formData.isActive);
      categoryFormData.append("showOnHome", formData.showOnHome);
      categoryFormData.append("isComingSoon", formData.isComingSoon);
      categoryFormData.append("sortOrder", formData.sortOrder || 0);

      // Append tags and their icons
      if (formData.tags && formData.tags.length > 0) {
        const tagsToSend = formData.tags.map((tag, index) => {
          // If it's a new tag with a file, we need to flag it.
          // However, better approach: 
          // If tag has a 'file' property, it's a new upload.
          // We'll set the icon to a placeholder that the backend recognizes: "TAG_FILE_INDEX_X"
          // where X is the index in the `tagIcons` array we are about to build.
          if (tag.file) {
            return { ...tag, icon: `TAG_FILE_INDEX_${index}` }; // Using simpler index mapping. Be careful if filtering.
          }
          return tag;
        });

        // Re-map to ensure indices align if we were to filter, but here we just map 1:1 for simplicity in this pass.
        // Actually, let's separate the files.
        const tagFiles = [];
        const finalTags = formData.tags.map(tag => {
          if (tag.file) {
            tagFiles.push(tag.file);
            // The index of this file in tagFiles array is tagFiles.length - 1
            return {
              name: tag.name,
              icon: `TAG_FILE_INDEX_${tagFiles.length - 1}`
            };
          }
          // Existing tag or tag without file (if that were possible)
          return {
            name: tag.name,
            icon: tag.icon,
            _id: tag._id, // Keep ID if existing
            id: tag.id
          };
        });

        categoryFormData.append("tags", JSON.stringify(finalTags));

        // Append files
        tagFiles.forEach((file) => {
          categoryFormData.append("tagIcons", file);
        });
      }

      // Handle Image
      if (formData.imageFile) {
        categoryFormData.append("image", formData.imageFile);
      }

      if (selectedCategory) {
        await dispatch(
          updateCategory({
            id: selectedCategory._id || selectedCategory.id,
            data: categoryFormData,
          })
        ).unwrap();
        toast.success("Category updated successfully!");
      } else {
        await dispatch(createCategory(categoryFormData)).unwrap();
        toast.success("Category created successfully!");
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(error?.message || error || "Failed to save category");
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        await dispatch(deleteCategory(id)).unwrap();
        toast.success('Category deleted successfully');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete category');
      }
    }
  };

  const handleViewCategory = (category) => {
    if (onViewCategory) {
      onViewCategory(category);
    } else {
      console.log("No view handler provided for:", category);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Categories Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
            },
          }}
        >
          Add Category
        </Button>
      </Box>

      {/* Error Display */}
      {errors && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors}
        </Alert>
      )}

      {/* Categories Grid */}
      {categories && categories.length > 0 ? (
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
              key={category._id || category.id}
            >
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                {/* Category Image */}
                {category.image ? (
                  <CardMedia
                    component="img"
                    height="160"
                    image={getImageUrl(category.image)}
                    alt={category.name}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 160,
                      backgroundColor: "grey.200",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CategoryIcon sx={{ fontSize: 48, color: "grey.500" }} />
                  </Box>
                )}

                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {category.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {category.description || "No description available"}
                  </Typography>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Chip
                      label={
                        category.isActive !== false ? "Active" : "Inactive"
                      }
                      color={
                        category.isActive !== false ? "success" : "default"
                      }
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {category.serviceCount || 0} services
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewCategory(category)}
                      sx={{ flex: 1 }}
                    >
                      View
                    </Button>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(category)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteCategory(category._id || category.id, category.name)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <CategoryIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            No categories yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create your first category to organize your services
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            Create First Category
          </Button>
        </Paper>
      )}

      {/* Category Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCategory ? "Edit Category" : "Create New Category"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Category Name"
              value={formData.name}
              onChange={handleNameChange}
              margin="normal"
              required
              helperText="This will auto-generate the slug"
            />

            <TextField
              fullWidth
              label="Slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              margin="normal"
              required
              helperText="URL-friendly name (e.g., 'home-cleaning')"
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              margin="normal"
              multiline
              rows={3}
              helperText="Brief description of the category"
            />

            {/* Image Upload UI */}
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Category Image
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 1,
                    border: '1px dashed grey',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {(formData.imagePreview || formData.image) ? (
                    <Box
                      component="img"
                      src={formData.imagePreview || formData.image}
                      alt="Category"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <CategoryIcon color="action" />
                  )}
                </Box>
                <Box>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="category-image-upload"
                    type="file"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="category-image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      size="small"
                    >
                      Upload Image
                    </Button>
                  </label>
                  {(formData.image || formData.imagePreview) && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setFormData({ ...formData, image: '', imagePreview: '', imageFile: null })}
                      sx={{ ml: 1 }}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>

            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Manage Service Tags
              </Typography>
              <Typography variant="caption" color="text.secondary" paragraph>
                Tags help group services in the mobile app.
              </Typography>

              <Box display="flex" gap={1} mb={2} alignItems="flex-start">
                <TextField
                  label="Tag Name"
                  size="small"
                  value={formData.newTagName || ""}
                  onChange={(e) => setFormData({ ...formData, newTagName: e.target.value })}
                  sx={{ flex: 1 }}
                  placeholder="e.g. Repair"
                />
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="tag-image-upload"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({
                            ...formData,
                            newTagIcon: reader.result, // Use this for preview
                            newTagFile: file // Store actual file
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label htmlFor="tag-image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      size="small"
                      startIcon={<AddIcon />}
                    >
                      {formData.newTagFile ? "Change" : "Upload Icon"}
                    </Button>
                  </label>
                  {formData.newTagIcon && (
                    <Box
                      component="img"
                      src={formData.newTagIcon}
                      alt="Tag Icon"
                      sx={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 1 }}
                    />
                  )}
                </Box>
                <Button
                  variant="contained"
                  onClick={handleAddTag}
                  disabled={!formData.newTagName?.trim() || !formData.newTagIcon}
                  sx={{ height: 40 }}
                >
                  Add
                </Button>
              </Box>

              <Box
                display="flex"
                flexWrap="wrap"
                gap={1}
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  minHeight: '50px'
                }}
              >
                {(!formData.tags || formData.tags.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', width: '100%', textAlign: 'center' }}>
                    No tags added.
                  </Typography>
                )}
                {formData.tags && formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag.name}
                    avatar={<Avatar src={tag.icon} alt={tag.name} />}
                    onDelete={() => handleRemoveTag(index)}
                    color="primary"
                    variant="outlined"
                    sx={{
                      '& .MuiChip-avatar': {
                        width: 24,
                        height: 24
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Sort Order"
              type="number"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData({ ...formData, sortOrder: e.target.value })
              }
              margin="normal"
              helperText="Display order (0 = first)"
            />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                }
                label="Active Category"
                sx={{ mt: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.showOnHome}
                    onChange={(e) =>
                      setFormData({ ...formData, showOnHome: e.target.checked })
                    }
                  />
                }
                label="Show on Home Screen"
                sx={{ mt: 2, ml: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isComingSoon}
                    onChange={(e) =>
                      setFormData({ ...formData, isComingSoon: e.target.checked })
                    }
                    color="primary"
                  />
                }
                label="Coming Soon (VIP Waitlist)"
                sx={{ mt: 2, ml: 2 }}
              />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveCategory}
            variant="contained"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesDashboard;
