<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {readable} from "svelte/store"
  import {fly} from "@lib/transition"
  import AddCircle from "@assets/icons/add-circle.svg?dataurl"
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
  import {pubkey} from "@welshman/app"

  const createGoal = () => {
    if ($pubkey) {
      pushModal(GoalCreate, {url: ANMORE_RELAY})
    } else {
      pushModal(LogIn)
    }
  }

  let element: HTMLElement | undefined = $state()
  let loading = $state(true)
  let events: Readable<TrustedEvent[]> = $state(readable([]))

  onMount(() => {
    const feed = makeFeed({
      url: ANMORE_RELAY,
      element: element!,
      filters: [{kinds: [ZAP_GOAL]}],
      onExhausted: () => {
        loading = false
      },
    })

    events = feed.events

    return () => {
      feed.cleanup()
    }
  })
</script>

<div class="flex h-full flex-col">
  <div
    class="flex items-center justify-between border-b border-base-300 bg-base-100 p-4 md:px-6 lg:px-8">
    <h2 class="text-xl font-semibold md:text-2xl">Fundraising</h2>
    <Button class="btn btn-primary btn-sm md:btn-md" onclick={createGoal}>
      <Icon icon={AddCircle} />
      New Goal
    </Button>
  </div>
  <div bind:this={element} class="flex-1 overflow-auto">
    <div
      class="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 md:max-w-6xl md:gap-6 lg:max-w-7xl lg:p-8">
      {#each $events as event (event.id)}
        <div in:fly>
          <GoalItem url={ANMORE_RELAY} {event} />
        </div>
      {/each}
      {#if loading}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>
          <Spinner {loading}>Loading fundraisers...</Spinner>
        </p>
      {:else if $events.length === 0}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>
          No fundraisers found.
        </p>
      {:else}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>That's all!</p>
      {/if}
    </div>
  </div>
</div>
