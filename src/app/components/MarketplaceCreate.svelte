<script lang="ts">
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import MarketplaceForm from "@app/components/MarketplaceForm.svelte"

  type Props = {
    url: string
    h?: string
  }

  const {url, h}: Props = $props()
</script>

<MarketplaceForm {url} {h}>
  {#snippet header()}
    <ModalHeader>
      {#snippet title()}
        <div>Create Marketplace Listing</div>
      {/snippet}
      {#snippet info()}
        <div>List products or services for sale in this space.</div>
      {/snippet}
    </ModalHeader>
  {/snippet}
</MarketplaceForm>
