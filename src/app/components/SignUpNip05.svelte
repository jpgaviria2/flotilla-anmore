<script lang="ts">
  import {onMount} from "svelte"
  import type {Profile} from "@welshman/util"
  import {getPubkey} from "@welshman/util"
  import {preventDefault} from "@lib/html"
  import AltArrowLeft from "@assets/icons/alt-arrow-left.svg?dataurl"
  import AltArrowRight from "@assets/icons/alt-arrow-right.svg?dataurl"
  import MapPoint from "@assets/icons/map-point.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Field from "@lib/components/Field.svelte"
  import Modal from "@lib/components/Modal.svelte"
  import ModalBody from "@lib/components/ModalBody.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalTitle from "@lib/components/ModalTitle.svelte"
  import ModalSubtitle from "@lib/components/ModalSubtitle.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {getKey, setKey} from "@lib/implicit"
  import {pushToast} from "@app/util/toast"
  import {
    checkNip05,
    claimNip05,
    isValidNip05Username,
    normalizeNip05Username,
    suggestNip05Username,
    type Nip05CheckResult,
  } from "@app/util/nip05"

  type Props = {
    next: () => void
  }

  const {next}: Props = $props()

  const secret = getKey<string>("signup.secret")!
  const pubkey = getPubkey(secret)
  const profile = getKey<Profile>("signup.profile")!

  let username = $state(suggestNip05Username(profile.name, pubkey))
  let loading = $state(false)
  let checking = $state(false)
  let checkResult: Nip05CheckResult | undefined = $state()
  let checkTimer: ReturnType<typeof setTimeout> | undefined = undefined

  const back = () => history.back()

  const setUsername = (value: string) => {
    username = normalizeNip05Username(value)
    checkResult = undefined

    if (checkTimer) clearTimeout(checkTimer)
    if (!username || !isValidNip05Username(username)) return

    checking = true
    checkTimer = setTimeout(async () => {
      try {
        checkResult = await checkNip05(username)
      } catch (e) {
        console.error(e)
        checkResult = undefined
      } finally {
        checking = false
      }
    }, 500)
  }

  const skip = () => next()

  const claim = async () => {
    if (!isValidNip05Username(username)) {
      return pushToast({
        theme: "error",
        message: "Username must be 3-20 characters: lowercase letters, numbers, and dashes.",
      })
    }

    loading = true

    try {
      const result = await claimNip05({username, pubkey, secret})
      const nextProfile = {
        ...profile,
        name: profile.name || result.username || username,
        nip05: result.nip05,
        lud16: result.lud16 || profile.lud16,
      }

      setKey("signup.profile", nextProfile)
      pushToast({message: `Claimed ${result.nip05}`})
      next()
    } catch (e) {
      console.error(e)
      pushToast({
        theme: "error",
        message: e instanceof Error ? e.message : "Failed to claim NIP-05 address.",
      })
    } finally {
      loading = false
    }
  }

  onMount(() => {
    setUsername(username)

    return () => {
      if (checkTimer) clearTimeout(checkTimer)
    }
  })
</script>

<Modal tag="form" onsubmit={preventDefault(claim)}>
  <ModalBody>
    <ModalHeader>
      <ModalTitle>Claim your Trails Coffee address</ModalTitle>
      <ModalSubtitle>Use one local identity for Anmore, Trails Coffee, and Nostr.</ModalSubtitle>
    </ModalHeader>
    <p>
      Choose a public username. It will become your Nostr address and be published on your profile.
    </p>
    <p class="text-sm opacity-75">
      Already claimed an address in the Trails Coffee iOS app? Log in or import that same Nostr key
      to keep using it here.
    </p>
    <Field>
      {#snippet label()}
        <p>Username</p>
      {/snippet}
      {#snippet input()}
        <label class="input input-bordered flex w-full items-center gap-2">
          <Icon icon={MapPoint} />
          <input
            value={username}
            class="grow"
            type="text"
            autocomplete="username"
            oninput={e => setUsername(e.currentTarget.value)} />
          <span class="text-sm opacity-60">@trailscoffee.com</span>
        </label>
      {/snippet}
      {#snippet info()}
        {#if username && !isValidNip05Username(username)}
          <span class="text-error">Use 3-20 lowercase letters, numbers, and dashes.</span>
        {:else if checking}
          <span>Checking availability...</span>
        {:else if checkResult?.available}
          <span class="text-success">Available</span>
        {:else if checkResult?.available === false}
          <span class="text-error">
            {checkResult.reason || "Unavailable"}
            {#if checkResult.suggestion}
              Try {checkResult.suggestion}.
            {/if}
          </span>
        {:else}
          <span>This can be changed later from profile settings.</span>
        {/if}
      {/snippet}
    </Field>
  </ModalBody>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back} disabled={loading}>
      <Icon icon={AltArrowLeft} />
      Go back
    </Button>
    <Button class="btn btn-neutral" onclick={skip} disabled={loading}>Skip for now</Button>
    <Button
      class="btn btn-primary"
      type="submit"
      disabled={loading ||
        checking ||
        !isValidNip05Username(username) ||
        checkResult?.available === false}>
      <Spinner {loading}>Claim Address</Spinner>
      <Icon icon={AltArrowRight} />
    </Button>
  </ModalFooter>
</Modal>
