<script lang="ts">
  import {onMount} from "svelte"
  import {goto} from "$app/navigation"
  import {writable, derived, get} from "svelte/store"
  import {fly} from "@lib/transition"
  import {sortBy, partition} from "@welshman/lib"
  import AddCircle from "@assets/icons/add-circle.svg?dataurl"
  import Eye from "@assets/icons/eye.svg?dataurl"
  import EyeClosed from "@assets/icons/eye-closed.svg?dataurl"
  import Letter from "@assets/icons/letter-opened.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import MarketplaceCreate from "@app/components/MarketplaceCreate.svelte"
  import ProfileLink from "@app/components/ProfileLink.svelte"
  import ChatEnable from "@app/components/ChatEnable.svelte"
  import SignUp from "@app/components/SignUp.svelte"
  import PageContent from "@lib/components/PageContent.svelte"
  import ContentMinimal from "@app/components/ContentMinimal.svelte"
  import {pushModal} from "@app/util/modal"
  import {shouldUnwrap} from "@welshman/app"
  import {ANMORE_RELAY} from "@app/core/state"
  import {makeFeed} from "@app/core/requests"
  import {makeChatPath} from "@app/util/routes"
  import type {TrustedEvent} from "@welshman/util"
  import {getTagValue} from "@welshman/util"
  import {tryCatch, parseJson} from "@welshman/lib"
  import {pubkey, profilesByPubkey} from "@welshman/app"

  const createListing = () => {
    if ($pubkey) {
      pushModal(MarketplaceCreate, {url: ANMORE_RELAY})
    } else {
      pushModal(SignUp)
    }
  }

  // Marketplace kinds: 30017 (stall), 30018 (product) from NIP-15, or 30402 (classified) from NIP-99
  const MARKETPLACE_STALL = 30017
  const MARKETPLACE_PRODUCT = 30018
  const CLASSIFIED_LISTING = 30402

  let element: HTMLElement | undefined = $state()
  let loading = $state(true)
  let showUnverified = $state(false)
  let categoryFilter = $state<"all" | "service" | "good">("all")
  const feedEventsStore = writable<TrustedEvent[]>([])
  const showUnverifiedStore = writable(false)
  const categoryFilterStore = writable<"all" | "service" | "good">("all")

  // Sync categoryFilter state with store
  $effect(() => {
    categoryFilterStore.set(categoryFilter)
  })

  // Sync state variable with store
  $effect(() => {
    showUnverifiedStore.set(showUnverified)
  })

  // Use derived to reactively track events, profiles, toggle state, and category filter
  const sortedEventsStore = derived(
    [feedEventsStore, profilesByPubkey, showUnverifiedStore, categoryFilterStore],
    ([$events, $profilesByPubkey, $showUnverified, $categoryFilter]) => {
      const [verifiedEvents, unverifiedEvents] = partition((event: TrustedEvent) => {
        const profile = $profilesByPubkey.get(event.pubkey)
        if (!profile?.nip05) {
          return false
        }
        return profile.nip05.toLowerCase().endsWith("@anmore.me")
      }, $events)

      // Sort each group by created_at in descending order (newest first)
      const sortedVerified = sortBy(e => -e.created_at, verifiedEvents)
      const sortedUnverified = sortBy(e => -e.created_at, unverifiedEvents)

      // If filter is OFF (showUnverified is true), show verified first, then unverified at bottom
      // If filter is ON (showUnverified is false), only show verified
      let result = $showUnverified ? [...sortedVerified, ...sortedUnverified] : sortedVerified

      // Apply category filter
      if ($categoryFilter !== "all") {
        result = result.filter(event => {
          const category = getTagValue("category", event.tags)
          return category === $categoryFilter
        })
      }

      return result
    },
  )

  onMount(() => {
    const feed = makeFeed({
      url: ANMORE_RELAY,
      element: element!,
      filters: [{kinds: [MARKETPLACE_STALL, MARKETPLACE_PRODUCT, CLASSIFIED_LISTING]}],
      onExhausted: () => {
        loading = false
      },
    })

    // Subscribe to feed events and update our writable store
    const unsubscribe = feed.events.subscribe($feedEvents => {
      feedEventsStore.set($feedEvents)
      if ($feedEvents.length > 0) {
        loading = false
      }
    })

    return () => {
      unsubscribe()
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
</script>

<PageContent bind:element class="flex flex-col">
  <div class="flex flex-col gap-2 border-b border-base-300 bg-base-100 p-4 md:px-6 lg:px-8">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold md:text-2xl">Marketplace</h2>
      <div class="flex items-center gap-2">
        <Button
          class="btn btn-neutral btn-sm md:btn-md"
          onclick={() => {
            showUnverified = !showUnverified
            showUnverifiedStore.set(showUnverified)
          }}>
          <Icon icon={showUnverified ? EyeClosed : Eye} />
          {showUnverified ? "Hide unverified" : "Show unverified"}
        </Button>
        <Button class="btn btn-primary btn-sm md:btn-md" onclick={createListing}>
          <Icon icon={AddCircle} />
          New Listing
        </Button>
      </div>
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
  <div class="flex-1 overflow-auto">
    <div class="flex w-full min-w-0 flex-col gap-4 p-4 md:gap-6 lg:p-8">
      {#each $sortedEventsStore as event (event.id)}
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
        <div in:fly class="card2 bg-alt p-4 shadow-md md:p-6 lg:p-8">
          {#if images.length > 0 && images[0]}
            <img
              src={images[0].startsWith("http") ? images[0] : `https://${images[0]}`}
              alt={title}
              class="mb-3 h-48 w-full rounded-lg object-cover md:h-64 lg:h-80" />
          {/if}
          <h3 class="text-xl font-semibold md:text-2xl">{title}</h3>
          {#if price}
            <p class="mt-2 text-lg font-bold text-primary md:text-xl">
              {price}
              {currency}
            </p>
          {/if}
          {#if description}
            <div class="mt-2 line-clamp-3 text-sm opacity-75 md:text-base">
              <ContentMinimal event={displayEvent} url={ANMORE_RELAY} />
            </div>
          {/if}
          <div class="mt-3 flex items-center justify-between border-t border-base-300 pt-3">
            <div class="flex items-center gap-2 text-sm opacity-75">
              <span>By</span>
              <ProfileLink pubkey={event.pubkey} url={ANMORE_RELAY} />
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
      {:else if $sortedEventsStore.length === 0}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>No listings found.</p>
      {:else}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>That's all!</p>
      {/if}
    </div>
  </div>
</PageContent>
