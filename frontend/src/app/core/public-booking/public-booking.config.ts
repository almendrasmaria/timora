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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Pagar al momento del turno',
  TRANSFER: 'Transferencia',
  ONLINE_DEPOSIT: 'Seña online',
  ONLINE_FULL: 'Pago total online',
  FREE: 'Sin pago',
};

export function resolveBookingPayment(
  paymentMethods: string[],
  service: { price: number | null; depositAmount: number | null }
): { methodLabel: string; amountLabel: string | null; note: string } {
  if (service.depositAmount != null && service.depositAmount > 0) {
    return {
      methodLabel: 'Seña online',
      amountLabel: formatPrice(service.depositAmount),
      note: 'El cobro online estará disponible pronto. Por ahora tu reserva queda pendiente de confirmación.',
    };
  }

  if (service.price != null && service.price > 0 && paymentMethods.includes('ONLINE_FULL')) {
    return {
      methodLabel: 'Pago total online',
      amountLabel: formatPrice(service.price),
      note: 'El cobro online estará disponible pronto. Por ahora tu reserva queda pendiente de confirmación.',
    };
  }

  if (paymentMethods.includes('CASH')) {
    return {
      methodLabel: PAYMENT_METHOD_LABELS['CASH'],
      amountLabel: formatPrice(service.price),
      note: 'El pago se realiza al momento del turno.',
    };
  }

  if (paymentMethods.includes('TRANSFER')) {
    return {
      methodLabel: PAYMENT_METHOD_LABELS['TRANSFER'],
      amountLabel: formatPrice(service.price),
      note: 'El negocio te indicará los datos para transferir.',
    };
  }

  const primaryMethod = paymentMethods[0];
  return {
    methodLabel: primaryMethod ? (PAYMENT_METHOD_LABELS[primaryMethod] ?? 'A coordinar') : 'A coordinar',
    amountLabel: formatPrice(service.price),
    note: 'El negocio te contactará para confirmar el pago.',
  };
}

export function confirmButtonLabel(
  paymentMethods: string[],
  service: { price: number | null; depositAmount: number | null }
): string {
  if (service.depositAmount != null && service.depositAmount > 0) {
    return 'Reservar turno';
  }

  if (paymentMethods.includes('ONLINE_FULL') && service.price != null && service.price > 0) {
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
