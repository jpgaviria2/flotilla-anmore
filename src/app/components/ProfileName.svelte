<script lang="ts">
  import {removeUndefined, call} from "@welshman/lib"
  import {deriveProfileDisplay, deriveProfile} from "@welshman/app"
  import {isNip05Verified} from "@app/util/verification"
  import VerifiedIcon from "@app/components/VerifiedIcon.svelte"

  type Props = {
    pubkey: string
    url?: string
  }

  const {pubkey, url}: Props = $props()

  const relays = removeUndefined([url])
  const profileDisplay = deriveProfileDisplay(pubkey, relays)
  const profile = deriveProfile(pubkey, relays)
  let isVerified = $state(false)

  $effect(() => {
    call(async () => {
      const nip05 = $profile?.nip05
      if (nip05) {
        console.log(
          "ProfileName: Checking verification for",
          pubkey.substring(0, 8),
          "nip05:",
          nip05,
        )
        try {
          const verified = await isNip05Verified(pubkey, nip05)
          console.log("ProfileName: Verification result:", verified)
          isVerified = verified
        } catch (error) {
          console.error("ProfileName: Verification error:", error)
          isVerified = false
        }
      } else {
        console.log("ProfileName: No nip05 for", pubkey.substring(0, 8))
        isVerified = false
      }
    })
  })
</script>

<div class="flex items-center gap-1">
  {$profileDisplay}
  <VerifiedIcon {isVerified} inline={true} />
</div>
