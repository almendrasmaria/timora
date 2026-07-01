import { parseAvailability } from '../onboarding/professional-schedule.model';

const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export interface BookableDate {
  key: string;
  label: string;
  sublabel: string;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatDateLabel(date: Date, today: Date): string {
  const diff = Math.round((startOfDay(date).getTime() - today.getTime()) / 86_400_000);

  if (diff === 0) {
    return 'Hoy';
  }

  if (diff === 1) {
    return 'Mañana';
  }

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return dayNames[date.getDay()];
}

function formatDateSublabel(date: Date): string {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function isDayOpen(availabilityJson: string | null, date: Date): boolean {
  const availability = parseAvailability(availabilityJson);
  const dayKey = DAY_KEYS[date.getDay()];
  return availability[dayKey]?.enabled ?? false;
}

export function getBookableDates(availabilityJson: string | null, daysAhead = 21): BookableDate[] {
  const today = startOfDay(new Date());
  const dates: BookableDate[] = [];

  for (let offset = 0; offset < daysAhead; offset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);

    if (!isDayOpen(availabilityJson, date)) {
      continue;
    }

    dates.push({
      key: toDateKey(date),
      label: formatDateLabel(date, today),
      sublabel: formatDateSublabel(date),
    });
  }

  return dates;
}

export function getTimeSlots(
  availabilityJson: string | null,
  dateKey: string,
  durationMinutes: number,
  now = new Date()
): string[] {
  const availability = parseAvailability(availabilityJson);
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayKey = DAY_KEYS[date.getDay()];
  const schedule = availability[dayKey];

  if (!schedule?.enabled) {
    return [];
  }

  const slots: string[] = [];
  const isToday = toDateKey(startOfDay(now)) === dateKey;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const block of schedule.blocks) {
    const blockStart = parseTime(block.start);
    const blockEnd = parseTime(block.end);

    for (
      let slotStart = blockStart;
      slotStart + durationMinutes <= blockEnd;
      slotStart += durationMinutes
    ) {
      if (isToday && slotStart <= nowMinutes) {
        continue;
      }

      slots.push(formatTime(slotStart));
    }
  }

  return slots;
}

export function formatSelectedDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = startOfDay(new Date());
  const label = formatDateLabel(date, today);
  const sublabel = formatDateSublabel(date);

  if (label === 'Hoy' || label === 'Mañana') {
    return `${label}, ${sublabel}`;
  }

  const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(date);
  return `${weekday} ${sublabel}`;
}
