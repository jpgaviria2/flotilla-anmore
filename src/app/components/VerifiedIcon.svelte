<script lang="ts">
  import VerifiedCheck from "@assets/icons/verified-check.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"

  type Props = {
    isVerified: boolean
    inline?: boolean
  }

  const {isVerified, inline = false}: Props = $props()
</script>

{#if isVerified}
  {#if inline}
    <div class="tooltip tooltip-top" data-tip="Verified NIP-5 identity">
      <Icon icon={VerifiedCheck} size={4} class="inline-block align-middle text-primary" />
    </div>
  {:else}
    <div class="tooltip tooltip-top" data-tip="Verified NIP-5 identity">
      <div
        class="flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-xl ring-2 ring-primary ring-offset-2 ring-offset-base-100">
        <Icon icon={VerifiedCheck} size={7} class="text-primary-content drop-shadow-lg" />
      </div>
    </div>
  {/if}
{/if}
