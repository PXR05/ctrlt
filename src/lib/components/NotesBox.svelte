<script lang="ts">
    import { createStorageStore } from "$lib/stores/data.svelte";
    import { z } from "zod";

    const noteStore = createStorageStore(
        {
            key: "note",
            defaultValue: "",
            schema: z.string(),
        },
        {
            debounceMs: 100,
        },
    );

    let note = $derived(noteStore.data);
</script>

<aside class="border p-3 h-full md:h-auto">
    <textarea
        value={note}
        oninput={(e) => noteStore.setData(e.currentTarget.value)}
        placeholder="note..."
        class="w-full h-full bg-transparent text-sm resize-none focus:outline-none"
        rows="6"
    ></textarea>
</aside>
