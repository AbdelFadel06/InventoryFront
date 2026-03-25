// src/types/sales.ts

export type SaleType       = "direct" | "delivery";
export type PaymentMethod  = "cash" | "mobile_money" | "on_delivery";
export type PaymentStatus  = "paid" | "pending";
export type SaleStatus     = "completed" | "cancelled";
export type SessionStatus  = "active" | "closed";
export type PeriodType     = "daily" | "weekly";

export interface CashierSession {
  id:              number;
  shop:            number;
  shop_name:       string;
  cashier:         number;
  cashier_name:    string;
  created_by?:     number;
  created_by_name?: string;
  period_type:     PeriodType;
  start_date:      string;
  end_date:        string;
  status:          SessionStatus;
  is_active:       boolean;
  notes?:          string;
  sales_count:     number;
  total_sales:     number;
  created_at:      string;
  closed_at?:      string;
}

export interface SaleItem {
  id:              number;
  product:         number;
  product_name:    string;
  product_sku:     string;
  product_unit:    string;
  quantity:        number;
  unit_price:      number;
  discount_type?:  "fixed" | "percent" | null;
  discount_value:  number;
  discount_amount: number;
  subtotal:        number;
  total_price:     number;
}

export interface Sale {
  id:               number;
  reference:        string;
  shop:             number;
  shop_name:        string;
  session:          number;
  cashier:          number;
  cashier_name:     string;
  sale_type:        SaleType;
  sale_type_label:  string;
  payment_method:   PaymentMethod;
  payment_label:    string;
  payment_status:   PaymentStatus;
  livreur?:         number;
  livreur_name?:    string;
  delivery_address?: string;
  delivered_at?:    string;
  subtotal:         number;
  total_discount:   number;
  total_amount:     number;
  status:           SaleStatus;
  notes?:           string;
  items:            SaleItem[];
  items_count:      number;
  created_at:       string;
  updated_at:       string;
}

export interface SaleItemInput {
  product:        number;
  product_name:   string;
  product_sku:    string;
  unit_price:     number;
  quantity:       number;
  discount_type?: "fixed" | "percent" | null;
  discount_value: number;
}

export interface SaleCreateInput {
  sale_type:        SaleType;
  payment_method:   PaymentMethod;
  livreur?:         number;
  delivery_address?: string;
  notes?:           string;
  items:            { product: number; quantity: number; discount_type?: string; discount_value?: number }[];
}

export interface Expense {
  id:              number;
  session:         number;
  shop:            number;
  label:           string;
  amount:          number;
  sale_date:       string;
  created_by?:     number;
  created_by_name?: string;
  created_at:      string;
}

export interface ProductRecap {
  product__id:       number;
  product__name:     string;
  product__sku:      string;
  product__unit:     string;
  total_qty:         number;
  total_subtotal:    number;
  total_discount:    number;
  total_amount:      number;
}

export interface LiveurPoint {
  livreur_id:   number;
  livreur_name: string;
  total:        number;
  paid:         number;
  pending:      number;
  count:        number;
}

export interface DailyReport {
  date:    string;
  summary: {
    total_sales:         number;
    total_amount:        number;
    total_discount:      number;
    cash_total:          number;
    momo_total:          number;
    deliveries_paid:     number;
    deliveries_pending:  number;
    total_expenses:      number;
    total_collected:     number;
    net_total:           number;
  };
  products_recap: ProductRecap[];
  by_livreur:     LiveurPoint[];
  expenses:       Expense[];
}
