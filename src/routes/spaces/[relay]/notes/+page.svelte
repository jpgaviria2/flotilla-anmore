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
  import NoteItem from "@app/components/NoteItem.svelte"
  import NoteCreate from "@app/components/NoteCreate.svelte"
  import {pushModal} from "@app/util/modal"
  import {decodeRelay} from "@app/core/state"
  import {makeFeed} from "@app/core/requests"
  import {NOTE} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"

  const url = decodeRelay($page.params.relay!)

  let element: HTMLElement | undefined = $state()
  let loading = $state(true)
  let events: Readable<TrustedEvent[]> = $state(readable([]))

  const createNote = () => pushModal(NoteCreate, {url})

  onMount(() => {
    const feed = makeFeed({
      url,
      element: element!,
      filters: [{kinds: [NOTE]}],
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
  <div class="flex items-center justify-between border-b border-base-300 bg-base-100 p-4">
    <h2 class="text-xl font-semibold">Notes</h2>
    <Button class="btn btn-primary btn-sm" onclick={createNote}>
      <Icon icon={AddCircle} />
      New Note
    </Button>
  </div>
  <div bind:this={element} class="flex-1 overflow-auto">
    <div class="flex flex-col gap-2 p-4">
      {#each $events as event (event.id)}
        <div in:fly>
          <NoteItem {url} {event} />
        </div>
      {/each}
      {#if loading}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>
          <Spinner {loading}>Loading notes...</Spinner>
        </p>
      {:else if $events.length === 0}
        <div class="flex flex-col items-center justify-center gap-4 py-20" transition:fly>
          <p class="text-center opacity-75">No notes yet. Be the first to share!</p>
          <Button class="btn btn-primary" onclick={createNote}>
            <Icon icon={AddCircle} />
            Create First Note
          </Button>
        </div>
      {:else}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>That's all!</p>
      {/if}
    </div>
  </div>
</div>
