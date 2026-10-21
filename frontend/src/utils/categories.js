import { Building2, Camera, Car, Hospital, Plane, ShoppingBag, Store, Train } from 'lucide-react';

// One place that knows how each facility category looks: its label, icon and colour.
// `tone` is a Tailwind gradient used when a facility has no (or a broken) photo.
export const CATEGORIES = {
  HOSPITAL: { label: 'Hospital', icon: Hospital, tone: 'from-rose-100 to-rose-200 text-rose-600', chip: 'bg-red-50 text-red-600 border-red-200' },
  MALL: { label: 'Mall', icon: ShoppingBag, tone: 'from-purple-100 to-fuchsia-200 text-purple-600', chip: 'bg-purple-50 text-purple-600 border-purple-200' },
  RAILWAY_STATION: { label: 'Railway station', icon: Train, tone: 'from-amber-100 to-orange-200 text-amber-600', chip: 'bg-amber-50 text-amber-600 border-amber-200' },
  AIRPORT: { label: 'Airport', icon: Plane, tone: 'from-sky-100 to-blue-200 text-blue-600', chip: 'bg-blue-50 text-blue-600 border-blue-200' },
  IT_PARK: { label: 'IT park', icon: Building2, tone: 'from-cyan-100 to-teal-200 text-cyan-700', chip: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  TOURIST_SPOT: { label: 'Tourist spot', icon: Camera, tone: 'from-emerald-100 to-green-200 text-emerald-600', chip: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  COMMERCIAL_HUB: { label: 'Commercial hub', icon: Store, tone: 'from-indigo-100 to-violet-200 text-indigo-600', chip: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  OTHER: { label: 'Parking', icon: Car, tone: 'from-slate-100 to-slate-200 text-slate-500', chip: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export const categoryOf = (code) => CATEGORIES[code] || CATEGORIES.OTHER;
