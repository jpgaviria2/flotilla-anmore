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

  const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY

  const login = () => pushModal(LogIn)

  const signupWithEmail = async () => {
    if (!email || !email.includes("@")) {
      pushToast({message: "Please enter a valid email address", theme: "error"})
      return
    }

    if (!RESEND_API_KEY) {
      pushToast({
        message:
          "Email signup is not configured. Please use the 'Log in' option with your Nostr keys instead.",
        theme: "error",
        timeout: 10000,
      })
      return
    }

    loading = true

    try {
      // Generate Nostr keypair client-side
      const nsec = generateSecretKey()
      const pubkey = getPublicKey(nsec)
      const npub = nip19.npubEncode(pubkey)
      const nsecEncoded = nip19.nsecEncode(nsec)

      // Try to use server-side API first (if available)
      let emailResponse
      try {
        emailResponse = await fetch("/api/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({email, npub, nsecEncoded}),
        })
      } catch (apiError) {
        // If server-side API doesn't exist, try direct Resend call
        // (This will fail due to CORS, but we handle it gracefully)
        if (RESEND_API_KEY) {
          emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Anmore <onboarding@anmore.me>",
              to: email,
              subject: "Welcome to Anmore - Your Nostr Keys",
              html: `
                <h1>Welcome to Anmore!</h1>
                <p>Your Nostr account has been created. Here are your keys:</p>
                
                <h2>Public Key (npub)</h2>
                <p style="font-family: monospace; background: #f0f0f0; padding: 10px; word-break: break-all;">${npub}</p>
                <p>Share this with others to receive messages and zaps.</p>
                
                <h2>Private Key (nsec) - KEEP SECRET!</h2>
                <p style="font-family: monospace; background: #fff3cd; padding: 10px; word-break: break-all; border: 2px solid #ffc107;">${nsecEncoded}</p>
                <p style="color: #d32f2f; font-weight: bold;">⚠️ WARNING: Never share your private key (nsec) with anyone! Store it securely.</p>
                
                <h2>What to do next:</h2>
                <ol>
                  <li>Save this email in a secure location</li>
                  <li>Copy your keys to a password manager or secure note</li>
                  <li>Return to Anmore and log in using your keys</li>
                </ol>
                
                <p>If you lose your keys, you will not be able to recover your account.</p>
                
                <p>Happy nostring!</p>
              `,
            }),
          })
        } else {
          throw new Error("Resend API key not configured")
        }
      }

      // Handle CORS errors gracefully
      if (!emailResponse || emailResponse.type === "opaque" || !emailResponse.ok) {
        // Check if it's a CORS error
        if (!emailResponse || emailResponse.status === 0) {
          pushToast({
            message:
              "Email signup requires a server-side API. The Resend API cannot be called directly from the browser due to CORS restrictions. Please use the 'Log in' option with your Nostr keys, or deploy a serverless function to handle email sending.",
            theme: "error",
            timeout: 15000,
          })
          return
        }
      }

      if (!emailResponse.ok) {
        const error = await emailResponse.json().catch(() => ({message: "Failed to send email"}))
        console.error("Resend API error:", error)
        pushToast({
          message: error.message || "Failed to send email. Please try again.",
          theme: "error",
        })
        return
      }

      pushToast({
        message: "Keys sent to your email! Check your inbox and use your keys to log in.",
      })
      // Show success modal or redirect to login
      setTimeout(() => {
        pushModal(LogIn)
      }, 2000)
    } catch (error) {
      console.error("Signup error:", error)
      pushToast({
        message: error instanceof Error ? error.message : "An error occurred. Please try again.",
        theme: "error",
      })
    } finally {
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
    We'll send your Nostr keys (npub and nsec) to your email. Make sure to save them securely! You
    can use these keys to log in to {PLATFORM_NAME} and other Nostr applications.
  </p>
  <div class="text-sm">
    Already have an account?
    <Button class="link" onclick={login}>Log in instead</Button>
  </div>
</form>
