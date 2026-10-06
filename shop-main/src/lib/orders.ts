import { apiFetch } from "./api-client";
import { DbAddress } from "./addresses";
import { CartItem } from "../contexts/CartContext";

export type OrderStatus =
  | "Processing"
  | "Dispatched"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  sku?: string | null;
  variant?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url: string | null;
  mrp?: number | null;
  batch_no?: string | null;
  expiry_date?: string | null;
}

export interface DbOrder {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: Partial<DbAddress>;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  order_items?: DbOrderItem[];
  user_role?: "retailer" | "customer" | "admin";
  shop_name?: string | null;
  delivery_partner_id?: string | null;
  delivery_accepted_at?: string | null;
  delivery_status?: string | null;
  delivery_partner_name?: string | null;
  delivery_partner_phone?: string | null;
  invoice_number?: string | null;
}

export function getDisplayStatus(order: DbOrder, partnerName?: string): string {
  const effectivePartner = partnerName || order.delivery_partner_name;
  if (order.delivery_status === "accepted" && effectivePartner) {
    return `Accepted by ${effectivePartner}`;
  }
  if (order.delivery_status === "picked_up" && effectivePartner) {
    return `Picked up by ${effectivePartner}`;
  }
  return order.status;
}

export async function placeOrder(params: {
  customerName: string;
  customerPhone: string;
  shippingAddress: Partial<DbAddress>;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  userId?: string;
  userRole?: "retailer" | "customer" | "admin";
  shopName?: string | null;
  idempotencyKey?: string;
}): Promise<{ data: DbOrder | null; error: string | null }> {
  try {
    const payload = {
      idempotencyKey: params.idempotencyKey || crypto.randomUUID(),
      cartItems: params.items.map((item) => ({ ...item, productNumericId: item.productNumericId, productId: item.productId || null })),
      customerName: params.customerName || "Customer",
      customerPhone: params.customerPhone || "+91 98765 00000",
      shippingAddress: {
        ...(params.shippingAddress || {}),
        user_role: params.userRole || "customer",
        shop_name: params.shopName || null,
      },
      paymentType: params.userRole === 'retailer' ? 'COD' : params.paymentMethod,
      totalAmount: params.totalAmount,
      userRole: params.userRole,
      shopName: params.shopName
    };

    const response = await apiFetch<{ data: DbOrder }>("/api/v1/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "Failed to place order" };
  }
}

export async function fetchUserOrders(userId?: string): Promise<DbOrder[]> {
  try {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    const response = await apiFetch<{ data: DbOrder[] }>(`/api/v1/orders${query}`);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

export async function fetchAllOrders(): Promise<DbOrder[]> {
  try {
    const response = await apiFetch<{ data: DbOrder[] }>("/api/v1/orders");
    return response.data || [];
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to update order status" };
  }
}

export async function deleteOrder(orderId: string): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/orders/${encodeURIComponent(orderId)}`, {
      method: "DELETE",
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to delete order" };
  }
}

export async function fetchOrderByNumber(orderNumberOrId: string): Promise<DbOrder | null> {
  try {
    const isNumber = orderNumberOrId.startsWith("ORD-");
    const query = isNumber ? `?orderNumber=${encodeURIComponent(orderNumberOrId)}` : `?orderId=${encodeURIComponent(orderNumberOrId)}`;
    const response = await apiFetch<{ data: DbOrder[] }>(`/api/v1/orders${query}`);
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export function subscribeToUserOrdersRealtime(_userId: string, onUpdate: () => void) {
  // To be implemented using WebSocket as per architecture docs
  return () => {};
}

export function subscribeToOrdersRealtime(onUpdate: (payload: any) => void) {
  // To be implemented using WebSocket as per architecture docs
  return () => {};
}
