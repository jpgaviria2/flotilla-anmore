<script lang="ts">
  import {removeUndefined} from "@welshman/lib"
  import {deriveProfile} from "@welshman/app"
  import AltArrowLeft from "@assets/icons/alt-arrow-left.svg?dataurl"
  import Copy from "@assets/icons/copy.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import QRCode from "@app/components/QRCode.svelte"
  import ProfileLink from "@app/components/ProfileLink.svelte"
  import Field from "@lib/components/Field.svelte"
  import {clip} from "@app/util/toast"

  type Props = {
    pubkey: string
    url?: string
  }

  const {pubkey, url}: Props = $props()

  const relays = removeUndefined([url])
  const profile = deriveProfile(pubkey, relays)
  const lightningAddress = $derived($profile?.lud16)
  const lightningUri = $derived(lightningAddress ? `lightning:${lightningAddress}` : null)

  const back = () => history.back()

  const copyAddress = () => {
    if (lightningAddress) {
      clip(lightningAddress)
    }
  }
</script>

<div class="column gap-4">
  <ModalHeader>
    {#snippet title()}
      <div>Send a Tip</div>
    {/snippet}
    {#snippet info()}
      <div>To <ProfileLink {pubkey} class="!text-primary" /></div>
    {/snippet}
  </ModalHeader>
  {#if lightningUri}
    <div class="flex flex-col items-center gap-6">
      <QRCode code={lightningUri} />
      <Field>
        {#snippet input()}
          <label class="input input-bordered flex w-full items-center gap-2">
            <Icon icon={Copy} />
            <input value={lightningAddress} readonly class="grow" type="text" />
            <Button onclick={copyAddress}>
              <Icon icon={Copy} />
            </Button>
          </label>
        {/snippet}
        {#snippet info()}
          <p>
            Scan the QR code or copy the lightning address to send a payment using any lightning
            wallet.
          </p>
        {/snippet}
      </Field>
    </div>
  {:else}
    <p>
      <ProfileLink {pubkey} class="!text-primary" /> doesn't have a lightning address set up yet.
    </p>
  {/if}
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon={AltArrowLeft} />
      Go back
    </Button>
  </ModalFooter>
</div>
