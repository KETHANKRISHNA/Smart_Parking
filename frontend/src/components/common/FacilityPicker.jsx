import React from 'react';

/** Only renders when the operator manages more than one facility. */
export const FacilityPicker = ({ facilities, value, onChange }) => {
  if (facilities.length < 2) return null;
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="facility-picker" className="text-xs font-bold text-slate-600">Facility</label>
      <select
        id="facility-picker"
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-sm"
      >
        {facilities.map((f) => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>
    </div>
  );
};
