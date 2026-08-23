export type OrderStatus =
  | "CREATED"
  | "PENDING"
  | "APPROVED"
  | "DECLINED"
  | "VOIDED"
  | "ERROR";

export interface OrderItem {
  productId: string | number;
  name: string;
  quantity: number;
  size?: string | null;
  unitPrice: number;
  subtotal: number;
}

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  addressExtra?: string;
  city: string;
  department: string;
}

export interface Order {
  reference: string;
  status: OrderStatus;

  customer: OrderCustomer;
  items: OrderItem[];

  subtotal: number;
  shipping: number;
  discount: number;
  total: number;

  currency: "COP";

  // RED COMERCIAL
  partnerId?: string | null;
  partnerCode?: string | null;
  commissionRate?: number;
  commissionAmount?: number;

  // WOMPI
  wompiTransactionId?: string;

  createdAt: string;
  updatedAt: string;
}