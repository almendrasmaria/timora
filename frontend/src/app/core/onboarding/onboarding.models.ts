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

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  business: {
    name: string;
    category: BusinessCategory | null;
    specialty: string | null;
    whatsapp: string | null;
    instagram: string | null;
    slug: string;
    brandColor: string | null;
  };
  branches: { id: number; name: string; address: string }[];
  professionals: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    roleLabel: string | null;
    availabilityJson: string | null;
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
