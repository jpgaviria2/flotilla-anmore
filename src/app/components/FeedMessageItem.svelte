<script lang="ts">
  import {formatTimestamp} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import ProfileCircle from "@app/components/ProfileCircle.svelte"
  import ProfileName from "@app/components/ProfileName.svelte"
  import Content from "@app/components/Content.svelte"

  interface Props {
    event: TrustedEvent
    url: string
  }

  const {event, url}: Props = $props()
</script>

<div class="card2 bg-base-100 p-4 shadow-md md:p-6 lg:p-8">
  <div class="flex items-center gap-3">
    <ProfileCircle pubkey={event.pubkey} size={6} />
    <div class="flex flex-col">
      <ProfileName pubkey={event.pubkey} />
      <span class="text-xs opacity-60">{formatTimestamp(event.created_at)}</span>
    </div>
  </div>
  <div class="mt-3 text-sm leading-relaxed md:text-base md:leading-relaxed">
    <Content showEntire {event} {url} />
  </div>
</div>
