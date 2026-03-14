import { useState } from 'react';
import toast from 'react-hot-toast';
import { getLecturerDetail } from '../../../services/lecturer.service';
import { getAdvisorDetail } from '../../../services/advisor.service';
import { useMemo, useCallback } from 'react';

const getRoleTokens = (obj) => {
  const toToken = (r) => {
    if (r === null || r === undefined) return '';
    if (typeof r === 'string' || typeof r === 'number') return String(r);
    if (typeof r === 'object') {
      return r.role ?? r.name ?? r.code ?? r.type ?? r.value ?? '';
    }
    return String(r);
  };

  const rawValues = [obj?.role, obj?.roles, obj?.user?.role, obj?.user?.roles];
  const flattened = [];
  for (const v of rawValues) {
    if (!v) continue;
    if (Array.isArray(v)) {
      for (const item of v) flattened.push(toToken(item));
    } else {
      flattened.push(toToken(v));
    }
  }

  return flattened
    .flatMap((s) => String(s ?? '').split(','))
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
};

const isAdvisorOnly = (obj) => {
  const tokens = getRoleTokens(obj);
  const hasAdvisorRole = tokens.some((t) => t === 'advisor' || t.includes('advisor'));
  const hasLecturerRole = tokens.some((t) => t === 'lecturer' || t === 'lecture' || t.includes('lectur'));
  return hasAdvisorRole && !hasLecturerRole;
};

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
      const isAdvisor = isAdvisorOnly(lecturer);
      const initialRoleTokens = getRoleTokens(lecturer);

      const raw = (await (isAdvisor ? getAdvisorDetail(lecturer.id) : getLecturerDetail(lecturer.id))) || {};
      const detail = raw.data || raw.profile || raw.lecturer_profile || raw || {};
      
      const get = (k, alt) => 
        detail[k] ?? raw[k] ?? raw.data?.[k] ?? raw.profile?.[k] ?? raw.lecturer_profile?.[k] ?? alt;
      
      const prefilledBio = get('short_bio') || get('shortBio') || extractBio(raw);

      const researchFieldsRaw =
        get('researchFields') ?? get('research_fields') ?? lecturer.researchFields ?? [];
      const researchFields = Array.isArray(researchFieldsRaw)
        ? researchFieldsRaw
        : typeof researchFieldsRaw === 'string'
          ? researchFieldsRaw
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      
      const enriched = {
        id: lecturer.id,
        name: lecturer.name || get('name', ''),
        role: Array.from(new Set([
          ...initialRoleTokens,
          ...getRoleTokens(detail),
          ...getRoleTokens(raw)
        ])).filter(Boolean),
        email: lecturer.email || get('email', ''),
        full_name_english: get('full_name_english', '') || get('fullNameEnglish', ''),
        full_name_khmer: get('full_name_khmer', '') || get('fullNameKhmer', ''),
        personal_email: get('personal_email', '') || get('personalEmail', ''),
        country: get('country', '') || '',
        department: lecturer.department || get('department', ''),
        departments: get('departments', []) || [],
        position: lecturer.position || get('position', 'Lecturer'),
        status: lecturer.status || get('status', 'active'),
        occupation: get('occupation', '') || '',
        place: get('place', '') || '',
        phone: get('phone') || get('phone_number') || '',
        bio: prefilledBio,
        qualifications: get('qualifications', '') || '',
        specialization: researchFields,
        courses: get('courses', []) || [],
        coursesCount: get('coursesCount', null),
        education: get('education') || [],
        experience: get('experience') || [],
        cvUploaded: get('cvUploaded') || false,
        cvFilePath: get('cvFilePath') || get('cv_file_path') || '',
        syllabusUploaded: get('syllabusUploaded') || false,
        syllabusFilePath: get('syllabusFilePath') || get('syllabus_file_path') || '',
        courseSyllabusFiles:
          get('courseSyllabusFiles') ||
          get('course_syllabus_files') ||
          [],
        courseSyllabusFileNames:
          get('courseSyllabusFileNames') ||
          get('course_syllabus_file_names') ||
          {},
        latest_degree: get('latest_degree', '') || '',
        degree_year: get('degree_year', '') || '',
        major: get('major', '') || '',
        university: get('university', '') || '',
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
