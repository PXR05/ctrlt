<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar";
  import { Label } from "$lib/components/ui/label";
  import { createStorageStore } from "$lib/stores/data.svelte";
  import { theme, type Theme } from "$lib/data/default";
  import { browser } from "$app/environment";
  import { z } from "zod";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte";
  import { XIcon } from "@lucide/svelte";

  const colorStore = createStorageStore<Theme>(
    {
      key: "ctrlt.colors",
      defaultValue: theme,
      schema: z.array(
        z.object({
          name: z.string(),
          variable: z.string(),
          value: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
            message: "Invalid hex color",
          }),
        }),
      ),
    },
    { debounceMs: 100 },
  );

  const colors = $derived(colorStore.data);

  function applyThemeColors() {
    if (!browser) return;

    const root = document.documentElement;

    colors.forEach(({ variable, value }) => {
      try {
        root.style.setProperty(variable, value);
      } catch (error) {
        console.warn(`Failed to apply color ${variable}: ${value}`, error);
        root.style.setProperty(variable, value);
      }
    });
  }

  $effect(() => {
    if (colors.length > 0) {
      applyThemeColors();
    }
  });

  const defaultValueByName = Object.fromEntries(
    theme.map((c) => [c.name, c.value] as const),
  ) as Record<string, string>;

  function normalizeHex(value: string): string {
    let v = value.trim();
    if (!v.startsWith("#")) v = `#${v}`;
    v = v.slice(0, 7).toUpperCase();
    return v;
  }

  function coerceValidHex6(value: string, fallback: string): string {
    return /^#([0-9a-fA-F]{6})$/.test(value) ? value : fallback;
  }

  function updateColor(name: string, newValue: string) {
    const next = normalizeHex(newValue);
    colorStore.updateData((arr) =>
      arr.map((c) => (c.name === name ? { ...c, value: next } : c)),
    );
  }

  const sidebar = Sidebar.useSidebar();
  const isMobile = $derived(new IsMobile().current);
</script>

<Sidebar.Group class="pt-4">
  <Sidebar.GroupLabel class="text-sm">
    <span> Theme </span>
    <button
      onclick={() =>
        isMobile ? sidebar.setOpenMobile(false) : sidebar.setOpen(false)}
      class="p-2 top-4 right-4 absolute z-50 opacity-50 hover:opacity-100 transition-all"
    >
      <XIcon class="size-4" />
    </button>
  </Sidebar.GroupLabel>
  <Sidebar.GroupContent class="flex flex-col gap-4 p-2">
    {#each colors as { name, value }}
      <div class="flex flex-col gap-2">
        <Label class="text-xs font-normal text-muted-foreground">{name}</Label>
        <div class="min-w-0 flex flex-1 items-center">
          <input
            type="color"
            class="size-10 shrink-0 cursor-pointer bg-transparent p-0 color-square"
            aria-label={`Pick ${name} color`}
            value={coerceValidHex6(
              value,
              defaultValueByName[name] ?? "#000000",
            )}
            oninput={(e) => updateColor(name, e.currentTarget.value)}
          />
          <Sidebar.Input
            class="h-10 bg-transparent"
            {value}
            placeholder="#RRGGBB"
            spellcheck={false}
            oninput={(e) => updateColor(name, e.currentTarget.value)}
          />
        </div>
      </div>
    {/each}
  </Sidebar.GroupContent>
</Sidebar.Group>

<style>
  input[type="color"].color-square {
    appearance: none;
    -webkit-appearance: none;
    padding: 0;
  }
  input[type="color"].color-square::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  input[type="color"].color-square::-webkit-color-swatch {
    border: none;
  }
  input[type="color"].color-square::-moz-color-swatch {
    border: none;
  }
</style>
