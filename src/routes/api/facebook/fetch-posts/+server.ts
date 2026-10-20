import {json} from "@sveltejs/kit"
import type {RequestHandler} from "@sveltejs/kit"

// Facebook Graph API configuration from environment variables
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || import.meta.env.VITE_FACEBOOK_APP_ID
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || import.meta.env.VITE_FACEBOOK_APP_SECRET
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN
const FACEBOOK_GRAPH_API_VERSION = process.env.FACEBOOK_GRAPH_API_VERSION || import.meta.env.VITE_FACEBOOK_GRAPH_API_VERSION || "v21.0"

interface FacebookPost {
  id: string
  message?: string
  created_time: string
  from?: {
    id: string
    name: string
  }
  attachments?: {
    data: Array<{
      type: string
      media?: {
        image?: {
          src: string
        }
      }
      subattachments?: {
        data: Array<{
          type: string
          media?: {
            image?: {
              src: string
            }
          }
        }>
      }
    }>
  }
  permalink_url?: string
}

/**
 * Get Facebook Group ID from a share URL or group URL
 * Example: https://www.facebook.com/share/g/1DNMdih5Qu/?mibextid=wwXIfr
 * or: https://www.facebook.com/groups/123456789/
 */
function extractGroupId(url: string): string | null {
  // Try to extract from share URL format: /share/g/{groupId}/
  const shareMatch = url.match(/\/share\/g\/([^\/\?]+)/)
  if (shareMatch) {
    return shareMatch[1]
  }
  
  // Try to extract from groups URL format: /groups/{groupId}/
  const groupsMatch = url.match(/\/groups\/([^\/\?]+)/)
  if (groupsMatch) {
    return groupsMatch[1]
  }
  
  return null
}

/**
 * Fetch posts from a Facebook group
 */
async function fetchFacebookGroupPosts(groupId: string, limit: number = 25): Promise<FacebookPost[]> {
  if (!FACEBOOK_ACCESS_TOKEN) {
    throw new Error("Facebook access token is not configured")
  }

  const baseUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/${groupId}/feed`
  const params = new URLSearchParams({
    access_token: FACEBOOK_ACCESS_TOKEN,
    fields: "id,message,created_time,from,attachments{type,media{image{src}},subattachments{type,media{image{src}}}},permalink_url",
    limit: limit.toString(),
  })

  const response = await fetch(`${baseUrl}?${params.toString()}`)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({error: {message: "Unknown error"}}))
    throw new Error(`Facebook API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}

export const POST: RequestHandler = async ({request}) => {
  try {
    const {groupUrl, limit = 25} = await request.json()

    if (!groupUrl) {
      return json({error: "Facebook group URL is required"}, {status: 400})
    }

    // Extract group ID from URL
    const groupId = extractGroupId(groupUrl)
    if (!groupId) {
      return json(
        {
          error: "Could not extract Facebook Group ID from URL",
          hint: "Please provide a valid Facebook group URL (e.g., https://www.facebook.com/groups/123456789/ or https://www.facebook.com/share/g/1DNMdih5Qu/)",
        },
        {status: 400},
      )
    }

    // Validate Facebook configuration
    if (!FACEBOOK_ACCESS_TOKEN) {
      return json(
        {
          error: "Facebook API is not configured",
          details: {
            hasAppId: !!FACEBOOK_APP_ID,
            hasAppSecret: !!FACEBOOK_APP_SECRET,
            hasAccessToken: !!FACEBOOK_ACCESS_TOKEN,
          },
          hint: "Please configure FACEBOOK_ACCESS_TOKEN environment variable. You may need to create a Facebook App and get a long-lived access token.",
        },
        {status: 500},
      )
    }

    // Fetch posts from Facebook group
    const posts = await fetchFacebookGroupPosts(groupId, limit)

    return json({
      success: true,
      groupId,
      posts: posts.map((post) => ({
        id: post.id,
        message: post.message || "",
        created_time: post.created_time,
        author: post.from
          ? {
              id: post.from.id,
              name: post.from.name,
            }
          : null,
        images: extractImages(post),
        permalink_url: post.permalink_url,
      })),
      count: posts.length,
    })
  } catch (error) {
    console.error("Facebook fetch error:", error)
    return json(
      {
        error: error instanceof Error ? error.message : "An error occurred while fetching Facebook posts",
        details: error instanceof Error ? error.stack : String(error),
      },
      {status: 500},
    )
  }
}

/**
 * Extract image URLs from a Facebook post
 */
function extractImages(post: FacebookPost): string[] {
  const images: string[] = []

  if (post.attachments?.data) {
    for (const attachment of post.attachments.data) {
      if (attachment.media?.image?.src) {
        images.push(attachment.media.image.src)
      }
      if (attachment.subattachments?.data) {
        for (const subattachment of attachment.subattachments.data) {
          if (subattachment.media?.image?.src) {
            images.push(subattachment.media.image.src)
          }
        }
      }
    }
  }

  return images
}
