<script lang="ts">
  import "../app.css";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import { ThemeSidebar } from "$lib/components";

  let { children } = $props();
</script>

<Sidebar.Provider class="bg-background flex-row-reverse">
  <Sidebar.Root side="right">
    <Sidebar.Content class="bg-background">
      <ThemeSidebar />
    </Sidebar.Content>
  </Sidebar.Root>
  {@render children?.()}
</Sidebar.Provider>
