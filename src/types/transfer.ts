// src/types/transfer.ts

export type TransferStatus = "pending" | "in_transit" | "received" | "cancelled";

export interface StockTransfer {
  id:               number;
  reference:        string;
  from_shop:        number;
  from_shop_name:   string;
  to_shop:          number;
  to_shop_name:     string;
  product:          number;
  product_name:     string;
  product_sku:      string;
  quantity:         number;
  status:           TransferStatus;
  status_display:   string;
  notes?:           string;
  created_at:       string;
  sent_at?:         string;
  received_at?:     string;
  created_by?:      number;
  created_by_name?: string;
  received_by?:     number;
  received_by_name?: string;
}

export interface StockTransferCreate {
  from_shop:  number;
  to_shop:    number;
  product:    number;
  quantity:   number;
  notes?:     string;
}
