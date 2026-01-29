import { useState, useEffect } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Hook to manage phone number validation
 */
export const usePhoneValidation = (initialPhone = '') => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [phoneE164, setPhoneE164] = useState('');

  useEffect(() => {
    if (initialPhone) {
      setPhoneNumber(initialPhone.replace(/^\+/, ''));
      const digitsOnly = String(initialPhone).replace(/[^0-9+]/g, '');
      const normalized = digitsOnly.startsWith('+') ? digitsOnly : `+${digitsOnly}`;
      setPhoneE164(normalized);
    }
  }, [initialPhone]);

  const handlePhoneChange = (value) => {
    // Allow only numbers and + sign
    const cleaned = value.replace(/[^0-9+]/g, '');
    setPhoneNumber(cleaned);
    
    // Normalize to E.164
    const normalized = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    setPhoneE164(normalized);
  };

  const validatePhone = () => {
    if (!phoneE164) {
      return { valid: false, error: 'Please enter your phone number' };
    }
    
    const parsed = parsePhoneNumberFromString(phoneE164);
    if (!parsed || !parsed.isValid()) {
      return { valid: false, error: 'Please enter a valid phone number' };
    }
    
    return { valid: true, error: null };
  };

  return {
    phoneNumber,
    phoneE164,
    handlePhoneChange,
    validatePhone
  };
};
