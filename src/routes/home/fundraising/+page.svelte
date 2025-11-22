<script lang="ts">
  import {onMount} from "svelte"
  import {writable, derived} from "svelte/store"
  import {fly} from "@lib/transition"
  import {sortBy, partition} from "@welshman/lib"
  import AddCircle from "@assets/icons/add-circle.svg?dataurl"
  import Eye from "@assets/icons/eye.svg?dataurl"
  import EyeClosed from "@assets/icons/eye-closed.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import GoalItem from "@app/components/GoalItem.svelte"
  import GoalCreate from "@app/components/GoalCreate.svelte"
  import LogIn from "@app/components/LogIn.svelte"
  import {pushModal} from "@app/util/modal"
  import {ANMORE_RELAY} from "@app/core/state"
  import {makeFeed} from "@app/core/requests"
  import {ZAP_GOAL} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {pubkey, profilesByPubkey} from "@welshman/app"

  const createGoal = () => {
    if ($pubkey) {
      pushModal(GoalCreate, {url: ANMORE_RELAY})
    } else {
      pushModal(LogIn)
    }
  }

  let element: HTMLElement | undefined = $state()
  let loading = $state(true)
  let showUnverified = $state(false)
  const feedEventsStore = writable<TrustedEvent[]>([])
  const showUnverifiedStore = writable(false)

  // Sync state variable with store
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

  onMount(() => {
    const feed = makeFeed({
      url: ANMORE_RELAY,
      element: element!,
      filters: [{kinds: [ZAP_GOAL]}],
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
</script>

<div class="flex h-full flex-col">
  <div
    class="flex items-center justify-between border-b border-base-300 bg-base-100 p-4 md:px-6 lg:px-8">
    <h2 class="text-xl font-semibold md:text-2xl">Fundraising</h2>
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
      <Button class="btn btn-primary btn-sm md:btn-md" onclick={createGoal}>
        <Icon icon={AddCircle} />
        New Goal
      </Button>
    </div>
  </div>
  <div bind:this={element} class="flex-1 overflow-auto">
    <div
      class="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 md:max-w-6xl md:gap-6 lg:max-w-7xl lg:p-8">
      {#each $sortedEventsStore as event (event.id)}
        <div in:fly>
          <GoalItem url={ANMORE_RELAY} {event} />
        </div>
      {/each}
      {#if loading}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>
          <Spinner {loading}>Loading fundraisers...</Spinner>
        </p>
      {:else if $sortedEventsStore.length === 0}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>
          No fundraisers found.
        </p>
      {:else}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>That's all!</p>
      {/if}
    </div>
  </div>
</div>
