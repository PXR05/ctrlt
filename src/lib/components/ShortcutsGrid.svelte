<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Dropdown from "$lib/components/ui/dropdown-menu/index.js";
  import { Input } from "$lib/components/ui/input";
  import type { Shortcut } from "$lib/data/startpage.js";
  import { shortcuts as defaultShortcuts } from "$lib/data/startpage.js";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import TrashIcon from "@lucide/svelte/icons/trash";
  import MoreVertical from "@lucide/svelte/icons/more-vertical";

  const STORAGE_KEY = "startpage.shortcuts";
  const MAX_SHORTCUTS = 9;
  const columns = 3;

  let initialized = $state(false);
  let items = $state<Shortcut[]>([]);

  let dialogOpen = $state(false);
  let editingIndex = $state<number | null>(null);
  let form = $state<{ name: string; url: string; icon: string }>({
    name: "",
    url: "",
    icon: "",
  });
  const nameId = "shortcut-name";
  const urlId = "shortcut-url";
  const iconId = "shortcut-icon";
  let saving = $state(false);

  function getHost(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  function loadFromStorage(): Shortcut[] {
    if (typeof window === "undefined") return defaultShortcuts;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Shortcut[]) : null;
      if (
        Array.isArray(parsed) &&
        parsed.every(
          (v) =>
            v &&
            typeof v.name === "string" &&
            typeof v.url === "string" &&
            typeof v.icon === "string"
        )
      ) {
        return parsed.slice(0, MAX_SHORTCUTS);
      }
    } catch {}
    return defaultShortcuts;
  }

  function saveToStorage(next: Shortcut[]) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next.slice(0, MAX_SHORTCUTS))
      );
    } catch {}
  }

  $effect(() => {
    if (!initialized && typeof window !== "undefined") {
      items = loadFromStorage();
      initialized = true;
    }
  });

  $effect(() => {
    if (initialized) saveToStorage(items);
  });

  function openAddDialog() {
    editingIndex = null;
    form = { name: "", url: "", icon: "" };
    dialogOpen = true;
  }

  function openEditDialog(index: number) {
    editingIndex = index;
    const current = items[index];
    form = { name: current.name, url: current.url, icon: current.icon };
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
    if (!icon && editingIndex !== null) {
      icon = items[editingIndex]?.icon || icon;
    }
    const nextItem: Shortcut = {
      name,
      url,
      icon: icon || `https://icons.duckduckgo.com/ip3/${getHost(url)}.ico`,
    };
    if (editingIndex === null) {
      if (items.length >= MAX_SHORTCUTS) {
        saving = false;
        return;
      }
      items = [...items, nextItem];
    } else {
      const next = [...items];
      next[editingIndex] = nextItem;
      items = next;
    }
    saving = false;
    dialogOpen = false;
  }

  function removeAt(index: number) {
    const next = items.slice();
    next.splice(index, 1);
    items = next;
  }

  const addSpanClass = $derived(() => {
    if (items.length >= MAX_SHORTCUTS) return "";
    const mod = items.length % 3;
    if (mod === 0) return "col-span-3";
    if (mod === 1) return "col-span-2";
    return "col-span-1";
  });
</script>

<div class="md:col-span-2 grid grid-cols-3 border">
  {#each items as shortcut, i}
    <div
      class="group flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors
			{i % columns !== columns - 1 ? 'border-r' : ''} 
			{i < items.length - columns ? 'border-b' : ''}"
    >
      <a
        href={shortcut.url}
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 min-w-0 flex-1"
      >
        <img src={shortcut.icon} alt={shortcut.name} class="size-6 shrink-0" />
        <div class="min-w-0">
          <div class="truncate">{shortcut.name}</div>
          <div class="text-muted-foreground/50 text-xs truncate">
            {getHost(shortcut.url)}
          </div>
        </div>
      </a>
      <div class="ms-auto">
        <Dropdown.DropdownMenu>
          <Dropdown.DropdownMenuTrigger
            class="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground/60 hover:text-foreground transition-colors"
            aria-label="Actions"
          >
            <MoreVertical class="size-4" />
          </Dropdown.DropdownMenuTrigger>
          <Dropdown.DropdownMenuContent
            class="border bg-background w-fit min-w-0 p-0"
            align="end"
            alignOffset={-10}
          >
            <Dropdown.DropdownMenuItem onclick={() => openEditDialog(i)}>
              <PencilIcon class="size-3" />
              <span class="text-xs"> Edit </span>
            </Dropdown.DropdownMenuItem>
            <Dropdown.DropdownMenuItem
              variant="destructive"
              onclick={() => removeAt(i)}
            >
              <TrashIcon class="size-3" />
              <span class="text-xs"> Remove </span>
            </Dropdown.DropdownMenuItem>
          </Dropdown.DropdownMenuContent>
        </Dropdown.DropdownMenu>
      </div>
    </div>
  {/each}

  {#if items.length < MAX_SHORTCUTS}
    <button
      class="flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors border-t {addSpanClass}
      {items.length % 3 === 0
        ? 'col-span-full'
        : items.length % 3 === 1
          ? 'col-span-2'
          : 'col-span-1'}"
      onclick={openAddDialog}
      type="button"
    >
      <div class="size-6 shrink-0 grid place-items-center rounded border">
        <PlusIcon class="size-4" />
      </div>
      <div class="text-left">
        <div class="truncate">Add shortcut</div>
        <div class="text-muted-foreground/50 text-xs truncate">
          {MAX_SHORTCUTS - items.length} slots left
        </div>
      </div>
    </button>
  {/if}
</div>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title
        >{editingIndex === null
          ? "Add shortcut"
          : "Edit shortcut"}</Dialog.Title
      >
      <Dialog.Description>Provide name and URL</Dialog.Description>
    </Dialog.Header>
    <form class="grid gap-3" onsubmit={handleSubmit}>
      <div class="grid gap-1">
        <label class="text-sm" for={nameId}>Name</label>
        <Input
          id={nameId}
          bind:value={form.name}
          placeholder="e.g. YouTube"
          class="h-9"
        />
      </div>
      <div class="grid gap-1">
        <label class="text-sm" for={urlId}>URL</label>
        <Input
          id={urlId}
          bind:value={form.url}
          placeholder="https://example.com"
          class="h-9"
        />
      </div>
      <div class="grid gap-1">
        <label class="text-sm" for={iconId}>Icon URL (optional)</label>
        <Input
          id={iconId}
          bind:value={form.icon}
          placeholder="Leave blank to auto-detect"
          class="h-9"
        />
      </div>
      <Dialog.Footer>
        <Dialog.Close type="button" class="px-3 py-2 border rounded"
          >Cancel</Dialog.Close
        >
        <button type="submit" class="px-3 py-2 border rounded" disabled={saving}
          >{saving ? "Saving..." : "Save"}</button
        >
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
