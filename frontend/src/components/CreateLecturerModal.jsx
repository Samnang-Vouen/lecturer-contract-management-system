import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Loader2, CheckCircle2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { listCandidates } from '../services/candidate.service';
import { createLecturer, createLecturerFromCandidate } from '../services/lecturer.service';

export default function CreateLecturerModal({ isOpen, onClose, onLecturerCreated }) {
  const [formData, setFormData] = useState({ fullName: '', email: '', position: '', title: '', gender: '' });
  const [acceptedCandidates, setAcceptedCandidates] = useState([]); // used as suggestions list
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [candidateQuery, setCandidateQuery] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [searchTimer, setSearchTimer] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    
    // For fullName, only allow English letters, spaces, periods, and common titles
    if (name === 'fullName') {
      // Allow only English letters (a-z, A-Z), spaces, periods, apostrophes, and hyphens
      const englishOnly = value.replace(/[^a-zA-Z\s.''-]/g, '');
      setFormData(p => ({ ...p, [name]: englishOnly }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
    
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name required';
    } else if (!/^[a-zA-Z\s.''-]+$/.test(formData.fullName.trim())) {
      errs.fullName = 'Name must contain only English letters and common titles (Dr., Mr., Mrs., etc.)';
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Name must be at least 2 characters long';
    }
    if (!formData.title.trim()) errs.title = 'Title required';
    if (!formData.gender.trim()) errs.gender = 'Gender required';
    
    if (!formData.email.trim()) errs.email = 'Email required';
    else if (!/^[A-Z0-9._%+-]+@cadt\.edu\.kh$/i.test(formData.email)) errs.email = 'Must be CADT email';
    if (!formData.position.trim()) errs.position = 'Position required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // When selecting a candidate from suggestions, auto-fill position and name
  const onSelectCandidate = (cand) => {
    if (!cand) return;
    setSelectedCandidateId(String(cand.id));
    setCandidateQuery(cand.fullName || '');
    setSuggestOpen(false);
    // Normalize position to canonical values used by backend
    const normalizePosition = (val) => {
      const s = String(val || '').trim();
      if (!s) return 'Lecturer';
      if (/\b(teaching\s*assistant|assistant|\bta\b)\b/i.test(s)) return 'Teaching Assistant (TA)';
      if (/(lecturer|instructor|teacher)/i.test(s)) return 'Lecturer';
      return 'Lecturer';
    };
    setFormData(p => ({
      ...p,
      fullName: cand.fullName || p.fullName,
      position: normalizePosition(cand.positionAppliedFor) || p.position,
      title: cand.title || p.title,
      gender: cand.gender || p.gender
    }));
  };

  // Debounced server-side search for accepted candidates
  const searchAcceptedCandidates = async (q) => {
    if (!q || !q.trim()) { setAcceptedCandidates([]); return; }
    setSuggestLoading(true);
    try {
      const res = await listCandidates({ status: 'accepted', search: q.trim(), limit: 10 });
      setAcceptedCandidates(res?.data || []);
    } catch (e) {
      // silent
    } finally { setSuggestLoading(false); }
  };

  // Clear suggestions when modal opens/closes
  useEffect(() => {
    if (!isOpen) return;
    setAcceptedCandidates([]);
    setCandidateQuery('');
    setSuggestOpen(false);
  }, [isOpen]);

  const submit = async e => {
    e.preventDefault();
    if (!validate()) return;
  setSuggestOpen(false);
    setIsSubmitting(true);
    try {
      let res;
      if (selectedCandidateId) {
        // Use new endpoint to create from candidate and auto mark done
        res = await createLecturerFromCandidate(selectedCandidateId, {
          title: formData.title,
          gender: formData.gender,
          email: formData.email
        });
      } else {
        // Fallback: manual create
        const payload = { fullName: formData.fullName, email: formData.email, position: formData.position, title: formData.title, gender: formData.gender };
        res = await createLecturer(payload);
      }
      setSuccessData(res);
      onLecturerCreated(res);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create lecturer';
      toast.error(msg);
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
    } finally { setIsSubmitting(false); }
  };

  const handleClose = () => { setFormData({ fullName:'', email:'', position:'', title:'', gender:'' }); setErrors({}); setSuccessData(null); setSelectedCandidateId(''); onClose(); };
  
  // Close suggestions on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (ev) => { if (ev.key === 'Escape') setSuggestOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(()=>{ if(isOpen){ const o=document.body.style.overflow; document.body.style.overflow='hidden'; return ()=>{ document.body.style.overflow=o; }; } },[isOpen]);
  if(!isOpen) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative w-full h-full flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl pointer-events-auto relative">
          <button onClick={handleClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
          {successData ? (
            <div>
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold">Lecturer Created</h2>
                  <p className="text-sm text-gray-600 mt-1">Temporary password generated. Share securely.</p>
                </div>
              </div>
              <div className="border rounded-md p-4 mb-6 bg-gray-50">
                <p className="text-sm font-medium mb-2">Temp Password</p>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm tracking-wider select-none">••••••••••</span>
                  <button
                    type="button"
                    onClick={()=>{ navigator.clipboard.writeText(successData.tempPassword); toast.success('Copied'); }}
                    className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100"
                    title="Copy temp password"
                    aria-label="Copy temp password"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">Masked for security. Use Copy to share privately.</p>
              </div>
              <button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md">Close</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h2 className="text-xl font-semibold">Add Lecturer</h2>
              <p className="text-sm text-gray-600">Create a new lecturer account. You can write and select from accepted candidates to auto-fill details.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Candidate</label>
                <div className="relative">
                  <input
                    type="text"
                    value={candidateQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCandidateQuery(v);
                      setSelectedCandidateId('');
                      setSuggestOpen(true);
                      if (searchTimer) clearTimeout(searchTimer);
                      const t = setTimeout(() => { searchAcceptedCandidates(v); }, 300);
                      setSearchTimer(t);
                    }}
                    onFocus={() => { if (candidateQuery.trim()) setSuggestOpen(true); }}
                    placeholder="Type to search accepted candidates..."
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                    aria-autocomplete="list"
                    aria-expanded={suggestOpen}
                    aria-owns="candidate-suggestions"
                  />
                  {suggestOpen && (
                    <div id="candidate-suggestions" className="absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
                      {suggestLoading && (
                        <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
                      )}
                      {!suggestLoading && acceptedCandidates.length === 0 && candidateQuery.trim() && (
                        <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
                      )}
                      {!suggestLoading && acceptedCandidates.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => onSelectCandidate(c)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                        >
                          {c.fullName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Selecting a candidate auto-fills name and position. Candidate will be marked as done on success.</p>
              </div>
              {/* Title */}
              <div>
                <label id="title-label" className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                {(() => {
                  const titles = [
                    { key: 'Mr', label: 'Mr.' },
                    { key: 'Ms', label: 'Ms.' },
                    { key: 'Mrs', label: 'Mrs.' },
                    { key: 'Dr', label: 'Dr.' },
                    { key: 'Prof', label: 'Prof.' }
                  ];
                  const onArrow = (e, idx) => {
                    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
                    e.preventDefault();
                    const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
                    const next = (idx + dir + titles.length) % titles.length;
                    setFormData(p => ({ ...p, title: titles[next].key }));
                    if (errors.title) setErrors(x => ({ ...x, title: null }));
                  };
                  return (
                    <div
                      role="radiogroup"
                      aria-labelledby="title-label"
                      className="flex flex-wrap gap-2"
                    >
                      {titles.map((t, idx) => {
                        const selected = formData.title === t.key;
                        return (
                          <button
                            key={t.key}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            tabIndex={selected ? 0 : -1}
                            onKeyDown={(e) => onArrow(e, idx)}
                            onClick={() => {
                              setFormData(p => ({ ...p, title: t.key }));
                              if (errors.title) setErrors(e => ({ ...e, title: null }));
                            }}
                            className={`px-3 py-2 text-sm font-medium rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white border
                              ${selected
                                ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent shadow-sm'
                                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'}
                            `}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
                {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
              </div>
              {/* Gender */}
              <div>
                <label id="gender-label" className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                {(() => {
                  const genders = ['male', 'female', 'other'];
                  const onArrow = (e, idx) => {
                    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
                    e.preventDefault();
                    const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
                    const next = (idx + dir + genders.length) % genders.length;
                    setFormData(p => ({ ...p, gender: genders[next] }));
                    if (errors.gender) setErrors(x => ({ ...x, gender: null }));
                  };
                  return (
                    <div role="radiogroup" aria-labelledby="gender-label" className="flex flex-wrap gap-2">
                      {genders.map((g, idx) => {
                        const selected = formData.gender === g;
                        return (
                          <button
                            key={g}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            tabIndex={selected ? 0 : -1}
                            onKeyDown={(e) => onArrow(e, idx)}
                            onClick={() => {
                              setFormData(p => ({ ...p, gender: g }));
                              if (errors.gender) setErrors(e => ({ ...e, gender: null }));
                            }}
                            className={`px-3 py-2 text-sm font-medium rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white border
                              ${selected
                                ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent shadow-sm'
                                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'}
                            `}
                          >
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
                {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  readOnly={!!selectedCandidateId}
                  className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.position?'border-red-500':'border-gray-300'} ${selectedCandidateId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Auto-filled from candidate"
                />
                {errors.position && <p className="text-xs text-red-600 mt-1">{errors.position}</p>}
                {selectedCandidateId && <p className="text-xs text-gray-500 mt-1">Position is auto-filled from the selected candidate.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email?'border-red-500':'border-gray-300'}`} placeholder="name@cadt.edu.kh" />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded-md flex items-center justify-center">
                  {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Creating...</>) : 'Create Lecturer'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>, document.body);
}
