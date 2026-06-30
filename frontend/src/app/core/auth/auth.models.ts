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
}

export interface AuthSession {
  accessToken: string;
  email: string;
  businessId: number;
  businessSlug: string;
}
