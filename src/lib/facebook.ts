/**
 * Facebook integration utilities for cross-posting to Nostr
 */

import {makeEvent, THREAD} from "@welshman/util"
import {publishThunk} from "@welshman/app"
import type {TrustedEvent} from "@welshman/util"

export interface FacebookPost {
  id: string
  message: string
  created_time: string
  author: {
    id: string
    name: string
  } | null
  images: string[]
  permalink_url?: string
}

/**
 * Convert a Facebook post to a Nostr thread event
 */
export function facebookPostToNostrThread(
  post: FacebookPost,
  relayUrl: string,
  options?: {
    includeSourceLink?: boolean
    includeAuthor?: boolean
  },
): ReturnType<typeof publishThunk> {
  const {includeSourceLink = true, includeAuthor = true} = options || {}

  // Build the content
  let content = post.message || ""

  // Add author attribution if available
  if (includeAuthor && post.author) {
    content = `From ${post.author.name}:\n\n${content}`
  }

  // Add source link if available
  if (includeSourceLink && post.permalink_url) {
    content += `\n\nSource: ${post.permalink_url}`
  }

  // Add images as markdown links if present
  if (post.images.length > 0) {
    content += "\n\n"
    post.images.forEach((imageUrl) => {
      content += `\n![Facebook image](${imageUrl})`
    })
  }

  // Build tags
  const tags: string[][] = [
    ["title", `Facebook Post${post.author ? ` by ${post.author.name}` : ""}`],
    ["facebook_post_id", post.id],
    ["published_at", post.created_time],
  ]

  // Add Facebook author info as tags
  if (post.author) {
    tags.push(["facebook_author_id", post.author.id])
    tags.push(["facebook_author_name", post.author.name])
  }

  // Add source URL as tag
  if (post.permalink_url) {
    tags.push(["r", post.permalink_url])
  }

  // Create and publish the Nostr event
  return publishThunk({
    relays: [relayUrl],
    event: makeEvent(THREAD, {content, tags}),
  })
}

/**
 * Fetch posts from a Facebook group via the API
 */
export async function fetchFacebookGroupPosts(
  groupUrl: string,
  limit: number = 25,
): Promise<FacebookPost[]> {
  const response = await fetch("/api/facebook/fetch-posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({groupUrl, limit}),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch Facebook posts")
  }

  const data = await response.json()
  return data.posts
}

/**
 * Cross-post multiple Facebook posts to Nostr
 */
export async function crossPostFacebookPosts(
  posts: FacebookPost[],
  relayUrl: string,
  options?: {
    includeSourceLink?: boolean
    includeAuthor?: boolean
  },
): Promise<Promise<void>[]> {
  return posts.map((post) => {
    const thunk = facebookPostToNostrThread(post, relayUrl, options)
    return thunk.complete
  })
}
