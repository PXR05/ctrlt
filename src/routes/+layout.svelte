<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.ico";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import { ThemeSidebar } from "$lib/components";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Sidebar.Provider class="bg-background flex-row-reverse">
  <Sidebar.Root side="right" class="">
    <Sidebar.Content class="bg-background">
      <ThemeSidebar />
    </Sidebar.Content>
  </Sidebar.Root>
  {@render children?.()}
</Sidebar.Provider>