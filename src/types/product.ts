// src/types/product.ts
export type ProductUnit =
  | "piece" | "kg" | "g"
  | "l" | "ml" | "m"
  | "cm" | "box" | "pack" | "other";

export interface ProductImage {
  id: number;
  url: string;
  is_primary: boolean;
  order: number;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  category: number | null;
  category_name?: string;
  images?: ProductImage[];
  primary_image?: string | null;
  cost_price: string;
  selling_price: string;
  unit: ProductUnit;
  minimum_stock: number;
  reorder_level: number;
  shop: number | null;
  shop_name?: string;               // read_only
  is_active: boolean;
  is_low_stock?: boolean;           // @property Django
  current_stock?: number;           // annotated by list view
  profit_margin?: number;           // @property Django
  profit_amount?: string;           // @property Django
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  name: string;
  sku: string;
  cost_price: number;
  selling_price: number;
  unit?: ProductUnit;
  category?: number;
  description?: string;
  barcode?: string;
  minimum_stock?: number;
  reorder_level?: number;
  shop?: number;
}

export interface ProductUpdate extends Partial<ProductCreate> {}

export interface ProductStockByShop {
  product: string;
  sku: string;
  minimum_stock: number;
  reorder_level: number;
  total_stock: number;
  stocks: {
    shop_id: number;
    shop_name: string;
    quantity: number;
    is_low_stock: boolean;
    needs_reorder: boolean;
  }[];
}

export interface BulkUpdatePrices {
  product_ids: number[];
  percentage_increase: number;
}

export interface ProductStatistics {
  total_products: number;
  active_products: number;
  inactive_products: number;
  products_by_category: { category__name: string; count: number }[];
  top_expensive_products: Product[];
}
