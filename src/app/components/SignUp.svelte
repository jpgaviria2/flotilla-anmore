<script lang="ts">
  import {preventDefault} from "@lib/html"
  import {generateSecretKey, getPublicKey} from "nostr-tools"
  import * as nip19 from "nostr-tools/nip19"
  import UserRounded from "@assets/icons/user-rounded.svg?dataurl"
  import AltArrowRight from "@assets/icons/alt-arrow-right.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import LogIn from "@app/components/LogIn.svelte"
  import InfoNostr from "@app/components/InfoNostr.svelte"
  import {pushModal} from "@app/util/modal"
  import {PLATFORM_NAME} from "@app/core/state"
  import {pushToast} from "@app/util/toast"

  const login = () => pushModal(LogIn)

  const signupWithEmail = async () => {
    if (!email || !email.includes("@")) {
      pushToast({message: "Please enter a valid email address", theme: "error"})
      return
    }

    loading = true

    try {
      // Generate Nostr keypair client-side
      const nsec = generateSecretKey()
      const pubkey = getPublicKey(nsec)
      const npub = nip19.npubEncode(pubkey)
      const nsecEncoded = nip19.nsecEncode(nsec)

      // Store nsec temporarily in sessionStorage for use after nstart process
      // This allows user to login after completing nstart.me onboarding
      const storageKey = `nsec_${Date.now()}`
      sessionStorage.setItem(storageKey, nsecEncoded)
      sessionStorage.setItem(`${storageKey}_email`, email)
      sessionStorage.setItem(`${storageKey}_npub`, npub)

      // Redirect to nstart.me with email parameter
      const nstartUrl = new URL("https://nstart.me")
      nstartUrl.searchParams.set("email", email)
      nstartUrl.searchParams.set("return", window.location.origin)
      nstartUrl.searchParams.set("key", storageKey)

      pushToast({
        message:
          "Redirecting to nstart.me to complete your signup. After completing the process, return here and use your nsec key to log in.",
      })

      // Redirect after a brief delay to show the message
      setTimeout(() => {
        window.location.href = nstartUrl.toString()
      }, 1500)
    } catch (error) {
      console.error("Signup error:", error)
      pushToast({
        message: error instanceof Error ? error.message : "An error occurred. Please try again.",
        theme: "error",
      })
      loading = false
    }
  }

  let email = $state("")
  let loading = $state(false)
</script>

<form class="column gap-4" onsubmit={preventDefault(signupWithEmail)}>
  <h1 class="heading">Sign up with Email</h1>
  <p class="m-auto max-w-sm text-center">
    {PLATFORM_NAME} is built using the
    <Button class="link" onclick={() => pushModal(InfoNostr)}>nostr protocol</Button>, which gives
    users control over their digital identity using <strong>cryptographic key pairs</strong>.
  </p>
  <FieldInline>
    {#snippet label()}
      <p>Email</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon={UserRounded} />
        <input bind:value={email} type="email" placeholder="your@email.com" />
      </label>
    {/snippet}
  </FieldInline>
  <Button type="submit" class="btn btn-primary" disabled={loading || !email}>
    <Spinner {loading}>Sign Up</Spinner>
    <Icon icon={AltArrowRight} />
  </Button>
  <p class="text-sm opacity-75">
    You'll be redirected to <strong>nstart.me</strong> to complete your Nostr account setup. After
    completing the process, return here and use your <strong>nsec key</strong> to log in to {PLATFORM_NAME}.
  </p>
  <div class="text-sm">
    Already have an account?
    <Button class="link" onclick={login}>Log in instead</Button>
  </div>
</form>
