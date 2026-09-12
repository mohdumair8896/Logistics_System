// ─── Decoupled Agent Core — Registry & Bootstrap ─────────────────────────────
// Registers all 7 independent agent modules with the central Event Bus.

import { eventBus } from './eventBus';
import { shipmentAgent } from '../modules/shipment';
import { driverAgent } from '../modules/driver';
import { customerAgent } from '../modules/customer';
import { exceptionAgent } from '../modules/exception';
import { documentationAgent } from '../modules/documentation';
import { billingAgent } from '../modules/billing';
import { collectionsAgent } from '../modules/collections';

let isInitialized = false;

export function initializeAutonomousAgents() {
  if (isInitialized) return eventBus;

  // Register all 7 agents — purely decoupled via event bus
  eventBus.registerAgent(shipmentAgent);
  eventBus.registerAgent(driverAgent);
  eventBus.registerAgent(customerAgent);
  eventBus.registerAgent(exceptionAgent);
  eventBus.registerAgent(documentationAgent);
  eventBus.registerAgent(billingAgent);
  eventBus.registerAgent(collectionsAgent);

  isInitialized = true;
  return eventBus;
}

// Auto-initialize on import
export const agents = initializeAutonomousAgents();
