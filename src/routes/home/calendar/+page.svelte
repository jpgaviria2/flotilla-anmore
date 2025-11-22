<script lang="ts">
  import {onMount} from "svelte"
  import {writable, derived} from "svelte/store"
  import {now, formatTimestampAsDate, sortBy, partition} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {EVENT_TIME, getTagValue} from "@welshman/util"
  import {fly} from "@lib/transition"
  import CalendarMinimalistic from "@assets/icons/calendar-minimalistic.svg?dataurl"
  import CalendarAdd from "@assets/icons/calendar-add.svg?dataurl"
  import List from "@assets/icons/list.svg?dataurl"
  import Eye from "@assets/icons/eye.svg?dataurl"
  import EyeClosed from "@assets/icons/eye-closed.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import CalendarEventItem from "@app/components/CalendarEventItem.svelte"
  import CalendarEventCreate from "@app/components/CalendarEventCreate.svelte"
  import LogIn from "@app/components/LogIn.svelte"
  import CalendarGrid from "@app/components/CalendarGrid.svelte"
  import {pushModal} from "@app/util/modal"
  import {ANMORE_RELAY, makeCommentFilter} from "@app/core/state"
  import {makeCalendarFeed} from "@app/core/requests"
  import {pubkey, profilesByPubkey} from "@welshman/app"

  const makeEvent = () => {
    if ($pubkey) {
      pushModal(CalendarEventCreate, {url: ANMORE_RELAY})
    } else {
      pushModal(LogIn)
    }
  }

  const getStart = (event: TrustedEvent) => parseInt(getTagValue("start", event.tags) || "")

  let element: HTMLElement | undefined = $state()
  let loading = $state(true)
  let showUnverified = $state(false)
  const feedEventsStore = writable<TrustedEvent[]>([])
  const showUnverifiedStore = writable(false)
  let viewMode = $state<"calendar" | "list">("calendar")
  let selectedDate: string | undefined = $state()

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

  const toggleView = () => {
    viewMode = viewMode === "calendar" ? "list" : "calendar"
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

    // Use sorted events from the filter
    let filtered = $sortedEventsStore.filter(event => !isNaN(getStart(event)))

    // Filter by selected date if in list mode with a date selected
    if (viewMode === "list" && selectedDate) {
      filtered = filtered.filter(event => {
        const eventDate = formatTimestampAsDate(getStart(event))
        return eventDate === selectedDate
      })
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
      url: ANMORE_RELAY,
      element: element!,
      filters: [{kinds: [EVENT_TIME]}, makeCommentFilter([EVENT_TIME])],
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
  <div class="border-b border-base-300 bg-base-100">
    <div class="mx-auto flex w-full max-w-7xl items-center justify-between p-4 md:px-6 lg:px-8">
      <h2 class="text-xl font-semibold md:text-2xl">Calendar</h2>
      <div class="flex gap-2">
        <Button
          class="btn btn-neutral btn-sm md:btn-md"
          onclick={() => {
            showUnverified = !showUnverified
            showUnverifiedStore.set(showUnverified)
          }}>
          <Icon icon={showUnverified ? EyeClosed : Eye} />
          {showUnverified ? "Hide unverified" : "Show unverified"}
        </Button>
        <Button class="btn btn-neutral btn-sm md:btn-md" onclick={toggleView}>
          <Icon icon={viewMode === "calendar" ? List : CalendarMinimalistic} />
          {viewMode === "calendar" ? "List" : "Calendar"}
        </Button>
        <Button class="btn btn-primary btn-sm md:btn-md" onclick={makeEvent}>
          <Icon icon={CalendarAdd} />
          New Event
        </Button>
      </div>
    </div>
  </div>
  <div bind:this={element} class="flex-1 overflow-auto">
    <div
      class="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:max-w-7xl md:gap-6 lg:max-w-7xl lg:p-8">
      {#if viewMode === "calendar"}
        {#if loading && $sortedEventsStore.length === 0}
          <p class="flex h-10 items-center justify-center py-20" transition:fly>
            <Spinner {loading}>Looking for events...</Spinner>
          </p>
        {:else}
          {@const validEvents = $sortedEventsStore.filter(e => !isNaN(getStart(e)))}
          <CalendarGrid events={validEvents} onDayClick={handleDayClick} {selectedDate} />
        {/if}
      {:else}
        {#if selectedDate}
          <div class="flex items-center justify-between rounded-lg bg-base-200 p-3">
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
            <CalendarEventItem url={ANMORE_RELAY} {event} />
          </div>
        {/each}
        {#if loading}
          <p class="flex h-10 items-center justify-center py-20" transition:fly>
            <Spinner {loading}>Looking for events...</Spinner>
          </p>
        {:else if items.length === 0}
          <p class="flex h-10 items-center justify-center py-20" transition:fly>No events found.</p>
        {:else}
          <p class="flex h-10 items-center justify-center py-20" transition:fly>That's all!</p>
        {/if}
      {/if}
    </div>
  </div>
</div>
