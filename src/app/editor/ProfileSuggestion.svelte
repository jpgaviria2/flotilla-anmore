<script lang="ts">
  import {removeUndefined, call} from "@welshman/lib"
  import {displayPubkey} from "@welshman/util"
  import {
    deriveHandleForPubkey,
    displayHandle,
    deriveProfileDisplay,
    deriveProfile,
  } from "@welshman/app"
  import WotScore from "@app/components/WotScore.svelte"
  import ProfileCircle from "@app/components/ProfileCircle.svelte"
  import VerifiedIcon from "@app/components/VerifiedIcon.svelte"
  import {isNip05Verified} from "@app/util/verification"

  type Props = {
    value: string
    url?: string
  }

  const {value, url}: Props = $props()

  const pubkey = value
  const relays = removeUndefined([url])
  const profileDisplay = deriveProfileDisplay(pubkey, relays)
  const profile = deriveProfile(pubkey, relays)
  const handle = deriveHandleForPubkey(pubkey)
  let isVerified = $state(false)

  $effect(() => {
    call(async () => {
      isVerified = await isNip05Verified(pubkey, $profile?.nip05)
    })
  })
</script>

<div class="flex max-w-full gap-3">
  <div class="py-1">
    <ProfileCircle {pubkey} {url} />
  </div>
  <div class="flex min-w-0 flex-col">
    <div class="flex items-center gap-2">
      <div class="text-bold overflow-hidden text-ellipsis text-base">
        {$profileDisplay}
      </div>
      <VerifiedIcon {isVerified} />
      <WotScore {pubkey} />
    </div>
    <div class="overflow-hidden text-ellipsis text-sm opacity-75">
      {$handle ? displayHandle($handle) : displayPubkey(pubkey)}
    </div>
  </div>
</div>
