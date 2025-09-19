<script lang="ts">
  import { SearchBar, ShortcutsGrid, NotesBox } from "$lib/components";
  import { useSidebar } from "$lib/components/ui/sidebar";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte";
  import { PencilIcon } from "@lucide/svelte";

  const sidebar = useSidebar();
  const isMobile = $derived(new IsMobile().current);
</script>

<main class="w-full grid place-items-center">
  <button
    onclick={() =>
      isMobile ? sidebar.setOpenMobile(true) : sidebar.setOpen(true)}
    class="p-2 top-4 right-4 absolute opacity-50 hover:opacity-100 transition-all"
  >
    <PencilIcon class="size-4" />
  </button>
  <div class="max-w-[min(800px,95vw)]">
    <div class="p-4 sm:p-6 md:p-8 grid gap-2">
      <SearchBar />
      <div class="grid gap-2 md:grid-cols-3 min-h-40">
        <ShortcutsGrid />
        <NotesBox />
      </div>
    </div>
  </div>
</main>
