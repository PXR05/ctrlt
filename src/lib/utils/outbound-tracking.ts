import { browser } from "$app/environment";

export interface OutboundEvent {
  id: string;
  url: string;
  timestamp: number;
  type: "search" | "navigation" | "shortcut";
  metadata: {
    query?: string;
    engine?: string;
    shortcutName?: string;
    userAgent: string;
    referrer: string;
  };
}

const STORAGE_KEY = "ctrlt.outbound";
const MAX_EVENTS = 1000;

class OutboundTracker {
  private events: OutboundEvent[] = [];
  private initialized = false;

  constructor() {
    if (browser) {
      this.loadEvents();
      this.initialized = true;
    }
  }

  private loadEvents(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
        if (this.events.length > MAX_EVENTS) {
          this.events = this.events.slice(-MAX_EVENTS);
          this.saveEvents();
        }
      }
    } catch (error) {
      console.error("Failed to load outbound tracking events:", error);
      this.events = [];
    }
  }

  private saveEvents(): void {
    if (!browser) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error("Failed to save outbound tracking events:", error);
    }
  }

  private addEvent(event: Omit<OutboundEvent, "id" | "timestamp">): void {
    if (!this.initialized) return;

    const newEvent: OutboundEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    this.events.push(newEvent);

    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(-MAX_EVENTS);
    }

    this.saveEvents();
  }

  trackSearch(url: string, query: string, engine: string): void {
    this.addEvent({
      url,
      type: "search",
      metadata: {
        query,
        engine,
        userAgent: navigator.userAgent,
        referrer: document.referrer || window.location.href,
      },
    });
  }

  trackNavigation(url: string, source?: string): void {
    this.addEvent({
      url,
      type: "navigation",
      metadata: {
        userAgent: navigator.userAgent,
        referrer: source || document.referrer || window.location.href,
      },
    });
  }

  trackShortcut(url: string, shortcutName: string): void {
    this.addEvent({
      url,
      type: "shortcut",
      metadata: {
        shortcutName,
        userAgent: navigator.userAgent,
        referrer: document.referrer || window.location.href,
      },
    });
  }

  getEvents(): OutboundEvent[] {
    return [...this.events];
  }

  getEventsByType(type: OutboundEvent["type"]): OutboundEvent[] {
    return this.events.filter((event) => event.type === type);
  }

  getRecentEvents(limit: number = 50): OutboundEvent[] {
    return this.events.slice(-limit);
  }

  clearEvents(): void {
    this.events = [];
    if (browser) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  getStats() {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const today = this.events.filter((e) => e.timestamp > dayAgo);
    const thisWeek = this.events.filter((e) => e.timestamp > weekAgo);

    return {
      total: this.events.length,
      today: today.length,
      thisWeek: thisWeek.length,
      byType: {
        search: this.events.filter((e) => e.type === "search").length,
        navigation: this.events.filter((e) => e.type === "navigation").length,
        shortcut: this.events.filter((e) => e.type === "shortcut").length,
      },
    };
  }
}

export const outboundTracker = new OutboundTracker();
