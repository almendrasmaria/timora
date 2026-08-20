export type PaymentMethodType =
  | 'CASH'
  | 'TRANSFER'
  | 'ONLINE_DEPOSIT'
  | 'ONLINE_FULL'
  | 'FREE';

export interface PublicService {
  id: number;
  name: string;
  durationMinutes: number;
  price: number | null;
  depositAmount: number | null;
}

export interface PublicBookedSlot {
  date: string;
  start: string;
  end: string;
}

export interface PublicProfessional {
  id: number;
  name: string;
  availabilityJson: string | null;
  branchIds: number[];
  bookedSlots: PublicBookedSlot[];
}

export interface PublicBranch {
  id: number;
  name: string;
  address: string;
}

export interface PublicBusiness {
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
  whatsapp: string | null;
  services: PublicService[];
  professionals: PublicProfessional[];
  branches: PublicBranch[];
  paymentMethods: PaymentMethodType[];
}

export type BookingStep = 1 | 2 | 3 | 4;
