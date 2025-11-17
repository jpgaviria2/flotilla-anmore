<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import type {Readable} from "svelte/store"
  import {readable} from "svelte/store"
  import {fly} from "@lib/transition"
  import AddCircle from "@assets/icons/add-circle.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import MarketplaceCreate from "@app/components/MarketplaceCreate.svelte"
  import {pushModal} from "@app/util/modal"
  import {
    decodeRelay,
    MARKETPLACE_STALL,
    MARKETPLACE_PRODUCT,
    CLASSIFIED_LISTING,
  } from "@app/core/state"
  import {makeFeed} from "@app/core/requests"
  import type {TrustedEvent} from "@welshman/util"
  import {getTagValue} from "@welshman/util"
  import {tryCatch, parseJson} from "@welshman/lib"

  const url = decodeRelay($page.params.relay!)

  const createListing = () => pushModal(MarketplaceCreate, {url})

  let element: HTMLElement | undefined = $state()
  let loading = $state(true)
  let events: Readable<TrustedEvent[]> = $state(readable([]))

  onMount(() => {
    const feed = makeFeed({
      url,
      element: element!,
      filters: [{kinds: [MARKETPLACE_STALL, MARKETPLACE_PRODUCT, CLASSIFIED_LISTING]}],
      onExhausted: () => {
        loading = false
      },
    })

    events = feed.events

    return () => {
      feed.cleanup()
    }
  })

  const parseMarketplaceData = (event: TrustedEvent) => {
    if (!event.content) return null

    let contentToParse = event.content.trim()
    try {
      if (contentToParse.includes("%")) {
        contentToParse = decodeURIComponent(contentToParse)
      }
    } catch (e) {
      console.warn("Failed to decode URI component", e)
    }

    const jsonResult = tryCatch(() => parseJson(contentToParse))
    if (jsonResult && typeof jsonResult === "object" && jsonResult !== null) {
      return jsonResult as {
        id?: string
        name?: string
        description?: string
        images?: string[]
        price?: number
        currency?: string
      }
    }
    return null
  }
</script>

<div class="flex h-full flex-col">
  <div class="flex items-center justify-between border-b border-base-300 bg-base-100 p-4">
    <h2 class="text-xl font-semibold">Marketplace</h2>
    <Button class="btn btn-primary btn-sm" onclick={createListing}>
      <Icon icon={AddCircle} />
      New Listing
    </Button>
  </div>
  <div bind:this={element} class="flex-1 overflow-auto">
    <div class="flex flex-col gap-2 p-4">
      {#each $events as event (event.id)}
        {@const data = parseMarketplaceData(event)}
        {@const title =
          data?.name ||
          getTagValue("title", event.tags) ||
          getTagValue("name", event.tags) ||
          "Untitled Listing"}
        {@const price = data?.price || getTagValue("price", event.tags)}
        {@const currency = data?.currency || getTagValue("currency", event.tags) || "sats"}
        {@const images = data?.images || [getTagValue("image", event.tags)].filter(Boolean)}
        {@const description = data?.description || event.content}
        <div in:fly class="card2 bg-alt p-4">
          {#if images.length > 0 && images[0]}
            <img
              src={images[0].startsWith("http") ? images[0] : `https://${images[0]}`}
              alt={title}
              class="mb-2 h-48 w-full rounded-lg object-cover" />
          {/if}
          <h3 class="text-xl font-semibold">{title}</h3>
          {#if price}
            <p class="text-lg font-bold text-primary">
              {price}
              {currency}
            </p>
          {/if}
          {#if description}
            <p class="line-clamp-3 text-sm opacity-75">{description}</p>
          {/if}
        </div>
      {/each}
      {#if loading}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>
          <Spinner {loading}>Loading marketplace...</Spinner>
        </p>
      {:else if $events.length === 0}
        <div class="flex flex-col items-center justify-center gap-4 py-20" transition:fly>
          <p class="text-center opacity-75">No listings yet. Start selling!</p>
          <Button class="btn btn-primary" onclick={createListing}>
            <Icon icon={AddCircle} />
            Create First Listing
          </Button>
        </div>
      {:else}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>That's all!</p>
      {/if}
    </div>
  </div>
</div>
