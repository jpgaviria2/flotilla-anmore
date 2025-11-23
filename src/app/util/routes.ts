import type {Page} from "@sveltejs/kit"
import {get} from "svelte/store"
import * as nip19 from "nostr-tools/nip19"
import {goto} from "$app/navigation"
import {nthEq, sleep} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {tracker, loadRelay} from "@welshman/app"
import {scrollToEvent} from "@lib/html"
import {identity} from "@welshman/lib"
import {
  getTagValue,
  DIRECT_MESSAGE,
  DIRECT_MESSAGE_FILE,
  MESSAGE,
  THREAD,
  ZAP_GOAL,
  EVENT_TIME,
  getPubkeyTagValues,
} from "@welshman/util"
import {
  makeChatId,
  entityLink,
  decodeRelay,
  encodeRelay,
  userSpaceUrls,
  hasNip29,
  ROOM,
  ANMORE_RELAY,
} from "@app/core/state"
import {lastPageBySpaceUrl} from "@app/util/history"

export const makeSpacePath = (url: string, ...extra: (string | undefined)[]) => {
  // For ANMORE_RELAY, use root-level paths instead of /spaces structure
  if (url === ANMORE_RELAY) {
    if (extra.length === 0) {
      return "/feed"
    }
    const route = extra[0]
    const rest = extra
      .slice(1)
      .filter(identity)
      .map(s => encodeURIComponent(s as string))
    const basePath = route === "chat" || route === "notes" ? "/feed" : `/${route}`
    return rest.length > 0 ? `${basePath}/${rest.join("/")}` : basePath
  }

  // For other relays (future multi-space support), use /spaces structure
  let path = `/spaces/${encodeRelay(url)}`

  if (extra.length > 0) {
    path +=
      "/" +
      extra
        .filter(identity)
        .map(s => encodeURIComponent(s as string))
        .join("/")
  }

  return path
}

export const goToSpace = async (url: string) => {
  // For ANMORE_RELAY, always go to /feed
  if (url === ANMORE_RELAY) {
    goto("/feed", {replaceState: true})
    return
  }

  const prevPath = lastPageBySpaceUrl.get(encodeRelay(url))

  if (prevPath) {
    goto(prevPath)
  } else if (hasNip29(await loadRelay(url))) {
    goto(makeSpacePath(url, "recent"))
  } else {
    goto(makeSpacePath(url, "chat"))
  }
}

export const makeChatPath = (pubkeys: string[]) => `/chat/${makeChatId(pubkeys)}`

export const makeRoomPath = (url: string, h: string) => {
  // For ANMORE_RELAY, rooms go to /feed (or could be /rooms/[h] in future)
  if (url === ANMORE_RELAY) {
    return `/feed` // Rooms not currently supported at root level, redirect to feed
  }
  return `/spaces/${encodeRelay(url)}/${h}`
}

export const makeSpaceChatPath = (url: string) => {
  if (url === ANMORE_RELAY) {
    return "/feed"
  }
  return makeRoomPath(url, "chat")
}

export const makeGoalPath = (url: string, eventId?: string) => {
  if (url === ANMORE_RELAY) {
    return eventId ? `/fundraising/${eventId}` : "/fundraising"
  }
  return makeSpacePath(url, "goals", eventId)
}

export const makeThreadPath = (url: string, eventId?: string) => {
  if (url === ANMORE_RELAY) {
    return eventId ? `/feed/threads/${eventId}` : "/feed"
  }
  return makeSpacePath(url, "threads", eventId)
}

export const makeCalendarPath = (url: string, eventId?: string) => {
  if (url === ANMORE_RELAY) {
    return eventId ? `/calendar/${eventId}` : "/calendar"
  }
  return makeSpacePath(url, "calendar", eventId)
}

export const getPrimaryNavItem = ($page: Page) => $page.route?.id?.split("/")[1]

export const getPrimaryNavItemIndex = ($page: Page) => {
  const urls = get(userSpaceUrls)

  switch (getPrimaryNavItem($page)) {
    case "discover":
      return urls.length + 2
    case "spaces": {
      const routeUrl = decodeRelay($page.params.relay || "")

      return urls.findIndex(url => url === routeUrl) + 1
    }
    case "settings":
      return urls.length + 3
    default:
      return 0
  }
}

export const goToEvent = async (event: TrustedEvent, options: Record<string, any> = {}) => {
  const urls = Array.from(tracker.getRelays(event.id))
  const path = await getEventPath(event, urls)

  if (path.includes("://")) {
    window.open(path)
  } else {
    goto(path, options)

    await sleep(300)
    await scrollToEvent(event.id)
  }
}

export const getEventPath = async (event: TrustedEvent, urls: string[]) => {
  if (event.kind === DIRECT_MESSAGE || event.kind === DIRECT_MESSAGE_FILE) {
    return makeChatPath([event.pubkey, ...getPubkeyTagValues(event.tags)])
  }

  const h = getTagValue(ROOM, event.tags)

  if (urls.length > 0) {
    const url = urls[0]

    if (event.kind === ZAP_GOAL) {
      return makeGoalPath(url, event.id)
    }

    if (event.kind === THREAD) {
      return makeThreadPath(url, event.id)
    }

    if (event.kind === EVENT_TIME) {
      return makeCalendarPath(url, event.id)
    }

    if (event.kind === MESSAGE) {
      if (url === ANMORE_RELAY) {
        return h ? `/feed` : "/feed" // Rooms redirect to feed for now
      }
      return h ? makeRoomPath(url, h) : makeSpacePath(url, "chat")
    }

    const kind = event.tags.find(nthEq(0, "K"))?.[1]
    const id = event.tags.find(nthEq(0, "E"))?.[1]

    if (id && kind) {
      if (parseInt(kind) === ZAP_GOAL) {
        return makeGoalPath(url, id)
      }

      if (parseInt(kind) === THREAD) {
        return makeThreadPath(url, id)
      }

      if (parseInt(kind) === EVENT_TIME) {
        return makeCalendarPath(url, id)
      }

      if (parseInt(kind) === MESSAGE) {
        if (url === ANMORE_RELAY) {
          return h ? `/feed` : "/feed" // Rooms redirect to feed for now
        }
        return h ? makeRoomPath(url, h) : makeSpacePath(url, "chat")
      }
    }
  }

  return entityLink(nip19.neventEncode({id: event.id, relays: urls}))
}

export const getRoomItemPath = (url: string, event: TrustedEvent) => {
  switch (event.kind) {
    case THREAD:
      return makeThreadPath(url, event.id)
    case ZAP_GOAL:
      return makeGoalPath(url, event.id)
    case EVENT_TIME:
      return makeCalendarPath(url, event.id)
  }
}
