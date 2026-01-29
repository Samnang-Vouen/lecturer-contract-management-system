import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook for managing contract action menu state and positioning
 */
export function useContractMenu(contracts) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuCoords, setMenuCoords] = useState({ x: 0, y: 0, dropUp: false });

  const currentMenuContract = useMemo(() => {
    return (contracts || []).find(x => x.id === openMenuId) || null;
  }, [contracts, openMenuId]);

  const openMenu = (id, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 168;
    const gap = 8;
    const shouldDropUp = (rect.bottom + menuHeight + gap) > window.innerHeight;
    const dropUp = shouldDropUp;
    const y = dropUp
      ? Math.max(rect.top - menuHeight - gap, gap)
      : Math.min(rect.bottom + gap, Math.max(window.innerHeight - menuHeight - gap, gap));
    const width = 176;
    const rawX = rect.right - width;
    const x = Math.min(Math.max(rawX, gap), Math.max(window.innerWidth - width - gap, gap));
    setMenuCoords({ x, y, dropUp });
    setOpenMenuId(id);
  };

  const closeMenu = () => setOpenMenuId(null);

  // Close menu on outside click, escape, scroll, or resize
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest('.contract-action-menu')) closeMenu();
    };
    const onKey = (e) => { if (e.key === 'Escape') closeMenu(); };
    const onScrollOrResize = () => closeMenu();
    
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  return {
    openMenuId,
    menuCoords,
    currentMenuContract,
    openMenu,
    closeMenu,
  };
}
