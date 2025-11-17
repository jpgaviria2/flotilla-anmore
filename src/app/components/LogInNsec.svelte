<script lang="ts">
  import {loginWithNip01} from "@welshman/app"
  import {preventDefault} from "@lib/html"
  import {nsecDecode} from "@lib/util"
  import Key from "@assets/icons/key-minimalistic.svg?dataurl"
  import AltArrowLeft from "@assets/icons/alt-arrow-left.svg?dataurl"
  import AltArrowRight from "@assets/icons/alt-arrow-right.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import {clearModals} from "@app/util/modal"
  import {pushToast} from "@app/util/toast"
  import {setChecked} from "@app/util/notifications"

  const back = () => history.back()

  const onSubmit = async () => {
    if (!nsec || loading) return

    loading = true

    try {
      // Decode nsec to get the secret key
      const secret = nsecDecode(nsec.trim())

      // Login with the secret
      loginWithNip01(secret)

      pushToast({message: "Successfully logged in!"})
      setChecked("*")
      clearModals()
    } catch (error: any) {
      console.error("Login error:", error)
      pushToast({
        theme: "error",
        message: error?.message || "Invalid nsec. Please check your private key and try again.",
      })
    } finally {
      loading = false
    }
  }

  let nsec = $state("")
  let loading = $state(false)
</script>

<form class="column gap-4" onsubmit={preventDefault(onSubmit)}>
  <ModalHeader>
    {#snippet title()}
      <div>Log in with Private Key</div>
    {/snippet}
  </ModalHeader>
  <p>
    Paste your private key (nsec) that was sent to your email. This key gives you full access to
    your account.
  </p>
  <Field>
    {#snippet label()}
      Private Key (nsec)*
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon={Key} />
        <input
          bind:value={nsec}
          class="grow font-mono text-sm"
          type="password"
          placeholder="nsec1..."
          autocomplete="off" />
      </label>
    {/snippet}
    {#snippet info()}
      <p class="text-xs opacity-75">
        Your private key starts with "nsec1". Make sure to paste the complete key.
      </p>
    {/snippet}
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back} type="button">
      <Icon icon={AltArrowLeft} />
      Go back
    </Button>
    <Button class="btn btn-primary" type="submit" disabled={!nsec || loading}>
      {#if loading}
        <Spinner {loading} />
      {:else}
        <Icon icon={AltArrowRight} />
      {/if}
      Log in
    </Button>
  </ModalFooter>
</form>
