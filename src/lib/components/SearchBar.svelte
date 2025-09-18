<script lang="ts">
  import * as Select from "$lib/components/ui/select/index.js";
  import { Input } from "$lib/components/ui/input";
  import { engines } from "$lib/data/startpage.js";

  let selectedEngine = $state(engines[0].name);
  let query = $state("");

  let currentEngine = $derived(engines.find((e) => e.name === selectedEngine));

  function handleSearch(e: SubmitEvent) {
    e.preventDefault();
    const engine = engines.find((en) => en.name === selectedEngine);
    if (engine && query.trim()) {
      window.location.href = engine.url + encodeURIComponent(query.trim());
    }
  }
</script>

<div class="flex items-center">
  <Select.Root type="single" bind:value={selectedEngine}>
    <Select.Trigger
      hideChevron
      class="aspect-square p-0 bg-transparent border border-r-0 focus:outline-none focus-visible:ring-0"
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

  <form class="flex-1" onsubmit={handleSearch}>
    <Input
      type="text"
      placeholder="query..."
      bind:value={query}
      class="flex-1 px-3 h-10 bg-transparent focus-visible:ring-0"
    />
  </form>
</div>
