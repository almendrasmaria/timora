export interface ScheduleBlock {
  start: string;
  end: string;
}

export interface DaySchedule {
  enabled: boolean;
  blocks: ScheduleBlock[];
}

export type ProfessionalAvailability = Record<string, DaySchedule>;

export const WEEK_DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const;

export function createDefaultAvailability(): ProfessionalAvailability {
  const day = (enabled: boolean): DaySchedule => ({
    enabled,
    blocks: [{ start: '09:00', end: '18:00' }],
  });

  return {
    monday: day(true),
    tuesday: day(true),
    wednesday: day(true),
    thursday: day(true),
    friday: day(true),
    saturday: day(false),
    sunday: day(false),
  };
}

export function serializeAvailability(availability: ProfessionalAvailability): string {
  return JSON.stringify(availability);
}

export function parseAvailability(json: string | null, branchId?: number | null): ProfessionalAvailability {
  if (!json) {
    return createDefaultAvailability();
  }

  try {
    const parsed = JSON.parse(json);
    const keys = Object.keys(parsed);
    const isMultiBranch = keys.length > 0 && keys.every(k => /^\d+$/.test(k));

    if (isMultiBranch) {
      if (branchId !== undefined && branchId !== null) {
        const strBranchId = String(branchId);
        if (parsed[strBranchId]) {
          return parsed[strBranchId];
        }
      }
      // Fallback: return the first branch's availability
      const firstKey = keys[0];
      return parsed[firstKey] || createDefaultAvailability();
    }

    return parsed as ProfessionalAvailability;
  } catch {
    return createDefaultAvailability();
  }
}

export function formatAvailabilitySummary(json: string | null): string {
  const availability = parseAvailability(json);
  const openDays = WEEK_DAYS.filter((day) => availability[day.key]?.enabled);

  if (!openDays.length) {
    return 'Sin horarios definidos';
  }

  const firstBlock = availability[openDays[0].key].blocks[0];
  const hours = `${firstBlock.start}–${firstBlock.end}`;
  const weekdayKeys = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const opensWeekdaysOnly =
    openDays.length === 5 && openDays.every((day) => weekdayKeys.has(day.key));

  if (opensWeekdaysOnly) {
    return `Lun–Vie · ${hours}`;
  }

  if (openDays.length === WEEK_DAYS.length) {
    return `Todos los días · ${hours}`;
  }

  return `${openDays.length} días · ${hours}`;
}

export function splitProfessionalName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim().replace(/\s+/g, ' ');
  const spaceIndex = trimmed.indexOf(' ');

  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: trimmed };
  }

  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1),
  };
}
