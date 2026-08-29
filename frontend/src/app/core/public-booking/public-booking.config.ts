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

export function computeDepositAmount(
  business: { depositEnabled: boolean; depositType: 'FIXED' | 'PERCENTAGE'; depositAmount: number | null },
  servicePrice: number | null
): number | null {
  if (!business.depositEnabled || business.depositAmount == null) {
    return null;
  }

  if (business.depositType === 'PERCENTAGE') {
    if (servicePrice == null) {
      return null;
    }
    return Math.round((servicePrice * business.depositAmount) / 100);
  }

  return business.depositAmount;
}

export function servicePaymentLabel(
  depositAmount: number | null,
  price: number | null,
  depositEnabled: boolean
): string | null {
  if (depositAmount != null && depositAmount > 0) {
    return 'Seña online';
  }

  if (depositEnabled && price != null && price > 0) {
    return 'Pago total online';
  }

  return null;
}

export function serviceMeta(service: {
  durationMinutes: number;
  price: number | null;
}): string {
  const duration = formatDuration(service.durationMinutes);
  const price = formatPrice(service.price);

  return price ? `${duration} · ${price}` : duration;
}

export function resolveBookingPayment(
  service: { price: number | null; depositAmount: number | null }
): { methodLabel: string; amountLabel: string | null; note: string } {
  if (service.depositAmount != null && service.depositAmount > 0) {
    return {
      methodLabel: 'Seña online',
      amountLabel: formatPrice(service.depositAmount),
      note: 'El cobro online estará disponible pronto. Por ahora tu reserva queda pendiente de confirmación.',
    };
  }

  return {
    methodLabel: 'Pago en el turno',
    amountLabel: formatPrice(service.price),
    note: 'No se requiere pago para reservar. Pagás directamente al momento del turno.',
  };
}

export function confirmButtonLabel(
  service: { price: number | null; depositAmount: number | null }
): string {
  if (service.depositAmount != null && service.depositAmount > 0) {
    return 'Reservar turno';
  }

  return 'Reservar sin pagar ahora';
}

export function buildWhatsappLink(phone: string | null | undefined): string | null {
  if (!phone?.trim()) {
    return null;
  }

  let digits = phone.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  if (!digits.startsWith('54')) {
    digits = `54${digits.replace(/^0+/, '')}`;
  }

  return `https://wa.me/${digits}`;
}
