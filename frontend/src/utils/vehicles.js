// Mirrors BookingService.isCompatible on the backend (the server remains the authority).
// Which bay types each vehicle class may use.
const ALLOWED_BAYS = {
  BIKE: ['BIKE'],
  CAR: ['CAR', 'ACCESSIBLE'],
  EV: ['EV', 'CAR'],
  ACCESSIBLE: ['ACCESSIBLE', 'CAR'],
};

export const canUseBay = (vehicleType, slotType) => (ALLOWED_BAYS[vehicleType] || []).includes(slotType);

/** The vehicle class a bay is meant for, used to pre-select the vehicle when a bay is picked. */
export const defaultVehicleFor = (slotType) => {
  if (slotType === 'EV') return 'EV';
  if (slotType === 'BIKE') return 'BIKE';
  return 'CAR';
};

// Indian registration plates, e.g. KA05MJ4040 or KA-05-MJ-4040 (also the BH series). Lenient on purpose.
export const PLATE_PATTERN = /^[A-Z]{2}[ -]?\d{1,2}[ -]?[A-Z]{0,3}[ -]?\d{1,4}$|^\d{2}BH\d{4}[A-Z]{1,2}$/;
