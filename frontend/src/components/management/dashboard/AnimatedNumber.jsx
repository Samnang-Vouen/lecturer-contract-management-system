import React, { useState, useEffect } from 'react';

export default function AnimatedNumber({ value = 0 }) {
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    const startVal = display;
    const endVal = Number(value) || 0;
    if (startVal === endVal) return;
    const t0 = performance.now();
    const dur = 600;
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const v = Math.round(startVal + (endVal - startVal) * p);
      setDisplay(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, display]);
  
  return <>{Number(display).toLocaleString()}</>;
}
