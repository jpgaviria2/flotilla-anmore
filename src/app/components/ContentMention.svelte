<script lang="ts">
  import {removeUndefined, call} from "@welshman/lib"
  import type {ProfilePointer} from "@welshman/content"
  import {deriveProfileDisplay, deriveProfile} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import VerifiedIcon from "@app/components/VerifiedIcon.svelte"
  import {isNip05Verified} from "@app/util/verification"
  import {pushModal} from "@app/util/modal"

  type Props = {
    value: ProfilePointer
    url?: string
  }

  const {value, url}: Props = $props()

  const relays = removeUndefined([url])
  const display = deriveProfileDisplay(value.pubkey, relays)
  const profile = deriveProfile(value.pubkey, relays)
  let isVerified = $state(false)

  $effect(() => {
    call(async () => {
      isVerified = await isNip05Verified(value.pubkey, $profile?.nip05)
    })
  })

  const openProfile = () => pushModal(ProfileDetail, {pubkey: value.pubkey, url})
</script>

<div class="flex items-center gap-1">
  <Button onclick={openProfile} class="link-content">
    @{$display}
  </Button>
  <VerifiedIcon {isVerified} />
</div>
