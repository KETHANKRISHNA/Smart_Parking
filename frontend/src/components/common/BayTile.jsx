import React from 'react';
import { Zap } from 'lucide-react';

const LOOK = {
  AVAILABLE: { box: 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:border-emerald-500', label: 'Available' },
  OCCUPIED: { box: 'bg-rose-50 border-rose-300 text-rose-950', label: 'Occupied' },
  RESERVED: { box: 'bg-amber-50 border-amber-300 text-amber-950', label: 'Reserved' },
  OUT_OF_SERVICE: { box: 'bg-slate-100 border-slate-300 text-slate-500 hover:border-slate-400', label: 'Out of service' },
};

/**
 * One parking bay. Staff can only flip a bay between AVAILABLE and OUT_OF_SERVICE: a bay with a vehicle in it
 * (OCCUPIED) is driven by gate scans, so it renders as a non-interactive tile.
 */
export const BayTile = ({ slot, onToggle }) => {
  const look = LOOK[slot.status] || LOOK.OUT_OF_SERVICE;
  const toggleable = slot.status === 'AVAILABLE' || slot.status === 'OUT_OF_SERVICE';
  const action = slot.status === 'AVAILABLE' ? 'take out of service' : 'return to service';

  const content = (
    <>
      <span className="flex w-full justify-between items-center text-[10px] font-bold text-slate-500">
        <span>{slot.floorLevel}</span>
        {slot.hasEvCharger && <Zap className="w-3 h-3 fill-emerald-500 text-emerald-600" aria-label="EV charger" />}
      </span>
      <span className="text-lg font-black font-mono">{slot.slotNumber}</span>
      <span className="text-[10px] font-bold">{look.label}</span>
    </>
  );

  const base = `p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-between text-center h-28 w-full ${look.box}`;

  if (!toggleable) {
    return <div className={base}>{content}</div>;
  }
  return (
    <button type="button" onClick={() => onToggle(slot)} className={`${base} cursor-pointer`} title={`Click to ${action}`} aria-label={`Bay ${slot.slotNumber}, ${look.label}. Click to ${action}.`}>
      {content}
    </button>
  );
};
