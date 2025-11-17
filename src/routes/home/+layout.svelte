<script lang="ts">
  import type {Snippet} from "svelte"

  interface Props {
    children?: Snippet
  }

  const {children}: Props = $props()
</script>

<div class="flex h-full w-full flex-col">
  {@render children?.()}
</div>
