import React, { useEffect, useState, useRef, useId } from 'react';
import { createPortal } from 'react-dom';

const DialogContext = React.createContext({
  onOpenChange: () => {},
  labelId: undefined,
  descId: undefined,
  setLabelId: () => {},
  setDescId: () => {},
});

export function Dialog({ open, onOpenChange, children }) {
  const [labelId, setLabelId] = useState();
  const [descId, setDescId] = useState();

  useEffect(() => {
    if (!open) return;
    
    // Prevent background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (onOpenChange) onOpenChange(false);
      }
    };
    document.addEventListener('keydown', onKey);
    
    return () => {
      document.removeEventListener('keydown', onKey);
      // Restore overflow when dialog closes
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onOpenChange]);

  if (!open) return null;
  
  return createPortal(
    <DialogContext.Provider value={{ onOpenChange: onOpenChange || (() => {}), labelId, descId, setLabelId, setDescId }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange && onOpenChange(false)} />
        {children}
      </div>
    </DialogContext.Provider>,
    document.body
  );
}

export const DialogContent = React.forwardRef(function DialogContent({ children, className = '', ...rest }, ref) {
  const { labelId, descId } = React.useContext(DialogContext);
  const localRef = useRef(null);
  useEffect(() => {
    const el = localRef.current;
    if (el && typeof el.focus === 'function') {
      el.tabIndex = el.tabIndex || -1;
      el.focus();
    }
  }, []);
  const setRef = (node) => {
    localRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };
  return (
    <div
      ref={setRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      aria-describedby={descId}
      className={`relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
});

export function DialogHeader({ children, className = '' }) { return <div className={`mb-4 space-y-1 ${className}`}>{children}</div>; }

export const DialogTitle = React.forwardRef(function DialogTitle({ children, className = '', id: idProp, ...rest }, ref) {
  const { setLabelId } = React.useContext(DialogContext);
  const uid = useId();
  const id = idProp || `dialog-title-${uid}`;
  useEffect(() => {
    if (setLabelId) setLabelId(id);
    return () => {
      if (setLabelId) setLabelId(undefined);
    };
  }, [id, setLabelId]);
  return (
    <h2 ref={ref} id={id} className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...rest}>
      {children}
    </h2>
  );
});

export const DialogDescription = React.forwardRef(function DialogDescription({ children, className = '', id: idProp, ...rest }, ref) {
  const { setDescId } = React.useContext(DialogContext);
  const uid = useId();
  const id = idProp || `dialog-desc-${uid}`;
  useEffect(() => {
    if (setDescId) setDescId(id);
    return () => {
      if (setDescId) setDescId(undefined);
    };
  }, [id, setDescId]);
  return (
    <p ref={ref} id={id} className={`text-sm text-gray-500 ${className}`} {...rest}>
      {children}
    </p>
  );
});

export function DialogTrigger({ asChild, children, onClick }) { return asChild ? React.cloneElement(children, { onClick }) : <button onClick={onClick}>{children}</button>; }

export default { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger };
