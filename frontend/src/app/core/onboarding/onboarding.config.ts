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
  { value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Índigo violeta' },
  { value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', label: 'Rosa fucsia' },
  { value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', label: 'Azul celeste' },
  { value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', label: 'Verde menta' },
  { value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', label: 'Peach dorado' },
  { value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', label: 'Lila suave' },
  { value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', label: 'Nude durazno' },
  { value: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', label: 'Azul hielo' },
  { value: 'linear-gradient(135deg, #fd7043 0%, #e53935 100%)', label: 'Rojo coral' },
  { value: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', label: 'Turquesa noche' },
  { value: 'linear-gradient(135deg, #2d3561 0%, #c05c7e 100%)', label: 'Azul bordo' },
  { value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', label: 'Noche oscura' },
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
    label: 'Mercado Pago',
    description: 'Cobro con Mercado Pago.',
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
