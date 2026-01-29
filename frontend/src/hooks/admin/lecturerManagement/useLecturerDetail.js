import { useState } from 'react';
import toast from 'react-hot-toast';
import { getLecturerDetail } from '../../../services/lecturer.service';
import { useMemo, useCallback } from 'react';

export function useLecturerDetail() {
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [dialogReadonly, setDialogReadonly] = useState(false);
  const [editTab, setEditTab] = useState('basic');

  // Extract bio from various API response shapes
  const extractBio = useCallback((rawObj) => {
    try {
      const candidates = [
        rawObj,
        rawObj?.data,
        rawObj?.profile,
        rawObj?.lecturer_profile,
        rawObj?.data?.profile,
      ];
      const keys = ['qualifications', 'bio', 'about_me', 'short_bio', 'description', 'about', 'summary'];
      
      for (const container of candidates) {
        if (!container) continue;
        for (const k of keys) {
          const v = container[k];
          if (v !== undefined && v !== null) {
            const s = String(v).trim();
            if (s) return s;
          }
        }
      }
      
      // Deep scan fallback
      const seen = new Set();
      const matchKey = (k) => /bio|qualif|about|summary|desc/i.test(String(k));
      const dfs = (obj, depth = 0) => {
        if (!obj || typeof obj !== 'object' || depth > 4 || seen.has(obj)) return '';
        seen.add(obj);
        
        if (Array.isArray(obj)) {
          for (const item of obj) {
            const r = dfs(item, depth + 1);
            if (r) return r;
          }
          return '';
        }
        
        for (const [k, v] of Object.entries(obj)) {
          try {
            if (matchKey(k) && (typeof v === 'string' || typeof v === 'number')) {
              const s = String(v).trim();
              if (s) return s;
            }
            if (v && typeof v === 'object') {
              const r = dfs(v, depth + 1);
              if (r) return r;
            }
          } catch {}
        }
        return '';
      };
      
      const deep = dfs(rawObj);
      if (deep) return deep;
    } catch {}
    return '';
  }, []);

  // Helper to compute server base for file URLs
  const serverBase = useMemo(() => {
    try {
      const b = (import.meta?.env && import.meta.env.VITE_API_BASE_URL) || '';
      if (typeof b === 'string' && b.startsWith('http')) {
        const url = new URL(b);
        return `${url.protocol}//${url.host}`;
      }
    } catch {}
    
    try {
      return window.location.origin.replace(/:\d+$/, ':4000');
    } catch {
      return 'http://localhost:4000';
    }
  }, []);

  const fileUrl = useCallback((p) => {
    if (!p) return null;
    if (/^https?:\/\//i.test(p)) return p;
    const path = p.startsWith('uploads/') ? p : `uploads/${p.replace(/^\/?/, '')}`;
    return `${serverBase}/${path}`;
  }, [serverBase]);

  const fetchAndOpenProfile = async (lecturer, readonly = false) => {
    try {
      const raw = (await getLecturerDetail(lecturer.id)) || {};
      const detail = raw.data || raw.profile || raw.lecturer_profile || raw || {};
      
      const get = (k, alt) => 
        detail[k] ?? raw[k] ?? raw.data?.[k] ?? raw.profile?.[k] ?? raw.lecturer_profile?.[k] ?? alt;
      
      const prefilledBio = get('short_bio') || extractBio(raw);
      
      const enriched = {
        id: lecturer.id,
        name: lecturer.name || get('name', ''),
        email: lecturer.email || get('email', ''),
        department: lecturer.department || get('department', ''),
        position: lecturer.position || get('position', 'Lecturer'),
        status: lecturer.status || get('status', 'active'),
        occupation: get('occupation', '') || '',
        place: get('place', '') || '',
        phone: get('phone') || get('phone_number') || '',
        bio: prefilledBio,
        specialization: get('researchFields') || get('research_fields') || lecturer.researchFields || [],
        education: get('education') || [],
        experience: get('experience') || [],
        cvUploaded: get('cvUploaded') || false,
        cvFilePath: get('cvFilePath') || get('cv_file_path') || '',
        syllabusUploaded: get('syllabusUploaded') || false,
        syllabusFilePath: get('syllabusFilePath') || get('syllabus_file_path') || '',
        bank_name: get('bank_name', '') || get('bankName', ''),
        account_name: get('account_name', '') || get('accountName', ''),
        account_number: get('account_number', '') || get('accountNumber', ''),
        payrollFilePath: get('payrollFilePath') || get('payroll_file_path') || get('payroll_path') || 
                        get('payrollPath') || get('pay_roll_in_riel') || '',
        candidateId: get('candidateId', null),
        hourlyRateThisYear: (get('hourlyRateThisYear', '')) ?? ''
      };
      
      setSelectedLecturer(enriched);
      setDialogReadonly(readonly);
      setIsProfileDialogOpen(true);
      setEditTab('basic');
    } catch (e) {
      toast.error('Failed to load lecturer');
      console.error(e);
    }
  };

  const openEdit = (lecturer) => fetchAndOpenProfile(lecturer, false);
  const openView = (lecturer) => fetchAndOpenProfile(lecturer, true);

  const closeDialog = () => {
    setIsProfileDialogOpen(false);
    setSelectedLecturer(null);
  };

  return {
    selectedLecturer,
    setSelectedLecturer,
    isProfileDialogOpen,
    setIsProfileDialogOpen,
    dialogReadonly,
    editTab,
    setEditTab,
    openEdit,
    openView,
    closeDialog,
    fileUrl,
    extractBio
  };
}
