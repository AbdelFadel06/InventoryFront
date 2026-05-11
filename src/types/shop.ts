// src/types/shop.ts
export interface Shop {
  id: number;
  name: string;
  slogan: string | null;
  logo: string | null;
  ifu: string | null;
  phone_number?: string;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string;
  managers: number[];
  managers_details: ShopManagerDetails[];
  managers_names: string[];
  employees: ShopEmployee[];
  is_active: boolean;
  total_employees: number;
  active_employees: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_name: string | null;
}

export interface ShopAssignment {
  id: number;
  user: number;
  user_name: string;
  shop: number;
  shop_name: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  assigned_by: number | null;
  assigned_by_name: string | null;
  note: string | null;
  created_at: string;
}

export interface ShopCreate {
  name: string;
  slogan?: string;
  ifu?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface ShopUpdate extends Partial<ShopCreate> {}

export interface ShopStatistics {
  total_shops: number;
  active_shops: number;
  inactive_shops: number;
  shops_with_manager: number;
  shops_without_manager: number;
  top_shops_by_employees: Shop[];
}


export interface ShopManagerDetails {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  profile_picture: string | null;
}



export interface ShopEmployee {
  id: number;
  email: string;
  full_name: string;
  role: string;
  shop: number;
  shop_name: string;
  is_active: boolean;
  profile_picture: string | null;
}
