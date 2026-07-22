import {getTagValue} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"

export const isNip52TimeEvent = (event: TrustedEvent) => {
  const d = getTagValue("d", event.tags)
  const title = getTagValue("title", event.tags)
  const start = Number(getTagValue("start", event.tags))
  const end = Number(getTagValue("end", event.tags))

  return Boolean(d && title && Number.isFinite(start) && Number.isFinite(end) && start < end)
}
