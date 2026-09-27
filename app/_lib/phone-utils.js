/**
 * Strips all non-numeric characters from a string.
 * Use this BEFORE saving to your database (e.g., '1234567890')
 */
export const cleanPhoneNumber = (value) => {
  if (!value) return '';
  return value.replace(/[^\d]/g, '');
};

/**
 * Validates if the cleaned phone number is exactly 10 digits.
 */
export const isValidPhoneNumber = (value) => {
  const cleaned = cleanPhoneNumber(value);
  return cleaned.length === 10;
};

/**
 * Formats a raw string into a standard (XXX) XXX-XXXX format.
 * Ideal for formatting raw database values for view/display.
 */
export const formatPhoneForView = (value) => {
  const cleaned = cleanPhoneNumber(value);

  // Handle standard 10-digit US/CA numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Handle 11-digit numbers starting with country code 1
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Fallback: return the original value if it's an unusual format (e.g., international)
  return value || 'N/A';
};

/**
 * Formats a string dynamically as the user types.
 * Ideal for controlled <input> fields.
 */
export const formatPhoneForInput = (value) => {
  if (!value) return value;

  const phoneNumber = cleanPhoneNumber(value);
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength < 4) return phoneNumber;

  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }

  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};
