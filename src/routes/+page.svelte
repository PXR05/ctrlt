<script lang="ts">
  import { SearchBar, ShortcutsGrid, NotesBox } from "$lib/components";
</script>

<div class="w-dvw h-dvh bg-background grid place-items-center">
  <div class="w-[min(900px,95vw)]">
    <div class="p-4 sm:p-6 md:p-8 grid gap-2">
      <SearchBar />

      <div class="grid gap-2 md:grid-cols-3">
        <ShortcutsGrid />

        <NotesBox />
      </div>
    </div>
  </div>
</div>
