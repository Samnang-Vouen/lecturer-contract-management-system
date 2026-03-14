import React from 'react';

export default function ClientErrorsAlert({ messages }) {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  return (
    <div role="alert" className="mb-3 mx-2 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
      <div className="font-medium">Please fill all required information:</div>
      <ul className="mt-1 list-disc pl-5 space-y-0.5">
        {messages.map((m, idx) => (
          <li key={`ce-${idx}`}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
