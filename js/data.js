/*
 * Chems Root Pharmaceutical — Seed Data & Constants
 * =================================================
 * Static reference data. Products are persisted in localStorage
 * (and optionally Supabase); this module provides the initial seed.
 */

export const PRODUCT_CATEGORIES = [
  "All",
  "Tablets",
  "Capsules",
  "Syrups",
  "Injections",
  "Topical",
  "Drops & Solutions",
];

export const PRODUCT_LABELS = [
  "All",
  "General",
  "Gynecology",
  "Cardiac",
  "Neurology",
  "Orthopedic",
  "Dermatology",
  "Pediatric",
  "Gastroenterology",
];

// Map label → color tokens for visual pills/tags.
export const LABEL_COLORS = {
  General: { bg: "rgba(100,116,139,0.12)", text: "#475569", border: "rgba(100,116,139,0.3)" },
  Gynecology: { bg: "rgba(236,72,153,0.12)", text: "#DB2777", border: "rgba(236,72,153,0.3)" },
  Cardiac: { bg: "rgba(239,68,68,0.12)", text: "#DC2626", border: "rgba(239,68,68,0.3)" },
  Neurology: { bg: "rgba(139,92,246,0.12)", text: "#7C3AED", border: "rgba(139,92,246,0.3)" },
  Orthopedic: { bg: "rgba(217,119,6,0.12)", text: "#D97706", border: "rgba(217,119,6,0.3)" },
  Dermatology: { bg: "rgba(13,148,136,0.12)", text: "#0D9488", border: "rgba(13,148,136,0.3)" },
  Pediatric: { bg: "rgba(37,99,235,0.12)", text: "#2563EB", border: "rgba(37,99,235,0.3)" },
  Gastroenterology: { bg: "rgba(5,150,105,0.12)", text: "#059669", border: "rgba(5,150,105,0.3)" },
};

// Admin credentials (in production, this would be server-side).
export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "chemsroot@2026",
};

// Default image map by category.
export const CATEGORY_IMAGES = {
  Tablets: "assets/pharma_tablets.png",
  Capsules: "assets/pharma_capsules.png",
  Syrups: "assets/pharma_syrup.png",
  Injections: "assets/pharma_injection.png",
  Topical: "assets/pharma_cream.png",
  "Drops & Solutions": "assets/pharma_drops.png",
};

export const SEED_PRODUCTS = [
  { id: "CR-TAB-001", name: "ChemsRoot Paracetamol 500mg", composition: "Paracetamol IP 500mg", description: "Effective relief from fever and mild to moderate pain.", price: 35.0, category: "Tablets", labels: ["General"], image: "assets/pharma_tablets.png", badge: "Bestseller", packaging: "Strip of 10 tablets" },
  { id: "CR-TAB-002", name: "ChemsRoot Amoxicillin 250mg", composition: "Amoxicillin Trihydrate IP eq. to Amoxicillin 250mg", description: "Broad-spectrum antibiotic for bacterial infections.", price: 85.0, category: "Tablets", labels: ["General"], image: "assets/pharma_tablets.png", badge: "", packaging: "Strip of 10 tablets" },
  { id: "CR-TAB-003", name: "ChemsRoot Cetirizine 10mg", composition: "Cetirizine Dihydrochloride IP 10mg", description: "Non-drowsy antihistamine for allergy relief.", price: 45.0, category: "Tablets", labels: ["General"], image: "assets/pharma_tablets.png", badge: "Popular", packaging: "Strip of 10 tablets" },
  { id: "CR-TAB-004", name: "ChemsRoot Metformin 500mg", composition: "Metformin Hydrochloride IP 500mg", description: "Oral antidiabetic for Type 2 diabetes management.", price: 55.0, category: "Tablets", labels: ["General"], image: "assets/pharma_tablets.png", badge: "", packaging: "Strip of 15 tablets" },
  { id: "CR-TAB-005", name: "ChemsRoot Atorvastatin 10mg", composition: "Atorvastatin Calcium IP eq. to Atorvastatin 10mg", description: "Lipid-lowering agent for cholesterol management and cardiovascular protection.", price: 72.0, category: "Tablets", labels: ["Cardiac"], image: "assets/pharma_tablets.png", badge: "", packaging: "Strip of 10 tablets" },
  { id: "CR-TAB-006", name: "ChemsRoot Amlodipine 5mg", composition: "Amlodipine Besylate IP eq. to Amlodipine 5mg", description: "Calcium channel blocker for hypertension and angina.", price: 48.0, category: "Tablets", labels: ["Cardiac"], image: "assets/pharma_tablets.png", badge: "Popular", packaging: "Strip of 10 tablets" },
  { id: "CR-TAB-007", name: "ChemsRoot Folic Acid 5mg", composition: "Folic Acid IP 5mg", description: "Essential prenatal supplement for neural tube defect prevention.", price: 30.0, category: "Tablets", labels: ["Gynecology"], image: "assets/pharma_tablets.png", badge: "", packaging: "Strip of 30 tablets" },
  { id: "CR-TAB-008", name: "ChemsRoot Progesterone 200mg", composition: "Natural Micronized Progesterone 200mg soft gelatin capsule", description: "Hormonal support for luteal phase and pregnancy maintenance.", price: 280.0, category: "Capsules", labels: ["Gynecology"], image: "assets/pharma_capsules.png", badge: "New", packaging: "Strip of 10 capsules" },
  { id: "CR-TAB-009", name: "ChemsRoot Gabapentin 300mg", composition: "Gabapentin IP 300mg", description: "Anticonvulsant for neuropathic pain and seizure management.", price: 115.0, category: "Capsules", labels: ["Neurology"], image: "assets/pharma_capsules.png", badge: "", packaging: "Strip of 10 capsules" },
  { id: "CR-CAP-001", name: "ChemsRoot Omeprazole 20mg", composition: "Omeprazole IP 20mg (enteric-coated)", description: "Proton pump inhibitor for gastric acid reduction.", price: 95.0, category: "Capsules", labels: ["Gastroenterology"], image: "assets/pharma_capsules.png", badge: "", packaging: "Strip of 10 capsules" },
  { id: "CR-CAP-002", name: "ChemsRoot Vitamin D3 60000 IU", composition: "Cholecalciferol (Vitamin D3) 60000 IU", description: "High-potency Vitamin D3 for bone health and immunity.", price: 120.0, category: "Capsules", labels: ["Orthopedic"], image: "assets/pharma_capsules.png", badge: "Popular", packaging: "Strip of 4 capsules" },
  { id: "CR-CAP-003", name: "ChemsRoot Calcium + D3", composition: "Calcium Carbonate 1250mg, Vitamin D3 250 IU", description: "Dual-action bone health supplement with calcium and vitamin D.", price: 145.0, category: "Tablets", labels: ["Orthopedic", "General"], image: "assets/pharma_tablets.png", badge: "", packaging: "Strip of 15 tablets" },
  { id: "CR-SYR-001", name: "ChemsRoot Cough Linctus", composition: "Dextromethorphan HBr 10mg + Chlorpheniramine Maleate 2mg per 5ml", description: "Soothing relief from dry and productive cough.", price: 75.0, category: "Syrups", labels: ["General"], image: "assets/pharma_syrup.png", badge: "Bestseller", packaging: "100ml bottle" },
  { id: "CR-SYR-002", name: "ChemsRoot Iron Tonic", composition: "Ferrous Ascorbate 30mg + Folic Acid 550mcg per 5ml", description: "Iron supplement syrup for anemia in pregnancy.", price: 130.0, category: "Syrups", labels: ["Gynecology"], image: "assets/pharma_syrup.png", badge: "", packaging: "200ml bottle" },
  { id: "CR-SYR-003", name: "ChemsRoot Pediatric Multivitamin", composition: "Multivitamin + Multimineral + Lysine syrup", description: "Complete daily nutrition syrup for children with delicious mango flavor.", price: 155.0, category: "Syrups", labels: ["Pediatric"], image: "assets/pharma_syrup.png", badge: "New", packaging: "200ml bottle" },
  { id: "CR-INJ-001", name: "ChemsRoot B-Complex Injection", composition: "Vitamin B1 + B2 + B3 + B5 + B6 + B12 injection", description: "Vitamin B-Complex injection for rapid nutrient replenishment.", price: 65.0, category: "Injections", labels: ["General"], image: "assets/pharma_injection.png", badge: "", packaging: "2ml ampoule" },
  { id: "CR-INJ-002", name: "ChemsRoot Oxytocin 5 IU", composition: "Oxytocin IP 5 IU/ml", description: "Uterotonic injection for labor induction and postpartum hemorrhage.", price: 22.0, category: "Injections", labels: ["Gynecology"], image: "assets/pharma_injection.png", badge: "", packaging: "1ml ampoule" },
  { id: "CR-TOP-001", name: "ChemsRoot Diclofenac Gel 1%", composition: "Diclofenac Diethylamine 1.16% w/w + Linseed Oil 3% + Methyl Salicylate 10%", description: "Topical NSAID gel for joint and muscle pain relief.", price: 110.0, category: "Topical", labels: ["Orthopedic", "General"], image: "assets/pharma_cream.png", badge: "Popular", packaging: "30g tube" },
  { id: "CR-TOP-002", name: "ChemsRoot Clotrimazole Cream 1%", composition: "Clotrimazole IP 1% w/w", description: "Antifungal cream for skin infections and dermatitis.", price: 85.0, category: "Topical", labels: ["Dermatology"], image: "assets/pharma_cream.png", badge: "", packaging: "15g tube" },
  { id: "CR-DRP-001", name: "ChemsRoot Eye Drops (Moxifloxacin)", composition: "Moxifloxacin Hydrochloride 0.5% w/v (sterile)", description: "Ophthalmic antibiotic for bacterial conjunctivitis.", price: 95.0, category: "Drops & Solutions", labels: ["General"], image: "assets/pharma_drops.png", badge: "New", packaging: "5ml bottle" },
];
