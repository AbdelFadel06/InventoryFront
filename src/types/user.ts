// src/types/user.ts
export type Gender = "M" | "F" | "O";
export type UserRole = "SUPER_ADMIN" | "SHOP_MANAGER" | "EMPLOYEE" | "LIVREUR";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string | null;
  gender: Gender | null;
  date_of_birth: string | null;       // ISO date "YYYY-MM-DD"
  profile_picture: string | null;     // URL
  role: UserRole;
  shop: number | null;                // FK id
  shop_name?: string;                 // read_only
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  username?: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  gender?: Gender;
  date_of_birth?: string;
  role?: UserRole;
  shop?: number;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  gender?: Gender;
  date_of_birth?: string;
  profile_picture?: File;
}

export interface ChangePassword {
  old_password: string;
  new_password: string;
  confirm_password: string;
}
