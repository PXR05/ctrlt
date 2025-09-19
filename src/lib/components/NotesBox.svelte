<script lang="ts">
  import { createStorageStore } from "$lib/stores/data.svelte";
  import { z } from "zod";

  const noteStore = createStorageStore(
    {
      key: "ctrlt.note",
      defaultValue: "",
      schema: z.string(),
    },
    {
      debounceMs: 100,
    }
  );

  let note = $derived(noteStore.data);
</script>

<textarea
  value={note}
  oninput={(e) => noteStore.setData(e.currentTarget.value)}
  placeholder="note..."
  class="selection:bg-foreground selection:text-background border p-3 h-full md:h-auto w-full bg-transparent text-sm resize-none focus:border-foreground focus:outline-none placeholder:text-muted-foreground focus:placeholder:opacity-0"
  rows="6"
></textarea>
