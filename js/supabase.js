/*
 * Supabase sync layer. The client SDK is loaded lazily (dynamic import)
 * so it never blocks first paint and is skipped entirely when remote
 * persistence is disabled.
 */
import { state, saveToStorage } from "./store.js";
import { SEED_PRODUCTS } from "./data.js";
import { showToast } from "./utils.js";

const SUPABASE_URL = "https://ernnvnruesxnroquvede.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybm52bnJ1ZXN4bnJvcXV2ZWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzc2OTYsImV4cCI6MjA5MjYxMzY5Nn0.4wMpVSUPgihN3HwBvNvEk-SOSWFfEhj9Tb0mkeM7qXg";

export const useRemote = SUPABASE_URL !== "YOUR_SUPABASE_URL_HERE";

let clientPromise = null;

// Lazily import the SDK and create the client only once, on first use.
async function getClient() {
  if (!useRemote) return null;
  if (!clientPromise) {
    clientPromise = import("https://esm.sh/@supabase/supabase-js@2")
      .then((mod) => mod.createClient(SUPABASE_URL, SUPABASE_KEY))
      .catch((e) => {
        console.error("Supabase SDK load failed:", e);
        return null;
      });
  }
  return clientPromise;
}

export async function fetchProductsFromRemote() {
  const client = await getClient();
  if (!client) return;
  try {
    const { data, error } = await client.from("products").select("*");
    if (error) throw error;
    if (data && data.length > 0) {
      state.products = data;
      saveToStorage("cr_products", state.products);
    }
  } catch (e) {
    console.error("Supabase fetch products error:", e);
  }
}

export async function fetchOrdersFromRemote() {
  const client = await getClient();
  if (!client) return;
  try {
    const { data, error } = await client.from("orders").select("*");
    if (error) throw error;
    if (data) {
      state.orders = data;
      saveToStorage("cr_orders", state.orders);
    }
  } catch (e) {
    console.error("Supabase fetch orders error:", e);
  }
}

export async function upsertOrderRemote(dbOrder) {
  const client = await getClient();
  if (!client) return;
  const { error } = await client.from("orders").upsert([dbOrder]);
  if (error) console.error("Could not save order to Supabase:", error);
}

export async function deleteProductRemote(id) {
  const client = await getClient();
  if (!client) return { error: null };
  return client.from("products").delete().eq("id", id);
}

export async function upsertProductsRemote(rows) {
  const client = await getClient();
  if (!client) return { error: null };
  return client.from("products").upsert(rows);
}

export async function seedSupabase() {
  const client = await getClient();
  if (!client) {
    alert("Please configure SUPABASE_URL and SUPABASE_KEY in js/supabase.js first.");
    return;
  }
  if (!confirm("This will upload SEED_PRODUCTS to the Supabase database. Are you sure?")) return;

  showToast("info", "Seeding", "Uploading products...");
  try {
    const { error } = await client.from("products").upsert(SEED_PRODUCTS);
    if (error) throw error;
    showToast("success", "Success", "Products seeded to database!");
    await fetchProductsFromRemote();
    const { renderProducts } = await import("./catalog.js");
    renderProducts();
  } catch (err) {
    showToast("error", "Error", err.message);
  }
}
