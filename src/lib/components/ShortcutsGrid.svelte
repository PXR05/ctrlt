<script lang="ts">
  import { draggable, droppable, type DragDropState } from "@thisux/sveltednd";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Dropdown from "$lib/components/ui/dropdown-menu/index.js";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import type { Shortcut } from "$lib/data/default.js";
  import { shortcuts as defaultShortcuts } from "$lib/data/default.js";
  import { createStorageStore } from "$lib/stores/data.svelte.js";
  import MoreVertical from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import TrashIcon from "@lucide/svelte/icons/trash";
  import { z } from "zod";
  import { flip } from "svelte/animate";
  import { outboundTracker } from "$lib/utils/outbound-tracking";

  const MAX_SHORTCUTS = 9;
  const columns = 3;

  const shortcutSchema = z.object({
    id: z.string(),
    position: z.number(),
    name: z.string(),
    url: z.string(),
    icon: z.string(),
  });

  const shortcutsArraySchema = z.array(shortcutSchema);

  const shortcutsStore = createStorageStore(
    {
      key: "ctrlt.shortcuts",
      defaultValue: defaultShortcuts,
      schema: shortcutsArraySchema,
      maxItems: MAX_SHORTCUTS,
    },
    { debounceMs: 200 },
  );

  const items = $derived(shortcutsStore.data);

  const gridItems = $derived.by(() => {
    const grid: (Shortcut | null)[] = new Array(9).fill(null);
    if (!shortcutsStore.initialized) return grid;
    items.forEach((shortcut) => {
      if (shortcut.position >= 0 && shortcut.position < 9) {
        grid[shortcut.position] = shortcut;
      }
    });
    return grid;
  });

  let dialogOpen = $state(false);
  let editingID = $state<string | null>(null);
  let addingToPosition = $state<number | null>(null);
  let form = $state<{ name: string; url: string; icon: string }>({
    name: "",
    url: "",
    icon: "",
  });
  let saving = $state(false);

  function getHost(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  function openAddDialog(position: number) {
    editingID = null;
    addingToPosition = position;
    form = { name: "", url: "", icon: "" };
    dialogOpen = true;
  }

  function openEditDialog(shortcut: Shortcut) {
    editingID = shortcut.id;
    addingToPosition = null;
    form = { name: shortcut.name, url: shortcut.url, icon: shortcut.icon };
    dialogOpen = true;
  }

  function canLoadImage(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      const done = (ok: boolean) => {
        img.onload = null;
        img.onerror = null;
        resolve(ok);
      };
      img.onload = () => done(true);
      img.onerror = () => done(false);
      img.src = src;
    });
  }

  async function resolveIconForUrl(siteUrl: string): Promise<string> {
    try {
      const u = new URL(siteUrl);
      const hostname = u.hostname;
      const origin = u.origin;
      const candidates = [
        `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
        `${origin}/favicon.ico`,
        `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
      ];
      for (const src of candidates) {
        if (await canLoadImage(src)) return src;
      }
      return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
    } catch {
      return "";
    }
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const name = form.name.trim();
    const url = form.url.trim();
    const manualIcon = form.icon.trim();
    if (!name || !url) return;
    saving = true;
    let icon = manualIcon;
    if (!icon) {
      icon = await resolveIconForUrl(url);
    }
    if (!icon && editingID !== null) {
      const currentItem = items.find((item) => item.id === editingID);
      icon = currentItem?.icon || icon;
    }
    const targetPosition =
      editingID !== null
        ? (items.find((item) => item.id === editingID)?.position ??
          addingToPosition!)
        : addingToPosition!;
    const nextItem: Shortcut = {
      id: crypto.randomUUID(),
      position: targetPosition,
      name,
      url,
      icon: icon || `https://icons.duckduckgo.com/ip3/${getHost(url)}.ico`,
    };

    if (editingID === null) {
      if (items.length >= MAX_SHORTCUTS) {
        saving = false;
        return;
      }
      shortcutsStore.setData([...items, nextItem]);
    } else {
      const next = items.map((item) =>
        item.id === editingID ? nextItem : item,
      );
      shortcutsStore.setData(next);
    }
    saving = false;
    dialogOpen = false;
  }

  function removeShortcut(id: string) {
    shortcutsStore.updateData((current) => {
      return current.filter((item) => item.id !== id);
    });
  }

  function handleDrop(state: DragDropState<Shortcut>) {
    const { sourceContainer, targetContainer } = state;
    if (!targetContainer || sourceContainer === targetContainer) return;

    const sourceIndex = parseInt(sourceContainer);
    const targetIndex = parseInt(targetContainer);

    const copy = [...gridItems];
    [copy[sourceIndex], copy[targetIndex]] = [
      copy[targetIndex],
      copy[sourceIndex],
    ];

    const indexed: Shortcut[] = [];
    for (let i = 0; i < copy.length; i++) {
      const item = copy[i];
      if (item !== null) {
        indexed.push({ ...item, position: i });
      }
    }

    shortcutsStore.setData(indexed);
  }

  function handleShortcutClick(shortcut: Shortcut) {
    outboundTracker.trackShortcut(shortcut.url, shortcut.name);
  }
</script>

<div class="md:col-span-2 grid grid-cols-3 border select-none">
  {#each gridItems as gridItem, position (gridItem?.id)}
    <div
      animate:flip={{
        duration: 150,
      }}
      use:droppable={{
        container: position.toString(),
        callbacks: { onDrop: handleDrop },
      }}
      class="relative group flex items-center hover:bg-muted transition-colors
			{position % columns !== columns - 1 ? 'border-r' : ''}
			{position < 6 ? 'border-b' : ''}
			{shortcutsStore.initialized ? '' : 'pointer-events-none animate-pulse'}"
    >
      {#if gridItem}
        <a
          use:draggable={{
            container: position.toString(),
            dragData: gridItem,
          }}
          href={gridItem.url}
          onclick={() => handleShortcutClick(gridItem)}
          class="flex items-center gap-3 min-w-0 flex-1 px-3 py-2"
        >
          <img
            draggable="false"
            src={gridItem.icon}
            alt={gridItem.name}
            class="size-6 shrink-0"
          />
          <div class="min-w-0">
            <div class="truncate text-sm">{gridItem.name}</div>
            <div class="text-muted-foreground/50 text-xs truncate">
              {getHost(gridItem.url)}
            </div>
          </div>
        </a>
        <div class="absolute right-0 transition-all top-1/2 -translate-y-1/2">
          <Dropdown.DropdownMenu>
            <Dropdown.DropdownMenuTrigger
              class="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 group-hover:mr-1 data-[state=open]:mr-1 p-1 rounded text-muted-foreground hover:text-foreground transition-all"
              aria-label="Actions"
            >
              <MoreVertical class="size-4" />
            </Dropdown.DropdownMenuTrigger>
            <Dropdown.DropdownMenuContent
              class="border bg-background w-fit min-w-0 p-0"
              align="end"
              alignOffset={-10}
            >
              <Dropdown.DropdownMenuItem
                onclick={() => openEditDialog(gridItem)}
              >
                <PencilIcon class="size-3.5" />
                <span class="text-sm"> Edit </span>
              </Dropdown.DropdownMenuItem>
              <Dropdown.DropdownMenuItem
                onclick={() => removeShortcut(gridItem.id)}
              >
                <TrashIcon class="size-3.5" />
                <span class="text-sm"> Remove </span>
              </Dropdown.DropdownMenuItem>
            </Dropdown.DropdownMenuContent>
          </Dropdown.DropdownMenu>
        </div>
      {:else}
        <button
          class="flex items-center gap-3 w-full px-3 py-2"
          onclick={() => openAddDialog(position)}
          type="button"
        >
          <div
            class="size-6 shrink-0 grid place-items-center border border-dashed border-muted-foreground/30"
          >
            <PlusIcon class="size-4 text-muted-foreground/50" />
          </div>
          <div class="text-left text-muted-foreground/50 truncate">
            <div class="truncate text-sm">Add shortcut</div>
            <div class="text-xs truncate">
              #{position + 1}
            </div>
          </div>
        </button>
      {/if}
    </div>
  {/each}
</div>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="font-medium">
        {editingID === null
          ? `Add shortcut #${addingToPosition! + 1}`
          : "Edit shortcut"}
      </Dialog.Title>
    </Dialog.Header>
    <form class="grid gap-3" onsubmit={handleSubmit}>
      <div class="grid gap-1">
        <Label class="text-sm">Name</Label>
        <Input bind:value={form.name} placeholder="e.g. YouTube" class="h-9" />
      </div>
      <div class="grid gap-1">
        <Label class="text-sm">URL</Label>
        <Input
          bind:value={form.url}
          placeholder="https://example.com"
          class="h-9"
        />
      </div>
      <div class="grid gap-1">
        <Label class="text-sm">Icon URL (optional)</Label>
        <Input
          bind:value={form.icon}
          placeholder="Leave blank to auto-detect"
          class="h-9"
        />
      </div>
      <Dialog.Footer>
        <Dialog.Close
          type="button"
          class="text-sm px-3 py-2 border hover:bg-muted"
        >
          Cancel
        </Dialog.Close>
        <button
          type="submit"
          class="px-3 py-2 border hover:bg-muted text-sm"
          disabled={saving}>{saving ? "Saving..." : "Save"}</button
        >
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
