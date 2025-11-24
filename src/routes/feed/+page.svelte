<script lang="ts">
  import {writable, get, derived} from "svelte/store"
  import {fly} from "@lib/transition"
  import {sortBy, partition} from "@welshman/lib"
  import AddCircle from "@assets/icons/add-circle.svg?dataurl"
  import Eye from "@assets/icons/eye.svg?dataurl"
  import EyeClosed from "@assets/icons/eye-closed.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ThreadItem from "@app/components/ThreadItem.svelte"
  import ThreadCreate from "@app/components/ThreadCreate.svelte"
  import SignUp from "@app/components/SignUp.svelte"
  import PageContent from "@lib/components/PageContent.svelte"
  import {pushModal} from "@app/util/modal"
  import {ANMORE_RELAY} from "@app/core/state"
  import {makeFeed} from "@app/core/requests"
  import {THREAD} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {profilesByPubkey, pubkey} from "@welshman/app"

  let element: HTMLElement | undefined = $state()
  let loading = $state(true)
  let showUnverified = $state(false)
  const feedEventsStore = writable<TrustedEvent[]>([])
  let feedController: ReturnType<typeof makeFeed> | null = null

  const createThread = () => {
    if ($pubkey) {
      pushModal(ThreadCreate, {url: ANMORE_RELAY})
    } else {
      pushModal(SignUp)
    }
  }

  // Use derived to reactively track events, profiles, and toggle state
  // Make showUnverified a writable store so it's properly reactive
  const showUnverifiedStore = writable(false)

  // Sync state variable with store whenever it changes
  $effect(() => {
    showUnverifiedStore.set(showUnverified)
  })

  // Use derived to reactively track events, profiles, and toggle state
  const sortedEventsStore = derived(
    [feedEventsStore, profilesByPubkey, showUnverifiedStore],
    ([$events, $profilesByPubkey, $showUnverified]) => {
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
      if ($showUnverified) {
        return [...sortedVerified, ...sortedUnverified]
      } else {
        return sortedVerified
      }
    },
  )

  $effect(() => {
    if (element) {
      // Clean up previous feed if it exists
      if (feedController) {
        feedController.cleanup()
        feedController = null
      }

      const feed = makeFeed({
        url: ANMORE_RELAY,
        element: element,
        filters: [{kinds: [THREAD]}],
        onExhausted: () => {
          loading = false
        },
      })

      feedController = feed

      // Get initial events immediately (they should be loaded by makeFeed)
      const initialEvents = get(feed.events)
      if (initialEvents.length > 0) {
        feedEventsStore.set(initialEvents)
        loading = false
      }

      // Subscribe to feed events and update our writable store
      const unsubscribe = feed.events.subscribe($events => {
        feedEventsStore.set($events)
        if ($events.length > 0) {
          loading = false
        }
      })

      // Also set loading to false after a short delay if no events
      const timeout = setTimeout(() => {
        loading = false
      }, 2000)

      return () => {
        unsubscribe()
        clearTimeout(timeout)
        if (feedController) {
          feedController.cleanup()
          feedController = null
        }
      }
    }
  })
</script>

<PageContent bind:element class="flex flex-col">
  <div
    class="flex items-center justify-between border-b border-base-300 bg-base-100 p-4 md:px-6 lg:px-8">
    <h2 class="text-xl font-semibold md:text-2xl">Feed</h2>
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
      <Button class="btn btn-primary btn-sm md:btn-md" onclick={createThread}>
        <Icon icon={AddCircle} />
        New Thread
      </Button>
    </div>
  </div>
  <div class="flex-1 overflow-auto">
    <div class="flex w-full min-w-0 flex-col gap-4 p-4 md:gap-6 lg:p-8">
      {#each $sortedEventsStore as event (event.id)}
        <div in:fly>
          <ThreadItem url={ANMORE_RELAY} event={$state.snapshot(event)} />
        </div>
      {/each}
      {#if loading}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>
          <Spinner {loading}>Loading feed...</Spinner>
        </p>
      {:else if $sortedEventsStore.length === 0}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>No threads found.</p>
      {:else}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>That's all!</p>
      {/if}
    </div>
  </div>
</PageContent>
