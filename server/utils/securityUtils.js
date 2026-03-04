import crypto from 'crypto';

/**
 * Generate a secure random token for report access links
 * @returns {string} 64-character hexadecimal token
 */
export const generateSecureToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate a 6-digit PIN for secure report access
 * @returns {string} 6-digit PIN as string
 */
export const generatePIN = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a unique medical record number for new patients
 * @param {number} patientCount - Current count of patients
 * @returns {string} Medical record number (e.g., MRN2024001234)
 */
export const generateMRN = (patientCount) => {
    const year = new Date().getFullYear();
    return `MRN${year}${String(patientCount + 1).padStart(6, '0')}`;
};

/**
 * Validate 6-digit PIN format
 * @param {string} pin - PIN to validate
 * @returns {boolean} True if valid 6-digit PIN
 */
export const validatePIN = (pin) => {
    return /^\d{6}$/.test(pin);
};

/**
 * Validate secure token format
 * @param {string} token - Token to validate
 * @returns {boolean} True if valid 64-character hex token
 */
export const validateToken = (token) => {
    return /^[a-f0-9]{64}$/.test(token);
};

/**
 * Generate secure download URL for report
 * @param {string} secureToken - Secure token of the report
 * @param {string} baseURL - Base URL of the application
 * @returns {string} Full secure URL
 */
export const generateSecureURL = (secureToken, baseURL = 'http://localhost:5173') => {
    return `${baseURL}/secure-report/${secureToken}`;
};
