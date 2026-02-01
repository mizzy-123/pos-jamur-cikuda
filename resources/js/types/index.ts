export type * from './auth';

import type { Auth } from './auth';

// Database entities
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'cashier';
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    is_active: boolean;
    products_count?: number;
}

export interface Product {
    id: string;
    categories_id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    category?: Category;
}

export interface Customer {
    id: string;
    name: string;
    phone_number: string;
    address: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: string;
    orders_id: string;
    products_id: string;
    price_at_purchase: number;
    subtotal: number;
    quantity: number;
    created_at: string;
    updated_at: string;
    product?: Product;
}

export interface Order {
    id: string;
    users_id: string;
    customers_id: string;
    total_amount: number;
    shiping_cost: number;
    grand_total: number;
    payment_status: 'UNPAID' | 'PAID' | 'CANCELLED';
    wa_sent_status: 'PENDING' | 'SENT' | 'FAILED';
    notes: string | null;
    created_at: string;
    updated_at: string;
    customer?: Customer;
    user?: User;
    items?: OrderItem[];
}

// Cart types
export interface CartItem {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
}

// Pagination
export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

// Statistics for owner dashboard
export interface DashboardStats {
    todaySales: number;
    todayOrders: number;
    pendingPayments: number;
    failedWa: number;
}

export interface RevenueChartData {
    date: string;
    revenue: number;
    orders: number;
}

export type SharedData = {
    name: string;
    auth: Auth;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
};
