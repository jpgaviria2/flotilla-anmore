<script lang="ts">
  import {page} from "$app/stores"
  import {goto} from "$app/navigation"
  import {decodeRelay, ANMORE_RELAY} from "@app/core/state"
  import {makeSpacePath} from "@app/util/routes"

  const url = decodeRelay($page.params.relay!)

  // Redirect to root routes for ANMORE_RELAY (always relay.anmore.me)
  if (url === ANMORE_RELAY) {
    goto("/feed", {replaceState: true})
  } else {
    goto(makeSpacePath(url, "notes"), {replaceState: true})
  }
</script>
