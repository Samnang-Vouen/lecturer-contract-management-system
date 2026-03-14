import React from 'react';

export default function ContactFields({ form, setForm }) {
  return (
    <>
      <div className="col-span-1 sm:col-span-2 flex flex-col">
        <label htmlFor="mappingContactedBy" className="block text-sm font-medium text-gray-700 mb-1">
          Contacted By
        </label>
        <input
          id="mappingContactedBy"
          name="contactedBy"
          value={form.contactedBy || form.contacted_by || ''}
          onChange={(e) => setForm((f) => ({ ...f, contactedBy: e.target.value, contacted_by: e.target.value }))}
          className="block w-full min-h-[3rem] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Mr. John Smith"
        />
      </div>

      <div className="col-span-1 sm:col-span-2 flex flex-col">
        <label htmlFor="mappingComment" className="block text-sm font-medium text-gray-700 mb-1">
          Comment
        </label>
        <textarea
          id="mappingComment"
          name="comment"
          value={form.comment}
          onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value.slice(0, 160) }))}
          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          maxLength={160}
        />
        <div className="mt-1 text-[11px] text-gray-500 self-end">{(form.comment || '').length}/160</div>
      </div>
    </>
  );
}
