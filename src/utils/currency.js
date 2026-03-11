/**
 * Utility to format raw Paise amounts from the backend into standard Rupees (₹)
 * 
 * @param {number|string} amountInPaise - The integer amount in Paise
 * @returns {string} - The formatted string, e.g., "150.00"
 */
export const formatCurrency = (amountInPaise) => {
    if (amountInPaise === null || amountInPaise === undefined || isNaN(amountInPaise)) {
        return "0.00";
    }
    return (Number(amountInPaise) / 100).toFixed(2);
};
