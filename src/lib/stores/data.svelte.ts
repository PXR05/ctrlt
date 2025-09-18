import { browser } from "$app/environment";
import type { ZodSchema } from "zod";

/**
 * Configuration for a localStorage store
 */
interface StorageConfig<T> {
  key: string;
  defaultValue: T;
  schema?: ZodSchema<T>;
  maxItems?: number;
}

/**
 * Options for creating a localStorage store
 */
interface StorageOptions {
  debounceMs?: number;
}

/**
 * Creates a reactive localStorage store with automatic persistence
 * @param config Configuration object containing key, default value, and Zod schema
 * @param options Optional configuration for debouncing and other features
 * @returns Object with data state and methods to manipulate it
 */
export function createStorageStore<T>(
  config: StorageConfig<T>,
  options: StorageOptions = {}
) {
  const { key, defaultValue, schema, maxItems } = config;
  const { debounceMs = 300 } = options;

  let data = $state<T>(defaultValue);
  let initialized = $state(false);
  let saveTimeout: number | undefined;

  /**
   * Load data from localStorage with validation
   */
  function loadFromStorage(): T {
    if (!browser) return defaultValue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;

      const parsed = JSON.parse(raw);

      // Validate with Zod schema if provided
      if (schema) {
        const result = schema.safeParse(parsed);
        if (!result.success) {
          console.warn(
            `Invalid data found in localStorage for key: ${key}`,
            result.error
          );
          return defaultValue;
        }

        // Apply maxItems limit if specified and data is an array
        if (maxItems && Array.isArray(result.data)) {
          return result.data.slice(0, maxItems) as T;
        }

        return result.data;
      }

      // Apply maxItems limit if specified and data is an array (no schema validation)
      if (maxItems && Array.isArray(parsed)) {
        return parsed.slice(0, maxItems) as T;
      }

      return parsed as T;
    } catch (error) {
      console.error(`Error loading from localStorage (key: ${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * Save data to localStorage with debouncing
   */
  function saveToStorage(value: T) {
    if (!browser) return;

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Debounce the save operation
    saveTimeout = setTimeout(() => {
      try {
        let valueToSave = value;

        // Apply maxItems limit if specified and value is an array
        if (maxItems && Array.isArray(value)) {
          valueToSave = value.slice(0, maxItems) as T;
        }

        localStorage.setItem(key, JSON.stringify(valueToSave));
      } catch (error) {
        console.error(`Error saving to localStorage (key: ${key}):`, error);
      }
    }, debounceMs);
  }

  /**
   * Initialize the store by loading data from localStorage
   */
  function initialize() {
    if (initialized || !browser) return;
    data = loadFromStorage();
    initialized = true;
  }

  /**
   * Update the data and trigger save
   */
  function setData(newData: T) {
    data = newData;
    if (initialized) {
      saveToStorage(data);
    }
  }

  /**
   * Update data using a function
   */
  function updateData(updater: (current: T) => T) {
    setData(updater(data));
  }

  /**
   * Reset data to default value
   */
  function reset() {
    setData(defaultValue);
  }

  /**
   * Clear data from localStorage
   */
  function clear() {
    if (browser) {
      localStorage.removeItem(key);
    }
    reset();
  }

  $effect(() => {
    if (browser && !initialized) {
      initialize();
    }
  });

  $effect(() => {
    if (browser && initialized) {
      saveToStorage(data);
    }
  });

  return {
    get data() {
      return data;
    },
    get initialized() {
      return initialized;
    },
    setData,
    updateData,
    reset,
    clear,
    initialize,
  };
}
