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
  weekday: string;
  dayNum: string;
  month: string;
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

function isDayOpen(availabilityJson: string | null, date: Date, branchId?: number | null): boolean {
  const availability = parseAvailability(availabilityJson, branchId);
  const dayKey = DAY_KEYS[date.getDay()];
  return availability[dayKey]?.enabled ?? false;
}

export function getBookableDates(
  availabilityJson: string | null,
  branchId?: number | null,
  daysAhead = 21
): BookableDate[] {
  const today = startOfDay(new Date());
  const dates: BookableDate[] = [];

  for (let offset = 0; offset < daysAhead; offset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);

    if (!isDayOpen(availabilityJson, date, branchId)) {
      continue;
    }

    const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'short' })
      .format(date)
      .replace('.', '')
      .toUpperCase();
    const dayNum = String(date.getDate());
    const month = new Intl.DateTimeFormat('es-AR', { month: 'short' })
      .format(date)
      .replace('.', '')
      .toUpperCase();

    dates.push({
      key: toDateKey(date),
      label: formatDateLabel(date, today),
      sublabel: formatDateSublabel(date),
      weekday,
      dayNum,
      month,
    });
  }

  return dates;
}

export interface BookedSlot {
  date: string;
  start: string;
  end: string;
}

function overlapsBookedSlot(
  dateKey: string,
  slotStart: number,
  slotEnd: number,
  bookedSlots: BookedSlot[]
): boolean {
  return bookedSlots.some((booked) => {
    if (booked.date !== dateKey) {
      return false;
    }

    const bookedStart = parseTime(booked.start);
    const bookedEnd = parseTime(booked.end);
    return slotStart < bookedEnd && slotEnd > bookedStart;
  });
}

export function getTimeSlots(
  availabilityJson: string | null,
  dateKey: string,
  durationMinutes: number,
  branchId?: number | null,
  now = new Date(),
  bookedSlots: BookedSlot[] = []
): string[] {
  const availability = parseAvailability(availabilityJson, branchId);
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

      if (overlapsBookedSlot(dateKey, slotStart, slotStart + durationMinutes, bookedSlots)) {
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

function addMinutesToTime(time: string, minutesToAdd: number): string {
  const totalMinutes = parseTime(time) + minutesToAdd;
  return formatTime(totalMinutes);
}

export function formatScheduleRange(
  dateKey: string,
  startTime: string,
  durationMinutes: number
): string {
  const endTime = addMinutesToTime(startTime, durationMinutes);
  return `${formatSelectedDate(dateKey)}, ${startTime} – ${endTime}`;
}
