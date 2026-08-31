import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


export type Product = {
  id: string;
  name: string;
  tag: string | null;
  price: number;
  img: string | null;
  accent: string | null;
  category: string | null;
  summary: string | null;
  description: string | null;
  specs: {
    label: string;
    value: string;
  }[] | null;
  stack: string[] | null;
  stock: number | null;
};

export interface Metric {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  avgOrderValue: number;
};

export type Order = {
  id: string;
  customer_email: string;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  total_amount: number;
  status: "Pending" | "Processing" | "Fulfilled" | "Cancelled";
  created_at?: string;
};

export type OrderItem = {
  id?: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
};