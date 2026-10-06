import { apiFetch } from "./api-client";

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  hsn_code: string;
  accent_color: string;
  description: string | null;
  created_at: string;
}

export interface DbProduct {
  id: string;
  numeric_id: number;
  name: string;
  subtitle: string | null;
  category_id: string | null;
  category_name: string;
  sub_category_id?: string | null;
  sub_category_name?: string | null;
  brand: string;
  sku: string | null;
  hsn: string;
  mrp: number;
  customer_price: number;
  retailer_price: number;
  discount_percent: number;
  retailer_discount_percent: number;
  stock: number;
  image_url: string;
  web_image_url?: string;
  details: string | null;
  is_flash_sale: boolean;
  is_featured: boolean;
  is_listed?: boolean;
  badges?: any[];
  purchase_price?: number;
  return_policy?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbInventoryProduct extends DbProduct {
  batch_no?: string | null;
  min_stock_level?: number;
  unit?: string;
  dosage_form?: string;
  strength?: string | null;
  expiry_date?: string | null;
  gallery_images?: any[];
  description?: string | null;
  is_active?: boolean;
  meta_data?: Record<string, any>;
}

export interface ProductFilters {
  category?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: "featured" | "price-asc" | "price-desc" | "discount";
  includeUnlisted?: boolean;
  isAdmin?: boolean;
}

export async function fetchCategories(): Promise<DbCategory[]> {
  try {
    const response = await apiFetch<{ data: DbCategory[] }>("/api/v1/categories");
    return response.data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<DbProduct[]> {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append("q", filters.search);
    if (filters.category && filters.category !== "All") params.append("category", filters.category);
    if (filters.includeUnlisted) params.append("includeUnlisted", "true");
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    
    const response = await apiFetch<{ data: DbProduct[] }>(`/api/v1/products?${params.toString()}`);
    let prods = response.data || [];

    if (filters.brand && filters.brand.length > 0) {
      prods = prods.filter((p) => filters.brand?.includes(p.brand));
    }
    if (filters.minPrice !== undefined) {
      prods = prods.filter((p) => p.customer_price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== Infinity) {
      prods = prods.filter((p) => p.customer_price <= filters.maxPrice!);
    }

    return prods;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function createProduct(product: Partial<DbProduct>): Promise<{ data: DbProduct | null; error: string | null }> {
  try {
    const response = await apiFetch<{ data: DbProduct }>("/api/v1/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "Failed to create product" };
  }
}

export async function updateProduct(id: string, updates: Partial<DbProduct>): Promise<{ data: DbProduct | null; error: string | null }> {
  try {
    const response = await apiFetch<{ data: DbProduct }>(`/api/v1/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "Failed to update product" };
  }
}

export async function toggleProductListing(id: string, isListed: boolean): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_listed: isListed }),
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to update listing status" };
  }
}

export async function deleteProduct(id: string): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/products/${id}`, {
      method: "DELETE",
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to delete product" };
  }
}

export async function updateProductStock(id: string, newStock: number): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ stock: newStock }),
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to update stock" };
  }
}

export async function fetchInventoryProducts(): Promise<DbInventoryProduct[]> {
  try {
    const response = await apiFetch<{ data: DbInventoryProduct[] }>("/api/v1/inventory");
    return response.data || [];
  } catch (error) {
    console.error("Error fetching inventory products:", error);
    return [];
  }
}

export function subscribeToProductsRealtime(
  callback: (payload: { eventType: string; new: DbProduct; old: Partial<DbProduct> }) => void
) {
  const pollInterval = setInterval(async () => {
    if (document.visibilityState === "visible") {
      try {
        const latest = await fetchProducts();
        if (latest && latest.length > 0) {
          latest.forEach((p) => {
            callback({ eventType: "UPDATE", new: p, old: { id: p.id } });
          });
        }
      } catch (e) {}
    }
  }, 25000);

  return () => {
    clearInterval(pollInterval);
  };
}
