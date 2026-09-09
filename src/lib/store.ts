'use client';
// ─── DEPRECATED: Monolith Store ───────────────────────────────────────────────
// This file now re-exports everything from src/shared/store/index.ts
// The actual store logic has been moved to the feature-based architecture:
//
//   src/features/vehicles/  → Vehicle types, data, actions
//   src/features/drivers/   → Driver types, data, actions
//   src/features/orders/    → Order types, data, actions
//   src/features/trips/     → Trip types, data, actions
//   src/features/invoices/  → Invoice types, data, actions
//   src/shared/types/       → Shared types (Customer, Product, etc.)
//   src/shared/store/       → Combined Zustand store
//
// All existing imports from '@/lib/store' continue to work unchanged.
// ─────────────────────────────────────────────────────────────────────────────

export {
  useStore,
  type AppState,
  type UserProfile,
  type ShipperLead,
  type KnowledgeBaseItem,
  type Vehicle,
  type Driver,
  type Order,
  type Trip,
  type Invoice,
  type Customer,
  type Product,
  type SystemAlert,
} from '@/shared/store/index';
