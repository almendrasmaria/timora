import { BookingStep } from './public-booking.models';

export const BOOKING_STEPS: { step: BookingStep; label: string }[] = [
  { step: 1, label: 'Servicio' },
  { step: 2, label: 'Fecha' },
  { step: 3, label: 'Confirmar' },
];

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainder} min`;
}

export function formatPrice(value: number | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export function servicePaymentLabel(
  depositAmount: number | null,
  price: number | null
): string {
  if (depositAmount != null && depositAmount > 0) {
    return 'Seña online';
  }

  if (price != null && price > 0) {
    return 'Pago total online';
  }

  return 'Reserva sin pago online';
}

export function serviceMeta(service: {
  durationMinutes: number;
  price: number | null;
}): string {
  const duration = formatDuration(service.durationMinutes);
  const price = formatPrice(service.price);

  return price ? `${duration} · ${price}` : duration;
}
