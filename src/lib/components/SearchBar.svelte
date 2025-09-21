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
  import { slide } from "svelte/transition";
  import { quintInOut } from "svelte/easing";
  import { outboundTracker } from "$lib/utils/outbound-tracking";

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
      key: "ctrlt.searchengine",
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
      outboundTracker.trackNavigation(suggestion.phrase, "search_suggestion");
      window.location.href = suggestion.phrase;
      return;
    }
    query = suggestion.phrase;
    showSuggestions = false;
    const engine = engines.find((en) => en.name === selectedEngine);
    if (engine) {
      const searchUrl = engine.url + encodeURIComponent(suggestion.phrase);
      outboundTracker.trackSearch(searchUrl, suggestion.phrase, selectedEngine);
      window.location.href = searchUrl;
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

    debounceTimeout = setTimeout(
      async () => {
        const response = await getSuggestions({
          query: query.trim(),
          url: currentEngine.suggestUrl,
        });
        suggestions = response;
        showSuggestions = suggestions.length > 0;
      },
      showSuggestions ? 150 : 0
    );
  }

  function handleKeyDown(
    e: KeyboardEvent & {
      currentTarget: EventTarget & HTMLInputElement;
    }
  ) {
    if (!showSuggestions && e.key === "Enter") {
      const engine = engines.find((en) => en.name === selectedEngine);
      if (engine && query.trim()) {
        const searchUrl = engine.url + encodeURIComponent(query.trim());
        outboundTracker.trackSearch(searchUrl, query.trim(), selectedEngine);
        window.location.href = searchUrl;
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
      scrollToSuggestion(selectedIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      scrollToSuggestion(selectedIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (showSuggestions) {
        selectedIndex = 0;
        showSuggestions = false;
      } else if (query.trim()) {
        query = "";
      } else {
        inputRef?.blur();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    }
  }

  function scrollToSuggestion(i: number) {
    const el = document.getElementById(`suggestion-${i}`);
    if (el) {
      el.scrollIntoView({ block: "nearest" });
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

  let inputRef = $state<HTMLInputElement | null>(null);
  function handleShortcut(e: KeyboardEvent) {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (inputRef?.focus) {
        inputRef.focus();
      }
    }
  }
</script>

<svelte:window onkeydown={handleShortcut} />

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
          draggable="false"
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
            class="text-foreground px-3 p-2 hover:bg-muted data-[highlighted]:bg-muted cursor-pointer
              {selected ? 'bg-muted font-medium' : ''}"
          >
            <img
              draggable="false"
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
      bind:ref={inputRef}
      oninput={handleInput}
      onfocus={handleInputFocus}
      onblur={handleInputBlur}
      onkeydown={handleKeyDown}
      class="flex-1 px-3 h-10 bg-transparent placeholder:select-none focus:placeholder:opacity-0"
    />
  </div>

  {#if showSuggestions && suggestions.length > 0}
    <div
      transition:slide={{
        duration: 200,
        easing: quintInOut,
      }}
      class="absolute top-full left-0 right-0 bg-background border border-t-0 rounded-b-md shadow-lg z-50 max-h-56 overflow-y-auto"
    >
      {#each suggestions as suggestion, i}
        <button
          type="button"
          id="suggestion-{i}"
          data-selected={i === selectedIndex}
          class="w-full text-left px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted focus:text-foreground focus:bg-muted focus:outline-none data-[selected=true]:text-foreground data-[selected=true]:bg-muted cursor-pointer border-b border-border last:border-b-0"
          onclick={() => selectSuggestion(suggestion)}
        >
          {#if suggestion.type === "NAVIGATION"}
            <GlobeIcon class="size-3 text-muted-foreground inline-block mr-1" />
          {:else}
            <SearchIcon
              class="size-3 text-muted-foreground inline-block mr-1"
            />
          {/if}
          {suggestion.phrase}
        </button>
      {/each}
    </div>
  {/if}
</div>
