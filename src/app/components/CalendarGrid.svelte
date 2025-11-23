<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {getTagValue} from "@welshman/util"
  import {now, secondsToDate, formatTimestampAsDate, LOCALE, dateToSeconds} from "@welshman/lib"

  type Props = {
    events: TrustedEvent[]
    onDayClick?: (dateKey: string) => void
    selectedDate?: string
  }

  const {events, onDayClick, selectedDate}: Props = $props()

  const getStart = (event: TrustedEvent) => parseInt(getTagValue("start", event.tags) || "")

  const today = secondsToDate(now())
  let currentDate = $state(new Date(today.getFullYear(), today.getMonth(), 1))

  const currentMonth = $derived(currentDate.getMonth())
  const currentYear = $derived(currentDate.getFullYear())

  const daysInMonth = $derived(new Date(currentYear, currentMonth + 1, 0).getDate())
  const firstDayOfMonth = $derived(new Date(currentYear, currentMonth, 1).getDay())

  const eventsByDate = $derived.by(() => {
    const map = new Map<string, TrustedEvent[]>()

    for (const event of events) {
      const start = getStart(event)
      if (isNaN(start)) {
        if (import.meta.env.DEV) {
          console.warn("CalendarGrid - Event has invalid start:", event.id, event.tags)
        }
        continue
      }

      const dateKey = formatTimestampAsDate(start)
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(event)

      if (import.meta.env.DEV) {
        const eventDate = secondsToDate(start)
        console.log(
          `CalendarGrid - Event ${event.id.substring(0, 8)}: start=${start}, dateKey="${dateKey}", date=${eventDate.toISOString().split("T")[0]}`,
        )
      }
    }

    if (import.meta.env.DEV) {
      console.log(
        `CalendarGrid - eventsByDate recalculated with ${events.length} events, map has ${map.size} date keys`,
      )
    }

    return map
  })

  // Debug: log events by date (only in dev)
  $effect(() => {
    if (import.meta.env.DEV && events.length > 0) {
      console.log("CalendarGrid - Total events:", events.length)
      console.log("CalendarGrid - Events by date keys:", Array.from(eventsByDate.keys()))
      console.log("CalendarGrid - Current month:", currentMonth + 1, currentYear)
      // Log sample date keys for current month
      const sampleDate15 = new Date(currentYear, currentMonth, 15, 12, 0, 0)
      const sampleKey15 = formatTimestampAsDate(dateToSeconds(sampleDate15))
      const sampleDate30 = new Date(currentYear, currentMonth, 30, 12, 0, 0)
      const sampleKey30 = formatTimestampAsDate(dateToSeconds(sampleDate30))
      console.log("CalendarGrid - Sample date key for day 15:", sampleKey15)
      console.log("CalendarGrid - Sample date key for day 30:", sampleKey30)
      // Check if day 30 key matches any event keys
      const day30Events = eventsByDate.get(sampleKey30) || []
      console.log("CalendarGrid - Events for day 30 key:", day30Events.length, sampleKey30)
    }
  })

  const isToday = (day: number) => {
    const today = secondsToDate(now())
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    )
  }

  const monthName = $derived(
    new Intl.DateTimeFormat(LOCALE, {month: "long", year: "numeric"}).format(currentDate),
  )

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const prevMonth = () => {
    currentDate = new Date(currentYear, currentMonth - 1, 1)
  }

  const nextMonth = () => {
    currentDate = new Date(currentYear, currentMonth + 1, 1)
  }

  // Helper function to get events for a specific date
  const getEventsForDate = (dateKey: string) => {
    return eventsByDate.get(dateKey) || []
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center justify-between">
    <h3 class="text-xl font-semibold">{monthName}</h3>
    <div class="flex gap-2">
      <button class="btn btn-neutral btn-sm" onclick={prevMonth} type="button"> ← </button>
      <button class="btn btn-neutral btn-sm" onclick={nextMonth} type="button"> → </button>
    </div>
  </div>

  <div class="grid min-w-0 grid-cols-7 gap-1">
    {#each weekDays as day}
      <div class="p-2 text-center text-xs font-semibold opacity-75">{day}</div>
    {/each}

    {#each Array(firstDayOfMonth) as _, i}
      <div></div>
    {/each}

    {#each Array(daysInMonth) as _, i}
      {@const day = i + 1}
      {@const date = new Date(currentYear, currentMonth, day, 12, 0, 0)}
      {@const dateKey = formatTimestampAsDate(dateToSeconds(date))}
      {@const dayEvents = getEventsForDate(dateKey)}
      {@const hasEvents = dayEvents.length > 0}
      {@const isSelected = selectedDate === dateKey}
      {#if import.meta.env.DEV && day === 30}
        {console.log(
          `CalendarGrid - Rendering day ${day}: dateKey="${dateKey}", dayEvents.length=${dayEvents.length}, hasEvents=${hasEvents}`,
          dayEvents,
        )}
      {/if}
      <button
        type="button"
        class="min-h-24 border p-1 text-left transition-colors {isToday(day)
          ? 'border-primary bg-primary/10'
          : 'border-base-300'} {isSelected ? 'border-primary bg-primary/20' : ''} {hasEvents
          ? 'cursor-pointer border-primary/30 bg-primary/5 hover:bg-base-200'
          : ''}"
        onclick={() => hasEvents && onDayClick?.(dateKey)}>
        <div
          class="mb-1 flex items-center justify-between text-sm font-semibold"
          class:text-primary={isToday(day)}>
          <span>{day}</span>
          {#if hasEvents}
            <div class="flex min-w-[20px] items-center justify-end gap-1">
              {#if dayEvents.length === 1}
                <div
                  class="h-3.5 w-3.5 rounded-full border-2 shadow-md"
                  style="background-color: #7161FF; border-color: rgba(113, 97, 255, 0.3);"
                  title="{dayEvents.length} event(s)">
                </div>
              {:else if dayEvents.length <= 3}
                {#each Array(dayEvents.length) as _}
                  <div
                    class="h-3 w-3 rounded-full border shadow-sm"
                    style="background-color: #7161FF; border-color: rgba(113, 97, 255, 0.5);">
                  </div>
                {/each}
              {:else}
                <span
                  class="rounded border px-1.5 py-0.5 text-xs font-bold text-white shadow-sm"
                  style="background-color: #7161FF; border-color: rgba(113, 97, 255, 0.3);"
                  >+{dayEvents.length}</span>
              {/if}
            </div>
          {/if}
        </div>
      </button>
    {/each}
  </div>
</div>
