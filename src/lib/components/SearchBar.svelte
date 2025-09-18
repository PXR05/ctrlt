<script lang="ts">
  import * as Select from "$lib/components/ui/select/index.js";
  import { GlobeIcon, SearchIcon } from "@lucide/svelte";
  import { Input } from "$lib/components/ui/input";
  import { engines } from "$lib/data/default.js";
  import { getSuggestions } from "./search.remote";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { createStorageStore } from "$lib/stores/data.svelte.js";
  import { z } from "zod";

  interface Suggestion {
    phrase: string;
    type: "QUERY" | "NAVIGATION";
  }

  const engineNameSchema = z
    .string()
    .refine((name) => engines.some((e) => e.name === name), {
      message: "Invalid engine name",
    });

  const engineStore = createStorageStore(
    {
      key: "searchbar.engine",
      defaultValue: engines[0].name,
      schema: engineNameSchema,
    },
    { debounceMs: 100 }
  );

  let query = $state("");
  let suggestions: Suggestion[] = $state([]);
  let showSuggestions = $state(false);
  let selectedIndex = $state(0);
  let isInitialized = $state(false);

  const selectedEngine = $derived(engineStore.data);
  const currentEngine = $derived(
    engines.find((e) => e.name === selectedEngine)
  );

  $effect(() => {
    if (browser && !isInitialized && engineStore.initialized) {
      const urlQuery = page.url.searchParams.get("q") || "";
      const urlEngine = page.url.searchParams.get("engine");

      if (urlQuery) {
        query = urlQuery;
      }

      if (urlEngine && engines.some((e) => e.name === urlEngine)) {
        engineStore.setData(urlEngine);
      }

      isInitialized = true;
    }
  });

  $effect(() => {
    if (browser && isInitialized) {
      const searchParams = new URLSearchParams();

      if (query.trim()) {
        searchParams.set("q", query.trim());
      }

      if (selectedEngine && selectedEngine !== engines[0].name) {
        searchParams.set("engine", selectedEngine);
      }

      const newUrl = searchParams.toString()
        ? `${page.url.pathname}?${searchParams.toString()}`
        : page.url.pathname;

      if (newUrl !== page.url.pathname + page.url.search) {
        goto(newUrl, { replaceState: true, noScroll: true, keepFocus: true });
      }
    }
  });

  function selectSuggestion(suggestion: Suggestion) {
    if (suggestion.type === "NAVIGATION") {
      window.location.href = suggestion.phrase;
      return;
    }
    query = suggestion.phrase;
    showSuggestions = false;
    const engine = engines.find((en) => en.name === selectedEngine);
    if (engine) {
      window.location.href = engine.url + encodeURIComponent(suggestion.phrase);
    }
  }

  let debounceTimeout: number | null = $state(null);
  async function handleInput() {
    if (!currentEngine) return;
    if (debounceTimeout) clearTimeout(debounceTimeout);

    if (query.trim().length === 0) {
      selectedIndex = 0;
      suggestions = [];
      showSuggestions = false;
      return;
    }

    debounceTimeout = setTimeout(async () => {
      const response = await getSuggestions({
        query: query.trim(),
        url: currentEngine.suggestUrl,
      });
      suggestions = response;
      showSuggestions = suggestions.length > 0;
    }, 150);
  }

  function handleKeyDown(
    e: KeyboardEvent & {
      currentTarget: EventTarget & HTMLInputElement;
    }
  ) {
    if (!showSuggestions) {
      const engine = engines.find((en) => en.name === selectedEngine);
      if (engine && query.trim()) {
        window.location.href = engine.url + encodeURIComponent(query.trim());
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === "Escape") {
      e.preventDefault();
      selectedIndex = 0;
      showSuggestions = false;
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    }
  }

  function handleInputFocus() {
    if (suggestions.length > 0 && query.trim()) {
      showSuggestions = true;
    }
  }

  function handleInputBlur() {
    setTimeout(() => {
      showSuggestions = false;
    }, 150);
  }
</script>

<div class="relative">
  <div class="flex items-center">
    <Select.Root
      type="single"
      value={selectedEngine}
      onValueChange={(value) => value && engineStore.setData(value)}
    >
      <Select.Trigger
        hideChevron
        class="aspect-square p-0 bg-transparent border border-r-0 focus:outline-none focus-visible:ring-0 hover:bg-muted transition-colors"
      >
        <img
          src={currentEngine?.icon}
          alt={currentEngine?.name}
          class="size-5 m-auto inline-block"
        />
      </Select.Trigger>
      <Select.Content class="border bg-background w-full" align="start">
        {#each engines as engine (engine.name)}
          {@const selected = engine.name === selectedEngine}
          <Select.Item
            hideCheck
            value={engine.name}
            label={engine.name}
            class="px-3 p-2 hover:bg-muted data-[highlighted]:bg-muted cursor-pointer
              {selected ? 'bg-muted font-medium' : ''}"
          >
            <img
              src={engine.icon}
              alt={engine.name}
              class="size-5 inline-block"
            />
            {engine.name}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    <Input
      type="text"
      placeholder="query..."
      bind:value={query}
      oninput={handleInput}
      onfocus={handleInputFocus}
      onblur={handleInputBlur}
      onkeydown={handleKeyDown}
      class="flex-1 px-3 h-10 bg-transparent placeholder:select-none"
    />
  </div>

  {#if showSuggestions && suggestions.length > 0}
    <div
      class="absolute top-full left-0 right-0 bg-background border border-t-0 rounded-b-md shadow-lg z-50 max-h-56 overflow-y-auto"
    >
      {#each suggestions as suggestion, i}
        <button
          type="button"
          data-selected={i === selectedIndex}
          class="w-full text-left px-3 py-2 hover:bg-muted focus:bg-muted focus:outline-none data-[selected=true]:bg-muted cursor-pointer border-b border-border last:border-b-0"
          onclick={() => selectSuggestion(suggestion)}
        >
          {#if suggestion.type === "NAVIGATION"}
            <GlobeIcon class="size-4 text-muted-foreground inline-block mr-2" />
          {:else}
            <SearchIcon
              class="size-4 text-muted-foreground inline-block mr-2"
            />
          {/if}
          {suggestion.phrase}
        </button>
      {/each}
    </div>
  {/if}
</div>
