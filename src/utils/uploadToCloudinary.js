/**
 * Utility to upload a file directly to Cloudinary using an unsigned preset.
 * Works with browsers/web (File/Blob objects).
 * 
 * @param {File} file - The file object to upload
 * @param {Object} options - Optional upload settings (transformation, folder, etc.)
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export const uploadToCloudinary = async (file, options = {}) => {
    try {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dpqp3i1su';
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'dailydot_uploads';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        // Minimal payload for unsigned upload compliance

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Upload failed');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw error;
    }
};
