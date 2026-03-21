// src/types/category.ts
export interface Category {
  id: number;
  name: string;
  description: string | null;
  parent: number | null;              // FK id (self)
  parent_name?: string;             // read_only
  full_path?: string;               // @property Django
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  description?: string;
  parent?: number;
  is_active?: boolean;
}
