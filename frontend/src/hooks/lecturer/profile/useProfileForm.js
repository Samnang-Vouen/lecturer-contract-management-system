import { useState } from 'react';
import toast from 'react-hot-toast';
import { sanitizeEnglish, sanitizeKhmer } from '../../../utils/profileUtils';

export function useProfileForm(initialForm, profile, setProfile) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    if (name === 'full_name_english') {
      newValue = sanitizeEnglish(value);
    } else if (name === 'full_name_khmer') {
      newValue = sanitizeKhmer(value);
    } else if (name === 'short_bio') {
      // enforce max 160 characters while typing
      newValue = String(value).slice(0, 160);
    }
    
    setForm(f => ({ ...f, [name]: newValue }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }));
  };

  const onPaste = (e) => {
    const name = e.target.name;
    if (name === 'full_name_english' || name === 'full_name_khmer' || name === 'short_bio') {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text') || '';
      const target = e.target;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const current = target.value || '';
      let cleaned;
      
      if (name === 'full_name_english') cleaned = sanitizeEnglish(paste);
      else if (name === 'full_name_khmer') cleaned = sanitizeKhmer(paste);
      else {
        // short_bio: allow any text but cap to remaining characters
        const maxAllowed = Math.max(0, 160 - (current.length - (end - start)));
        cleaned = String(paste).slice(0, maxAllowed);
      }
      
      const newVal = current.slice(0, start) + cleaned + current.slice(end);
      setForm(f => ({ ...f, [name]: newVal }));
      if (errors[name]) setErrors(er => ({ ...er, [name]: null }));
    }
  };

  return {
    form,
    setForm,
    errors,
    setErrors,
    onChange,
    onPaste
  };
}
