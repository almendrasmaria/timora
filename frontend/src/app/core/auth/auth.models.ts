export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  email: string;
  businessId: number;
  businessSlug: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
}

export interface AuthSession {
  accessToken: string;
  email: string;
  businessId: number;
  businessSlug: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
