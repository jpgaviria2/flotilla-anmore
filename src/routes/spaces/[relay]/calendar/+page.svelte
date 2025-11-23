<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {goto} from "$app/navigation"
  import type {Readable} from "svelte/store"
  import {readable} from "svelte/store"
  import {now, formatTimestampAsDate} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {EVENT_TIME, getTagValue} from "@welshman/util"
  import {fly} from "@lib/transition"
  import CalendarMinimalistic from "@assets/icons/calendar-minimalistic.svg?dataurl"
  import CalendarAdd from "@assets/icons/calendar-add.svg?dataurl"
  import List from "@assets/icons/list.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import CalendarEventItem from "@app/components/CalendarEventItem.svelte"
  import CalendarEventCreate from "@app/components/CalendarEventCreate.svelte"
  import CalendarGrid from "@app/components/CalendarGrid.svelte"
  import {pushModal} from "@app/util/modal"
  import {decodeRelay, ANMORE_RELAY, makeCommentFilter} from "@app/core/state"
  import {makeCalendarFeed} from "@app/core/requests"

  const url = decodeRelay($page.params.relay!)

  // Redirect to root /calendar for ANMORE_RELAY (always relay.anmore.me)
  if (url === ANMORE_RELAY) {
    goto("/calendar", {replaceState: true})
  }

  const makeEvent = () => pushModal(CalendarEventCreate, {url})

  const getStart = (event: TrustedEvent) => parseInt(getTagValue("start", event.tags) || "")

  let element: HTMLElement | undefined = $state()
  let loading = $state(true)
  let events: Readable<TrustedEvent[]> = $state(readable([]))
  let viewMode = $state<"grid" | "list">("grid")
  let selectedDate: string | undefined = $state()

  const toggleView = () => {
    viewMode = viewMode === "grid" ? "list" : "grid"
  }

  const handleDayClick = (dateKey: string) => {
    selectedDate = dateKey
    viewMode = "list"
  }

  const clearDateFilter = () => {
    selectedDate = undefined
  }

  type Item = {
    event: TrustedEvent
    dateDisplay?: string
    isFirstFutureEvent?: boolean
  }

  const items = $derived.by(() => {
    const todayDateDisplay = formatTimestampAsDate(now())

    let haveISeenTheFuture = false
    let prevDateDisplay: string

    let filtered = $events.filter(event => !isNaN(getStart(event)))

    // Filter by selected date if in list mode with a date selected
    if (viewMode === "list" && selectedDate) {
      filtered = filtered.filter(event => {
        const eventDate = formatTimestampAsDate(getStart(event))
        return eventDate === selectedDate
      })
    }

    // For list view, sort by created_at descending (most recent first)
    // For grid view, keep sorted by start time (ascending)
    if (viewMode === "list") {
      filtered = [...filtered].sort((a, b) => b.created_at - a.created_at)
    } else {
      filtered = [...filtered].sort((a, b) => getStart(a) - getStart(b))
    }

    return filtered.map<Item>(event => {
      const newDateDisplay = formatTimestampAsDate(getStart(event))
      const dateDisplay = prevDateDisplay === newDateDisplay ? undefined : newDateDisplay
      const isFuture = todayDateDisplay === newDateDisplay || event.created_at > now()
      const isFirstFutureEvent = !haveISeenTheFuture && isFuture

      prevDateDisplay = newDateDisplay
      haveISeenTheFuture = isFuture

      return {event, dateDisplay, isFirstFutureEvent}
    })
  })

  onMount(() => {
    const feed = makeCalendarFeed({
      url,
      element: element!,
      filters: [{kinds: [EVENT_TIME]}, makeCommentFilter([EVENT_TIME])],
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
    <h2 class="text-xl font-semibold">Calendar</h2>
    <div class="flex gap-2">
      <Button class="btn btn-neutral btn-sm" onclick={toggleView}>
        <Icon icon={viewMode === "grid" ? List : CalendarMinimalistic} />
        {viewMode === "grid" ? "List" : "Grid"} View
      </Button>
      <Button class="btn btn-primary btn-sm" onclick={makeEvent}>
        <Icon icon={CalendarAdd} />
        New Event
      </Button>
    </div>
  </div>
  <div bind:this={element} class="flex-1 overflow-auto">
    <div class="flex flex-col gap-2 p-4">
      {#if loading && $events.length === 0}
        <p class="flex h-10 items-center justify-center py-20" transition:fly>
          <Spinner {loading}>Looking for events...</Spinner>
        </p>
      {:else if viewMode === "grid"}
        {#if $events.length === 0}
          <div class="flex flex-col items-center justify-center gap-4 py-20" transition:fly>
            <p class="text-center opacity-75">No events yet. Create the first one!</p>
            <Button class="btn btn-primary" onclick={makeEvent}>
              <Icon icon={CalendarAdd} />
              Create First Event
            </Button>
          </div>
        {:else}
          {@const validEvents = $events.filter(e => !isNaN(getStart(e)))}
          <CalendarGrid events={validEvents} onDayClick={handleDayClick} {selectedDate} />
        {/if}
      {:else}
        {#if selectedDate}
          <div class="flex items-center justify-between p-2">
            <p class="text-sm opacity-75">
              Showing events for {selectedDate}
            </p>
            <Button class="btn btn-neutral btn-sm" onclick={clearDateFilter}>Clear Filter</Button>
          </div>
        {/if}
        {#each items as { event, dateDisplay, isFirstFutureEvent }, i (event.id)}
          <div class={"calendar-event-" + event.id}>
            {#if isFirstFutureEvent}
              <div class="flex items-center gap-2 p-2">
                <div class="h-px flex-grow bg-primary"></div>
                <p class="text-xs uppercase text-primary">Today</p>
                <div class="h-px flex-grow bg-primary"></div>
              </div>
            {/if}
            {#if dateDisplay}
              <Divider>{dateDisplay}</Divider>
            {/if}
            <CalendarEventItem {url} {event} />
          </div>
        {/each}
        {#if loading}
          <p class="flex h-10 items-center justify-center py-20" transition:fly>
            <Spinner {loading}>Looking for events...</Spinner>
          </p>
        {:else if items.length === 0}
          <div class="flex flex-col items-center justify-center gap-4 py-20" transition:fly>
            <p class="text-center opacity-75">No events yet. Create the first one!</p>
            <Button class="btn btn-primary" onclick={makeEvent}>
              <Icon icon={CalendarAdd} />
              Create First Event
            </Button>
          </div>
        {:else}
          <p class="flex h-10 items-center justify-center py-20" transition:fly>That's all!</p>
        {/if}
      {/if}
    </div>
  </div>
</div>
