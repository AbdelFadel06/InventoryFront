// src/types/shop.ts
export interface Shop {
  id: number;
  name: string;
  slogan: string | null;
  logo: string | null;
  ifu: string | null;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string;
  manager: number | null;
  manager_details: ShopManagerDetails | null;  // ← champ réel
  employees: ShopEmployee[];
  is_active: boolean;
  total_employees: number;
  active_employees: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_name: string | null;
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
