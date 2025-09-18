<script lang="ts">
  interface Props {
    editable?: boolean;
    placeholder?: string;
    onNotesChange?: (notes: string) => void;
  }

  let {
    editable = false,
    placeholder = "notes...",
    onNotesChange,
  }: Props = $props();

  let notes = $state("");

  $effect(() => {
    onNotesChange?.(notes);
  });
</script>

<aside class="border p-3 h-full md:h-auto">
  {#if editable}
    <textarea
      bind:value={notes}
      {placeholder}
      class="w-full h-full bg-transparent text-muted-foreground text-sm leading-relaxed resize-none focus:outline-none"
      rows="6"
    ></textarea>
  {:else}
    <div
      class="text-muted-foreground text-sm leading-relaxed whitespace-pre-line"
    >
      {notes || placeholder}
    </div>
  {/if}
</aside>
