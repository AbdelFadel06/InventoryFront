// src/types/inventory.ts
export type InventoryStatus =
  | "draft" | "in_progress"
  | "completed" | "validated" | "cancelled";

export type DiscrepancyStatus = "not_counted" | "ok" | "surplus" | "shortage";

// ── Inventory ────────────────────────────────────────────────────
export interface Inventory {
  id: number;
  reference: string;
  shop: number;
  shop_name?: string;
  inventory_date: string;           // "YYYY-MM-DD"
  status: InventoryStatus;
  notes: string | null;
  total_products: number;           // @property Django
  products_counted: number;         // @property Django
  counting_progress: number;        // @property Django
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  validated_at: string | null;
  created_by: number | null;
  validated_by: number | null;
}

export interface InventoryCreate {
  shop: number;
  inventory_date: string;
  notes?: string;
}

// ── Inventory Line ───────────────────────────────────────────────
export interface InventoryLine {
  id: number;
  inventory: number;
  product: number;
  product_name?: string;
  expected_quantity: number;
  counted_quantity: number | null;
  is_counted: boolean;
  notes: string | null;
  difference: number;               // @property Django
  difference_percentage: number;    // @property Django
  discrepancy_status: DiscrepancyStatus;
  counted_at: string | null;
  counted_by: number | null;
}

export interface CountProductPayload {
  line_id: number;
  counted_quantity: number;
  notes?: string;
}

export interface CountMultiplePayload {
  counts: CountProductPayload[];
}

export interface AddProductsPayload {
  product_ids?: number[];
  add_all?: boolean;
}

// ── Discrepancy response ─────────────────────────────────────────
export interface InventoryDiscrepancyResponse {
  inventory: string;
  total_discrepancies: number;
  total_shortage: number;
  total_surplus: number;
  adjustment_value: number;
  discrepancies: InventoryLine[];
}

export interface InventoryStatistics {
  total_inventories: number;
  by_status: Record<InventoryStatus, { label: string; count: number }>;
}
