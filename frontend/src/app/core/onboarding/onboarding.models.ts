export type BusinessCategory =
  | 'ESTETICA'
  | 'SALUD'
  | 'SERVICIOS'
  | 'COMERCIO'
  | 'EDUCACION'
  | 'GASTRONOMIA'
  | 'FITNESS'
  | 'OTRO';

export type PaymentMethodType =
  | 'CASH'
  | 'TRANSFER'
  | 'ONLINE_DEPOSIT'
  | 'ONLINE_FULL'
  | 'FREE';

export interface BusinessState {
  name: string;
  category: BusinessCategory;
  specialty?: string;
  whatsapp: string;
  instagram?: string;
  slug: string;
  brandColor?: string;
  logoUrl?: string;
  showWhatsappToClients: boolean;
  reminderTemplate?: string;
  bioLinkText?: string;
  bioShowBooking: boolean;
  bioShowLocation: boolean;
  bioShowWhatsapp: boolean;
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  business: BusinessState;
  branches: { id: number; name: string; address: string }[];
  professionals: {
    id: number;
    firstName: string;
    lastName: string;
    availabilityJson: string | null;
    branchIds: number[];
  }[];
  services: {
    id: number;
    name: string;
    durationMinutes: number;
    price: number | null;
    depositAmount: number | null;
  }[];
  paymentMethods: { id: number; type: PaymentMethodType }[];
}
