import { useState, useEffect } from 'react';
import { getDepartments } from '../../../services/catalog.service';
import { getLecturerDetail } from '../../../services/lecturer.service';

export function useMenusAndPopovers() {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuCoords, setMenuCoords] = useState({ x: 0, y: 0, dropUp: false });
  const [coursesPopover, setCoursesPopover] = useState(null);

  const openMenu = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    const menuWidth = 192; // w-48 = 12rem = 192px
    const menuHeight = 200; // Approximate height of 5 buttons
    const spacing = 8;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Horizontal positioning: prioritize left side placement
    let x = rect.left - menuWidth - spacing;
    
    // If menu goes off-screen on the left, show on right side instead
    if (x < spacing) {
      x = rect.right + spacing;
      
      // If it also goes off-screen on the right, align to right edge
      if (x + menuWidth > viewportWidth - spacing) {
        x = viewportWidth - menuWidth - spacing;
      }
    }
    
    // Vertical positioning: align with button, but keep within viewport
    let y = rect.top;
    
    // If menu goes below viewport, shift it up
    if (y + menuHeight > viewportHeight - spacing) {
      y = Math.max(spacing, viewportHeight - menuHeight - spacing);
    }
    
    // Ensure minimum top spacing
    y = Math.max(spacing, y);
    
    setMenuCoords({ x, y });
    setOpenMenuId(id);
  };

  const closeMenu = () => setOpenMenuId(null);

  const openCoursesPopover = (lecturer, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 240;
    const gap = 8;
    const shouldDropUp = (rect.bottom + menuHeight + gap) > window.innerHeight;
    const dropUp = shouldDropUp;
    const y = dropUp 
      ? Math.max(rect.top - menuHeight - gap, gap) 
      : Math.min(rect.bottom + gap, Math.max(window.innerHeight - menuHeight - gap, gap));
    const width = 260;
    const rawX = rect.right - width;
    const x = Math.min(Math.max(rawX, gap), Math.max(window.innerWidth - width - gap, gap));
    const items = (lecturer.courses || []).slice(3);
    
    if (!items.length) {
      setCoursesPopover(null);
      return;
    }
    
    setCoursesPopover({ id: lecturer.id, items, x, y, dropUp });
  };

  const closeCoursesPopover = () => setCoursesPopover(null);

  // Click outside handlers
  useEffect(() => {
    function onDocClick(e) {
      if (!e.target.closest('.lecturer-action-menu') && !e.target.closest('.lecturer-action-trigger')) {
        closeMenu();
      }
      if (!e.target.closest('.courses-popover') && !e.target.closest('.courses-plus-chip')) {
        closeCoursesPopover();
      }
    }
    
    if (openMenuId) {
      document.addEventListener('click', onDocClick);
    }
    
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeCoursesPopover();
        closeMenu();
      }
    };
    window.addEventListener('keydown', onKey);
    
    const onScrollOrResize = () => {
      closeMenu();
      closeCoursesPopover();
    };
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    
    return () => {
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [openMenuId]);

  return {
    openMenuId,
    menuCoords,
    coursesPopover,
    openMenu,
    closeMenu,
    openCoursesPopover,
    closeCoursesPopover
  };
}

export function useDepartments() {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (e) {
        console.warn('departments fetch failed', e.message);
      }
    };
    fetchDeps();
  }, []);

  return departments;
}

export function useOnboardingListener(refreshLecturers) {
  useEffect(() => {
    const handleMessage = (evt) => {
      const data = evt?.data || evt;
      if (data && data.type === 'onboarding_complete') {
        refreshLecturers.current && refreshLecturers.current();
      }
    };

    // BroadcastChannel
    let bc = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('lecturer-updates');
      bc.onmessage = handleMessage;
    }

    // Storage event fallback
    const onStorage = (e) => {
      if (e.key === 'lecturer-onboarding-update' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          handleMessage(payload);
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);

    // Focus event
    const onFocus = () => {
      try {
        const raw = localStorage.getItem('lecturer-onboarding-update');
        if (raw) {
          const payload = JSON.parse(raw);
          handleMessage(payload);
          localStorage.removeItem('lecturer-onboarding-update');
        }
      } catch {}
    };
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [refreshLecturers]);
}
