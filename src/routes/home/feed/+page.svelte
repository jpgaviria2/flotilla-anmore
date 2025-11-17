<script lang="ts">
  import {goto} from "$app/navigation"
  import {writable, get} from "svelte/store"
  import {fly} from "@lib/transition"
  import AddCircle from "@assets/icons/add-circle.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ThreadItem from "@app/components/ThreadItem.svelte"
  import LogIn from "@app/components/LogIn.svelte"
  import {pushModal} from "@app/util/modal"
  import {ANMORE_RELAY} from "@app/core/state"
  import {makeFeed} from "@app/core/requests"
  import {THREAD} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {pubkey} from "@welshman/app"

  let element: HTMLElement | undefined = $state()
  let loading = $state(true)
  const feedEventsStore = writable<TrustedEvent[]>([])
  let feedController: ReturnType<typeof makeFeed> | null = null

  const openActivity = () => {
    if ($pubkey) {
      goto("/chat")
    } else {
      pushModal(LogIn)
    }
  }

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

<div class="flex h-full flex-col">
  <div
    class="flex items-center justify-between border-b border-base-300 bg-base-100 p-4 md:px-6 lg:px-8">
    <h2 class="text-xl font-semibold md:text-2xl">Feed</h2>
    <Button class="btn btn-primary btn-sm md:btn-md" onclick={openActivity}>
      <Icon icon={AddCircle} />
      Open Activity
    </Button>
  </div>
  <div bind:this={element} class="flex-1 overflow-auto">
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:max-w-4xl lg:max-w-5xl lg:p-8">
      {#each $feedEventsStore as event (event.id)}
        <div in:fly>
          <ThreadItem url={ANMORE_RELAY} event={$state.snapshot(event)} />
        </div>
      {/each}
      {#if loading}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>
          <Spinner {loading}>Loading feed...</Spinner>
        </p>
      {:else if $feedEventsStore.length === 0}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>No threads found.</p>
      {:else}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>That's all!</p>
      {/if}
    </div>
  </div>
</div>
