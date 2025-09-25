import { browser } from "$app/environment";
import type { ZodSchema } from "zod";

interface StorageConfig<T> {
  key: string;
  defaultValue: T;
  schema?: ZodSchema<T>;
  maxItems?: number;
}

interface StorageOptions {
  debounceMs?: number;
}

export function createStorageStore<T>(
  config: StorageConfig<T>,
  options: StorageOptions = {}
) {
  const { key, defaultValue, schema, maxItems } = config;
  const { debounceMs = 300 } = options;

  let data = $state<T>(defaultValue);
  let initialized = $state(false);
  let saveTimeout: number | undefined;

  function loadFromStorage(): T {
    if (!browser) return defaultValue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;

      const parsed = JSON.parse(raw);

      if (schema) {
        const result = schema.safeParse(parsed);
        if (!result.success) {
          console.warn(
            `Invalid data found in localStorage for key: ${key}`,
            result.error
          );
          return defaultValue;
        }

        if (maxItems && Array.isArray(result.data)) {
          return result.data.slice(0, maxItems) as T;
        }

        return result.data;
      }

      if (maxItems && Array.isArray(parsed)) {
        return parsed.slice(0, maxItems) as T;
      }

      return parsed as T;
    } catch (error) {
      console.error(`Error loading from localStorage (key: ${key}):`, error);
      return defaultValue;
    }
  }

  function saveToStorage(value: T) {
    if (!browser) return;

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
      try {
        let valueToSave = value;

        if (maxItems && Array.isArray(value)) {
          valueToSave = value.slice(0, maxItems) as T;
        }

        localStorage.setItem(key, JSON.stringify(valueToSave));
      } catch (error) {
        console.error(`Error saving to localStorage (key: ${key}):`, error);
      }
    }, debounceMs);
  }

  function initialize() {
    if (initialized || !browser) return;
    data = loadFromStorage();
    initialized = true;
  }

  function setData(newData: T) {
    data = newData;
    if (initialized) {
      saveToStorage(data);
    }
  }

  function updateData(updater: (current: T) => T) {
    setData(updater(data));
  }

  function reset() {
    setData(defaultValue);
  }

  function clear() {
    if (browser) {
      localStorage.removeItem(key);
    }
    reset();
  }

  $effect.pre(() => {
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
