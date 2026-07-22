import type {EventTemplate} from "nostr-tools"
import {finalizeEvent} from "nostr-tools"
import {hexToBytes} from "nostr-tools/utils"

const NIP05_API = "https://api.trailscoffee.com/api/v1/nip05"
const DOMAIN = "trailscoffee.com"
const USERNAME_RE = /^[a-z0-9](?:[a-z0-9-]{1,18}[a-z0-9])?$/

export type Nip05CheckResult = {
  available: boolean
  suggestion?: string | null
  reason?: string | null
}

type Nip05ChallengeResult = {
  challengeId: string
  challenge: string
  expiresAt: string
}

export type Nip05ClaimResult = {
  success?: boolean
  walletId?: string
  nip05: string
  username?: string
  lud16?: string | null
}

const apiCall = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${NIP05_API}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}

  if (!res.ok) {
    throw new Error(data.error || `NIP-05 API returned ${res.status}`)
  }

  return data
}

export const normalizeNip05Username = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20)

export const isValidNip05Username = (username: string) => USERNAME_RE.test(username)

export const suggestNip05Username = (name: string | undefined, pubkey: string) => {
  const normalized = normalizeNip05Username(name || "")
  if (isValidNip05Username(normalized)) return normalized

  return normalizeNip05Username(`coffeelover${pubkey.slice(0, 6)}`)
}

export const checkNip05 = (username: string) =>
  apiCall<Nip05CheckResult>(`/check?name=${encodeURIComponent(username)}`)

const requestChallenge = (username: string, pubkey: string) =>
  apiCall<Nip05ChallengeResult>("/challenge", {
    method: "POST",
    body: JSON.stringify({
      action: "claim",
      username,
      pubkey,
    }),
  })

const signChallenge = (
  challenge: Nip05ChallengeResult,
  username: string,
  secret: string,
): ReturnType<typeof finalizeEvent> => {
  const template: EventTemplate = {
    kind: 22242,
    created_at: Math.floor(Date.now() / 1000),
    content: challenge.challenge,
    tags: [
      ["challenge", challenge.challengeId],
      ["action", "claim"],
      ["domain", DOMAIN],
      ["name", username],
    ],
  }

  return finalizeEvent(template, hexToBytes(secret))
}

export const claimNip05 = async ({
  username,
  pubkey,
  secret,
}: {
  username: string
  pubkey: string
  secret: string
}) => {
  const challenge = await requestChallenge(username, pubkey)
  const proof = signChallenge(challenge, username, secret)

  return apiCall<Nip05ClaimResult>("/claim", {
    method: "POST",
    body: JSON.stringify({
      challengeId: challenge.challengeId,
      username,
      pubkey,
      proof,
    }),
  })
}
