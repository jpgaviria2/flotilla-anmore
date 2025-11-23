<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {goto} from "$app/navigation"
  import type {Readable} from "svelte/store"
  import {readable} from "svelte/store"
  import {get} from "svelte/store"
  import {fly} from "@lib/transition"
  import AddCircle from "@assets/icons/add-circle.svg?dataurl"
  import Letter from "@assets/icons/letter-opened.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import MarketplaceCreate from "@app/components/MarketplaceCreate.svelte"
  import ProfileLink from "@app/components/ProfileLink.svelte"
  import ChatEnable from "@app/components/ChatEnable.svelte"
  import ContentMinimal from "@app/components/ContentMinimal.svelte"
  import {pushModal} from "@app/util/modal"
  import {shouldUnwrap} from "@welshman/app"
  import {
    decodeRelay,
    ANMORE_RELAY,
    MARKETPLACE_STALL,
    MARKETPLACE_PRODUCT,
    CLASSIFIED_LISTING,
  } from "@app/core/state"
  import {makeFeed} from "@app/core/requests"
  import {makeChatPath} from "@app/util/routes"
  import type {TrustedEvent} from "@welshman/util"
  import {getTagValue} from "@welshman/util"
  import {tryCatch, parseJson} from "@welshman/lib"

  const url = decodeRelay($page.params.relay!)

  // Redirect to root /marketplace for ANMORE_RELAY (always relay.anmore.me)
  if (url === ANMORE_RELAY) {
    goto("/marketplace", {replaceState: true})
  }

  const createListing = () => pushModal(MarketplaceCreate, {url})

  let element: HTMLElement | undefined = $state()
  let loading = $state(true)
  let events: Readable<TrustedEvent[]> = $state(readable([]))
  let categoryFilter = $state<"all" | "service" | "good">("all")

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

  const openChat = (pubkey: string) => {
    const chatPath = makeChatPath([pubkey])
    if (get(shouldUnwrap)) {
      goto(chatPath)
    } else {
      pushModal(ChatEnable, {next: chatPath})
    }
  }

  const filteredEvents = $derived.by(() => {
    if (categoryFilter === "all") {
      return $events
    }
    return $events.filter(event => {
      const category = getTagValue("category", event.tags)
      return category === categoryFilter
    })
  })
</script>

<div class="flex h-full flex-col">
  <div class="flex flex-col gap-2 border-b border-base-300 bg-base-100 p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Marketplace</h2>
      <Button class="btn btn-primary btn-sm" onclick={createListing}>
        <Icon icon={AddCircle} />
        New Listing
      </Button>
    </div>
    <div class="flex gap-2">
      <Button
        class={`btn btn-sm ${categoryFilter === "all" ? "btn-primary" : "btn-neutral"}`}
        onclick={() => (categoryFilter = "all")}>
        All
      </Button>
      <Button
        class={`btn btn-sm ${categoryFilter === "service" ? "btn-primary" : "btn-neutral"}`}
        onclick={() => (categoryFilter = "service")}>
        Services
      </Button>
      <Button
        class={`btn btn-sm ${categoryFilter === "good" ? "btn-primary" : "btn-neutral"}`}
        onclick={() => (categoryFilter = "good")}>
        Goods
      </Button>
    </div>
  </div>
  <div bind:this={element} class="flex-1 overflow-auto">
    <div class="flex flex-col gap-2 p-4">
      {#each filteredEvents as event (event.id)}
        {@const data = parseMarketplaceData(event)}
        {@const title =
          data?.name ||
          getTagValue("title", event.tags) ||
          getTagValue("name", event.tags) ||
          "Untitled Listing"}
        {@const price = data?.price || getTagValue("price", event.tags)}
        {@const currency = data?.currency || getTagValue("currency", event.tags) || "CAD"}
        {@const images = data?.images || [getTagValue("image", event.tags)].filter(Boolean)}
        {@const description = data?.description || event.content}
        {@const displayEvent = data?.description ? {...event, content: data.description} : event}
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
            <div class="line-clamp-3 text-sm opacity-75">
              <ContentMinimal event={displayEvent} {url} />
            </div>
          {/if}
          <div class="mt-3 flex items-center justify-between border-t border-base-300 pt-3">
            <div class="flex items-center gap-2 text-sm opacity-75">
              <span>By</span>
              <ProfileLink pubkey={event.pubkey} {url} />
            </div>
            <Button class="btn btn-primary btn-sm" onclick={() => openChat(event.pubkey)}>
              <Icon icon={Letter} />
              Message
            </Button>
          </div>
        </div>
      {/each}
      {#if loading}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>
          <Spinner {loading}>Loading marketplace...</Spinner>
        </p>
      {:else if filteredEvents.length === 0}
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
