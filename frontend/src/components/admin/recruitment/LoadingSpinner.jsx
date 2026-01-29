import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'w-5 h-5' }) {
  return <Loader2 className={`${size} animate-spin`} />;
}
