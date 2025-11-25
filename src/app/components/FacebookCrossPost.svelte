<script lang="ts">
  import {writable} from "svelte/store"
  import {fetchFacebookGroupPosts, crossPostFacebookPosts, type FacebookPost} from "@lib/facebook"
  import {pushToast} from "@app/util/toast"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import AltArrowLeft from "@assets/icons/alt-arrow-left.svg?dataurl"

  type Props = {
    relayUrl: string
  }

  const {relayUrl}: Props = $props()

  let groupUrl = $state("")
  let limit = $state(25)
  let loading = $state(false)
  let posts = $state<FacebookPost[]>([])
  let selectedPosts = $state<Set<string>>(new Set())
  let posting = $state(false)

  const back = () => history.back()

  const fetchPosts = async () => {
    if (!groupUrl.trim()) {
      pushToast({
        theme: "error",
        message: "Please enter a Facebook group URL",
      })
      return
    }

    loading = true
    posts = []
    selectedPosts = new Set()

    try {
      const fetchedPosts = await fetchFacebookGroupPosts(groupUrl, limit)
      posts = fetchedPosts
      
      // Auto-select all posts
      selectedPosts = new Set(fetchedPosts.map((p) => p.id))

      pushToast({
        theme: "success",
        message: `Fetched ${fetchedPosts.length} posts from Facebook`,
      })
    } catch (error) {
      console.error("Error fetching Facebook posts:", error)
      pushToast({
        theme: "error",
        message: error instanceof Error ? error.message : "Failed to fetch Facebook posts",
      })
    } finally {
      loading = false
    }
  }

  const togglePost = (postId: string) => {
    if (selectedPosts.has(postId)) {
      selectedPosts.delete(postId)
    } else {
      selectedPosts.add(postId)
    }
    selectedPosts = new Set(selectedPosts) // Trigger reactivity
  }

  const selectAll = () => {
    selectedPosts = new Set(posts.map((p) => p.id))
  }

  const deselectAll = () => {
    selectedPosts = new Set()
  }

  const crossPost = async () => {
    if (selectedPosts.size === 0) {
      pushToast({
        theme: "error",
        message: "Please select at least one post to cross-post",
      })
      return
    }

    posting = true

    try {
      const postsToPost = posts.filter((p) => selectedPosts.has(p.id))
      const promises = await crossPostFacebookPosts(postsToPost, relayUrl, {
        includeSourceLink: true,
        includeAuthor: true,
      })

      // Wait for all posts to be published
      await Promise.all(promises)

      pushToast({
        theme: "success",
        message: `Successfully cross-posted ${postsToPost.length} post(s) to Nostr`,
      })

      // Clear selection
      selectedPosts = new Set()
    } catch (error) {
      console.error("Error cross-posting:", error)
      pushToast({
        theme: "error",
        message: error instanceof Error ? error.message : "Failed to cross-post",
      })
    } finally {
      posting = false
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }
</script>

<form class="column gap-4" onsubmit={(e) => e.preventDefault()}>
  <ModalHeader>
    {#snippet title()}
      <div>Cross-Post from Facebook</div>
    {/snippet}
    {#snippet info()}
      <div>Import posts from a Facebook group and repost them to this Nostr space.</div>
    {/snippet}
  </ModalHeader>

  <div class="column gap-4">
    <Field>
      {#snippet label()}
        <p>Facebook Group URL</p>
      {/snippet}
      {#snippet input()}
        <label class="input input-bordered flex w-full items-center gap-2">
          <input
            bind:value={groupUrl}
            class="grow"
            type="text"
            placeholder="https://www.facebook.com/share/g/1DNMdih5Qu/ or https://www.facebook.com/groups/123456789/" />
        </label>
      {/snippet}
    </Field>

    <Field>
      {#snippet label()}
        <p>Number of Posts</p>
      {/snippet}
      {#snippet input()}
        <label class="input input-bordered flex w-full items-center gap-2">
          <input bind:value={limit} class="grow" type="number" min="1" max="100" />
        </label>
      {/snippet}
    </Field>

    <Button class="btn btn-primary" onclick={fetchPosts} disabled={loading || !groupUrl.trim()}>
      {#if loading}
        <span class="loading loading-spinner loading-xs"></span>
        Fetching Posts...
      {:else}
        Fetch Posts
      {/if}
    </Button>
  </div>

  {#if posts.length > 0}
    <div class="column gap-2">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">Select Posts to Cross-Post ({selectedPosts.size} selected)</h3>
        <div class="flex gap-2">
          <Button class="btn btn-sm btn-ghost" onclick={selectAll}>Select All</Button>
          <Button class="btn btn-sm btn-ghost" onclick={deselectAll}>Deselect All</Button>
        </div>
      </div>

      <div class="max-h-96 overflow-y-auto column gap-2">
        {#each posts as post (post.id)}
          <div
            class="card card-bordered cursor-pointer hover:bg-base-200 transition-colors"
            onclick={() => togglePost(post.id)}>
            <div class="card-body p-4">
              <div class="flex items-start gap-2">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm mt-1"
                  checked={selectedPosts.has(post.id)}
                  onchange={() => togglePost(post.id)} />
                <div class="flex-1 column gap-2">
                  {#if post.author}
                    <div class="text-sm font-semibold">{post.author.name}</div>
                  {/if}
                  {#if post.message}
                    <div class="text-sm whitespace-pre-wrap line-clamp-3">{post.message}</div>
                  {/if}
                  {#if post.images.length > 0}
                    <div class="text-xs text-base-content/60">
                      {post.images.length} image{post.images.length > 1 ? "s" : ""}
                    </div>
                  {/if}
                  <div class="text-xs text-base-content/60">{formatDate(post.created_time)}</div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <Button
        class="btn btn-primary"
        onclick={crossPost}
        disabled={posting || selectedPosts.size === 0}>
        {#if posting}
          <span class="loading loading-spinner loading-xs"></span>
          Cross-Posting...
        {:else}
          Cross-Post {selectedPosts.size} Selected Post{selectedPosts.size !== 1 ? "s" : ""}
        {/if}
      </Button>
    </div>
  {/if}

  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon={AltArrowLeft} />
      Go back
    </Button>
  </ModalFooter>
</form>
