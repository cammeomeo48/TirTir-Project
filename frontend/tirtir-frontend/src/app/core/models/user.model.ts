export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isEmailVerified?: boolean;
  avatar?: string;
  phone?: string;
  gender?: 'Male' | 'Female' | 'Other';
  birthDate?: Date | string;
  addresses?: any[]; // Address array, imported separately to avoid circular dependency
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
}
