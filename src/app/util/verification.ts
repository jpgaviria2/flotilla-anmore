import {get} from "svelte/store"
import * as nip19 from "nostr-tools/nip19"
import {bytesToHex} from "@welshman/lib"
import {handlesByNip05, profilesByPubkey} from "@welshman/app"
import {CapacitorHttp, Capacitor} from "@capacitor/core"

const verificationCache = new Map<string, boolean>()

/**
 * Verifies NIP-5 identity by fetching and checking the domain's .well-known/nostr.json file
 * According to NIP-05 spec: https://github.com/nostr-protocol/nips/blob/master/05.md
 * The nostr.json file should contain hex-format pubkeys (not npub)
 */
export const verifyNip05Domain = async (nip05: string, pubkey: string): Promise<boolean> => {
  // Parse name and domain from nip05 (e.g., "user@example.com" -> name="user", domain="example.com")
  const [name, domain] = nip05.split("@")
  if (!name || !domain) {
    console.log("verifyNip05Domain: Invalid nip05 format")
    return false
  }

  // Check cache first
  const cacheKey = `${nip05}:${pubkey}`
  if (verificationCache.has(cacheKey)) {
    const cached = verificationCache.get(cacheKey)!
    console.log("verifyNip05Domain: Using cached result:", cached)
    return cached
  }

  const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`
  console.log("verifyNip05Domain: Fetching", url)

  try {
    let data: any

    // Use CapacitorHttp for iOS (bypasses WebView fetch limitations)
    // Use fetch for PWA/web (works fine in browsers)
    if (Capacitor.getPlatform() === "ios") {
      console.log("verifyNip05Domain: Using CapacitorHttp for iOS")

      // CapacitorHttp doesn't support AbortSignal, so we use Promise.race with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      })

      const httpPromise = CapacitorHttp.get({
        url: url,
        headers: {
          Accept: "application/json",
        },
      })

      const response = await Promise.race([httpPromise, timeoutPromise])

      console.log("verifyNip05Domain: Response status:", response.status)

      if (response.status < 200 || response.status >= 300) {
        console.log("verifyNip05Domain: Response not OK")
        verificationCache.set(cacheKey, false)
        return false
      }

      data = response.data
    } else {
      // Use standard fetch for PWA/web
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 10000) // 10 second timeout

      const fetchPromise = fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      })

      // Ensure timeout is cleared if fetch succeeds
      const response = await fetchPromise.finally(() => {
        clearTimeout(timeoutId)
      })

      console.log("verifyNip05Domain: Response status:", response.status)

      if (!response.ok) {
        console.log("verifyNip05Domain: Response not OK")
        verificationCache.set(cacheKey, false)
        return false
      }

      data = await response.json()
    }
    console.log("verifyNip05Domain: Response data:", data)

    // NIP-5 spec: check data.names[name] (the part before @) matches the pubkey
    // Do case-insensitive lookup since names can have different casing
    const names = data?.names || {}
    let verifiedPubkey: string | undefined
    let matchedKey: string | undefined

    // First try exact match
    if (names[name]) {
      verifiedPubkey = names[name]
      matchedKey = name
    } else {
      // Try case-insensitive match (e.g., "jp" matches "JP")
      const nameLower = name.toLowerCase()
      for (const key in names) {
        if (key.toLowerCase() === nameLower) {
          verifiedPubkey = names[key]
          matchedKey = key
          break
        }
      }
    }

    if (!verifiedPubkey) {
      console.log("verifyNip05Domain: No pubkey found in data.names[" + name + "]")
      verificationCache.set(cacheKey, false)
      return false
    }

    console.log(
      "verifyNip05Domain: Found match - searched for:",
      name,
      "found key:",
      matchedKey,
      "pubkey:",
      verifiedPubkey,
    )

    // NIP-5 standard specifies hex format, but handle npub for backwards compatibility
    let verifiedPubkeyHex = verifiedPubkey
    if (verifiedPubkey.startsWith("npub")) {
      try {
        const {type, data: decodedData} = nip19.decode(verifiedPubkey)
        if (type === "npub") {
          // decodedData is already a hex string for npub type
          verifiedPubkeyHex =
            typeof decodedData === "string" ? decodedData : bytesToHex(decodedData)
        } else {
          console.log("verifyNip05Domain: Invalid npub type:", type)
          verificationCache.set(cacheKey, false)
          return false
        }
      } catch (error) {
        console.error("verifyNip05Domain: Error decoding npub:", error)
        verificationCache.set(cacheKey, false)
        return false
      }
    }

    // Compare hex pubkeys (case-insensitive)
    const verified = verifiedPubkeyHex.toLowerCase() === pubkey.toLowerCase()
    console.log(
      "verifyNip05Domain: Verification check - endpoint pubkey:",
      verifiedPubkey,
      "-> hex:",
      verifiedPubkeyHex,
      "user pubkey:",
      pubkey,
      "match:",
      verified,
    )

    verificationCache.set(cacheKey, verified)
    return verified
  } catch (error) {
    // Better error logging for iOS WebView
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorName = error instanceof Error ? error.name : typeof error
    console.error("verifyNip05Domain: Error:", {
      name: errorName,
      message: errorMessage,
      error: error,
    })

    // Don't cache network errors (CORS, timeouts, load failures, etc.) - these may work later
    // Only cache actual verification failures (wrong pubkey, etc.)
    // Handle various network error messages across platforms
    const isNetworkError =
      (error instanceof TypeError &&
        (errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("Load failed") ||
          errorMessage.includes("NetworkError") ||
          errorMessage.includes("Network request failed"))) ||
      (error instanceof Error && error.name === "NetworkError")

    if (isNetworkError) {
      console.log("verifyNip05Domain: Network error detected, not caching:", errorMessage)
      return false
    }

    // Handle abort errors (timeouts)
    if (error instanceof Error && error.name === "AbortError") {
      console.log("verifyNip05Domain: Request timeout, not caching")
      return false
    }

    verificationCache.set(cacheKey, false)
    return false
  }
}

/**
 * Checks if a pubkey has a NIP-5 address ending with @anmore.me
 * This is a synchronous check based on the profile's nip05 field.
 * Does not verify the domain - only checks if the nip05 field ends with @anmore.me
 */
export const hasAnmoreMeNip05 = (pubkey: string): boolean => {
  const profile = profilesByPubkey.get().get(pubkey)
  if (!profile?.nip05) {
    return false
  }
  return profile.nip05.toLowerCase().endsWith("@anmore.me")
}

/**
 * Checks if a pubkey has a verified NIP-5 identity.
 * Requires domain verification to pass. Store check is used as a quick optimization.
 */
export const isNip05Verified = async (pubkey: string, nip05?: string): Promise<boolean> => {
  if (!nip05) {
    console.log("isNip05Verified: No nip05 provided")
    return false
  }

  console.log("isNip05Verified: Checking", nip05, "for pubkey", pubkey.substring(0, 8))

  // Quick check from store (optimization - if store says it's verified, we can trust it)
  const $handlesByNip05 = get(handlesByNip05)
  const handle = $handlesByNip05.get(nip05)
  console.log(
    "isNip05Verified: Store check - handle:",
    handle ? "found" : "not found",
    handle?.pubkey === pubkey ? "matches" : "no match",
  )

  // Domain verification (primary check per NIP-05)
  console.log("isNip05Verified: Proceeding to domain verification")
  const domainVerified = await verifyNip05Domain(nip05, pubkey)
  console.log("isNip05Verified: Domain verification result:", domainVerified)

  return domainVerified
}
