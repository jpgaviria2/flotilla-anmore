<script lang="ts">
  import type {Snippet} from "svelte"
  import Toast from "@app/components/Toast.svelte"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"

  interface Props {
    children: Snippet
  }

  const {children}: Props = $props()
</script>

<div class="flex h-screen overflow-hidden">
  <PrimaryNav>
    {@render children?.()}
  </PrimaryNav>
</div>
<Toast />
