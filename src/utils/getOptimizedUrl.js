/**
 * Optimizes a Cloudinary URL by inserting transformation parameters.
 * Default transformations: width 400px, auto quality, auto format.
 * 
 * @param {string} url - The original Cloudinary URL
 * @param {string} transformations - Cloudinary transformation string
 * @returns {string} - The optimized URL
 */
export const getOptimizedUrl = (url, transformations = 'w_400,q_auto,f_auto') => {
    if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
        return url;
    }

    // Check if it's already optimized or has transformations
    if (url.includes(transformations)) {
        return url;
    }

    // Insert transformations after '/upload/'
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex !== -1) {
        const prefix = url.substring(0, uploadIndex + 8);
        const suffix = url.substring(uploadIndex + 8);
        return `${prefix}${transformations}/${suffix}`;
    }

    return url;
};

/**
 * Specifically optimizes banner images for ultra-sharp delivery.
 * Injects: fill crop, auto-gravity, high quality, auto format, and auto DPI.
 * 
 * @param {string} url - Raw Cloudinary URL
 * @param {number} width - Measured container width (px)
 * @param {number} height - Measured container height (px)
 */
export const getBannerUrl = (url, width, height) => {
    if (!url || !url.includes('res.cloudinary.com')) return url;

    let transformations = 'c_fill,g_auto,q_auto:best,f_auto,dpr_auto';

    if (width && height) {
        transformations += `,w_${Math.round(width)},h_${Math.round(height)}`;
    } else {
        transformations += ',ar_16:9';
    }

    return url.replace('/upload/', `/upload/${transformations}/`);
};
