// src/types/stock.ts
export type StockStatus = "ok" | "low" | "critical" | "out_of_stock";

export type MovementType =
  | "entry" | "exit"
  | "transfer_out" | "transfer_in"
  | "adjustment" | "return"
  | "damage" | "inventory";

export type TransferStatus = "pending" | "in_transit" | "received" | "cancelled";

// ── Stock ────────────────────────────────────────────────────────
export interface Stock {
  id: number;
  product: number;
  product_name?: string;
  product_sku?: string;
  shop: number;
  shop_name?: string;
  quantity: number;
  stock_status: StockStatus;        // @property Django
  is_low_stock: boolean;
  needs_reorder: boolean;
  stock_value?: string;             // @property Django
  last_updated: string;
}

export interface StockAdjust {
  product: number;
  shop: number;
  new_quantity: number;
  reason: string;
}

// ── Stock Movement ───────────────────────────────────────────────
export interface StockMovement {
  id: number;
  product: number;
  product_name?: string;
  shop: number;
  shop_name?: string;
  movement_type: MovementType;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  related_shop: number | null;
  reference: string | null;
  reason: string | null;
  notes: string | null;
  unit_price: string | null;
  created_at: string;
  created_by: number | null;
}

export interface StockMovementCreate {
  product: number;
  shop: number;
  quantity: number;
  movement_type?: MovementType;
  reference?: string;
  reason?: string;
  notes?: string;
  unit_price?: number;
}

// ── Stock Transfer ───────────────────────────────────────────────
export interface StockTransfer {
  id: number;
  reference: string;
  from_shop: number;
  from_shop_name?: string;
  to_shop: number;
  to_shop_name?: string;
  product: number;
  product_name?: string;
  quantity: number;
  status: TransferStatus;
  notes: string | null;
  created_at: string;
  sent_at: string | null;
  received_at: string | null;
  created_by: number | null;
  received_by: number | null;
}

export interface StockTransferCreate {
  from_shop: number;
  to_shop: number;
  product: number;
  quantity: number;
  notes?: string;
}
