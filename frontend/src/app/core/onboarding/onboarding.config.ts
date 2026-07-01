export interface OnboardingStepConfig {
  path: string;
  title: string;
  description: string;
  step: number;
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    path: 'negocio',
    title: 'Tu negocio',
    description: 'Nombre y rubro de tu negocio',
    step: 1,
  },
  {
    path: 'contacto',
    title: 'Contacto',
    description: 'Cómo te encuentran tus clientes',
    step: 2,
  },
  {
    path: 'marca',
    title: 'Marca y link',
    description: 'Tu link público de reservas',
    step: 3,
  },
  {
    path: 'sucursales',
    title: 'Sucursales',
    description: 'Dónde opera tu negocio',
    step: 4,
  },
  {
    path: 'profesionales',
    title: 'Profesionales',
    description: 'Quiénes atienden en tu negocio',
    step: 5,
  },
  {
    path: 'servicios',
    title: 'Servicios',
    description: 'Qué servicios ofrecés',
    step: 6,
  },
  {
    path: 'cobros',
    title: 'Formas de cobro',
    description: 'Cómo cobrás tus servicios',
    step: 7,
  },
];

export const PRIMARY_BUSINESS_CATEGORIES = [
  { value: 'ESTETICA', label: 'Estética' },
  { value: 'SALUD', label: 'Salud' },
  { value: 'SERVICIOS', label: 'Servicios' },
] as const;

export const ESTETICA_SPECIALTIES = [
  { value: 'SALON_BELLEZA', label: 'Salón de belleza' },
  { value: 'MANICURIA', label: 'Manicuría' },
  { value: 'PELUQUERIA', label: 'Peluquería' },
  { value: 'SPA', label: 'Spa' },
  { value: 'BARBERIA', label: 'Barbería' },
  { value: 'PODOLOGIA', label: 'Podología' },
  { value: 'MASAJES', label: 'Masajes' },
  { value: 'CEJAS_PESTANAS', label: 'Cejas y pestañas' },
  { value: 'DEPILACION', label: 'Depilación' },
  { value: 'MAQUILLAJE', label: 'Maquillaje' },
] as const;

export const SALUD_SPECIALTIES = [
  { value: 'CLINICA', label: 'Clínica' },
  { value: 'CENTRO_MEDICO', label: 'Centro médico' },
  { value: 'KINESIOLOGIA', label: 'Kinesiología' },
  { value: 'PSICOLOGIA', label: 'Psicología' },
  { value: 'MEDICINA_ALTERNATIVA', label: 'Medicina alternativa' },
  { value: 'CONSULTORIO', label: 'Consultorio' },
  { value: 'ODONTOLOGIA', label: 'Odontología' },
  { value: 'NUTRICION', label: 'Nutrición' },
  { value: 'HOLISTICO', label: 'Holístico' },
  { value: 'FISIOTERAPIA', label: 'Fisioterapia' },
] as const;

export const SERVICIOS_SPECIALTIES = [
  { value: 'PROFESIONAL_INDEPENDIENTE', label: 'Profesional independiente' },
  { value: 'GIMNASIO', label: 'Gimnasio' },
  { value: 'EDUCACION', label: 'Educación' },
  { value: 'HOSPEDAJE', label: 'Hospedaje' },
  { value: 'PILATES', label: 'Pilates' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'CROSSFIT', label: 'Crossfit' },
  { value: 'OTRO', label: 'Otro' },
] as const;

export const BUSINESS_SPECIALTIES_BY_CATEGORY = {
  ESTETICA: ESTETICA_SPECIALTIES,
  SALUD: SALUD_SPECIALTIES,
  SERVICIOS: SERVICIOS_SPECIALTIES,
} as const;

export type BusinessSpecialtyCategory = keyof typeof BUSINESS_SPECIALTIES_BY_CATEGORY;

export function specialtiesForCategory(category: string | null | undefined) {
  if (!category || !(category in BUSINESS_SPECIALTIES_BY_CATEGORY)) {
    return [];
  }

  return BUSINESS_SPECIALTIES_BY_CATEGORY[category as BusinessSpecialtyCategory];
}

/** @deprecated Use specialtiesForCategory */
export const BUSINESS_SPECIALTIES = SERVICIOS_SPECIALTIES;

export const BRAND_COLORS = [
  { value: '#111118', label: 'Negro' },
  { value: '#e8a4b8', label: 'Rosa' },
  { value: '#d4b8a8', label: 'Nude' },
  { value: '#8fd4a8', label: 'Verde' },
  { value: '#8cb4e8', label: 'Azul' },
  { value: '#8cd8f0', label: 'Celeste' },
  { value: '#b8a8e8', label: 'Violeta' },
  { value: '#78d4d4', label: 'Turquesa' },
  { value: '#f0e088', label: 'Amarillo' },
  { value: '#b8b8c0', label: 'Gris' },
  { value: '#8b2942', label: 'Bordo' },
  { value: '#a08060', label: 'Marrón' },
] as const;

export const BUSINESS_CATEGORIES = [
  { value: 'ESTETICA', label: 'Estética' },
  { value: 'SALUD', label: 'Salud' },
  { value: 'SERVICIOS', label: 'Servicios' },
  { value: 'COMERCIO', label: 'Comercio' },
  { value: 'EDUCACION', label: 'Educación' },
  { value: 'GASTRONOMIA', label: 'Gastronomía' },
  { value: 'FITNESS', label: 'Fitness' },
  { value: 'OTRO', label: 'Otro' },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  {
    value: 'ONLINE_DEPOSIT',
    types: ['ONLINE_DEPOSIT', 'ONLINE_FULL'] as const,
    label: 'Cobro online',
    description: 'Seña o pago total al reservar. Después configurás tu medio de cobro.',
  },
  {
    value: 'TRANSFER',
    types: ['TRANSFER'] as const,
    label: 'Transferencia bancaria',
    description: 'El cliente transfiere y sube el comprobante al reservar.',
  },
  {
    value: 'CASH',
    types: ['CASH'] as const,
    label: 'Pago en el turno',
    description: 'Sin cobro previo. El cliente paga al asistir.',
  },
] as const;

export const SERVICE_PAYMENT_OPTIONS = [
  { value: 'ONLINE_DEPOSIT', label: 'Seña online' },
  { value: 'ONLINE_FULL', label: 'Pago total online' },
  { value: 'NO_PAYMENT', label: 'Sin pago previo' },
] as const;

export type ServicePaymentRequirement = (typeof SERVICE_PAYMENT_OPTIONS)[number]['value'];

export function onboardingPathForStep(step: number): string {
  return ONBOARDING_STEPS.find((item) => item.step === step)?.path ?? 'negocio';
}
