// src/types/auth.ts
export interface TokenObtainPair {
  email: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}
