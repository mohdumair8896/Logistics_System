// ─── Decoupled Agent Core — Central Logistics Event Bus ───────────────────────
// Completely isolates agents from each other. Communication is purely event-driven.

import { db } from '@/lib/db';
import { agentAuditLogs, agentWorkflows } from '@/lib/schema';
import type { LogisticsEvent, LogisticsEventType, AgentResult, AgentModule } from './types';

type EventHandler = (event: LogisticsEvent) => Promise<AgentResult>;

class LogisticsEventBus {
  private subscribers: Map<LogisticsEventType, Set<EventHandler>> = new Map();
  private registeredAgents: Map<string, AgentModule> = new Map();

  /**
   * Registers an agent module and hooks its subscribed events automatically.
   */
  public registerAgent(agent: AgentModule): void {
    if (this.registeredAgents.has(agent.id)) {
      return;
    }
    this.registeredAgents.set(agent.id, agent);

    for (const eventType of agent.subscribedEvents) {
      this.subscribe(eventType, (evt) => agent.handle(evt));
    }
  }

  /**
   * Subscribe an isolated handler to an event type.
   */
  public subscribe(type: LogisticsEventType, handler: EventHandler): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(handler);

    // Return un-subscriber
    return () => {
      this.subscribers.get(type)?.delete(handler);
    };
  }

  /**
   * Publish an event to all interested subscribers with fault isolation.
   * If any subscriber throws, it is logged and contained without halting other subscribers.
   */
  public async publish(event: LogisticsEvent): Promise<AgentResult[]> {
    const handlers = this.subscribers.get(event.type) || new Set();
    const results: AgentResult[] = [];

    // Persist event in audit ledger
    this.persistEventLog(event).catch((err) => {
      console.error('[EventBus] Audit log error:', err);
    });

    for (const handler of Array.from(handlers)) {
      const startTime = Date.now();
      try {
        const result = await handler(event);
        results.push(result);

        // If the handler emitted sub-events, publish them recursively
        if (result.emittedEvents && result.emittedEvents.length > 0) {
          for (const subEvent of result.emittedEvents) {
            const subResults = await this.publish(subEvent);
            results.push(...subResults);
          }
        }

        // Record workflow run asynchronously
        this.persistWorkflowRun(result, event, Date.now() - startTime).catch((err) => {
          console.error('[EventBus] Workflow log error:', err);
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[EventBus] Isolated error in subscriber for ${event.type}:`, errorMessage);
        results.push({
          success: false,
          agentId: 'unknown-subscriber',
          actionSummary: `Handler execution failed: ${errorMessage}`,
          error: errorMessage,
        });
      }
    }

    return results;
  }

  public getRegisteredAgents(): AgentModule[] {
    return Array.from(this.registeredAgents.values());
  }

  private async persistEventLog(event: LogisticsEvent): Promise<void> {
    try {
      await db.insert(agentAuditLogs).values({
        agentId: 'event-bus',
        eventType: event.type,
        entityId: event.entityId || null,
        message: `Event [${event.type}] published`,
        payload: (event.payload as Record<string, unknown>) || {},
      });
    } catch {
      // Non-fatal
    }
  }

  private async persistWorkflowRun(
    result: AgentResult,
    event: LogisticsEvent,
    durationMs: number
  ): Promise<void> {
    try {
      await db.insert(agentWorkflows).values({
        agentId: result.agentId,
        triggerEvent: event.type,
        status: result.success ? 'COMPLETED' : 'FAILED',
        reasoningSteps: result.reasoningSteps || [],
        outcomeSummary: result.actionSummary,
        durationMs,
      });
    } catch {
      // Non-fatal
    }
  }
}

// Global Singleton Event Bus instance
export const eventBus = new LogisticsEventBus();
