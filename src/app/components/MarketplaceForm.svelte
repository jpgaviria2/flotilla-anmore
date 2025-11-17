<script lang="ts">
  import type {Snippet} from "svelte"
  import {writable} from "svelte/store"
  import {randomId} from "@welshman/lib"
  import {makeEvent} from "@welshman/util"
  import {publishThunk} from "@welshman/app"
  import {MARKETPLACE_PRODUCT} from "@app/core/state"
  import {preventDefault} from "@lib/html"
  import GallerySend from "@assets/icons/gallery-send.svg?dataurl"
  import AltArrowLeft from "@assets/icons/alt-arrow-left.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import EditorContent from "@app/editor/EditorContent.svelte"
  import {PROTECTED} from "@app/core/state"
  import {makeEditor} from "@app/editor"
  import {pushToast} from "@app/util/toast"
  import {canEnforceNip70} from "@app/core/commands"

  type Props = {
    url: string
    h?: string
    header: Snippet
    initialValues?: {
      d: string
      title: string
      content: string
      price: string
      currency: string
      image: string
    }
  }

  const {url, h, header, initialValues}: Props = $props()

  const shouldProtect = canEnforceNip70(url)

  const uploading = writable(false)

  const back = () => history.back()

  const selectFiles = () => editor.then(ed => ed.chain().selectFiles().run())

  const submit = async () => {
    if ($uploading) return

    if (!title) {
      return pushToast({
        theme: "error",
        message: "Please provide a title.",
      })
    }

    const ed = await editor
    const content = ed.getText({blockSeparator: "\n"}).trim()
    const tags = [
      ["d", initialValues?.d || randomId()],
      ["title", title],
      ...(price ? [["price", price]] : []),
      ...(currency ? [["currency", currency]] : []),
      ...(image ? [["image", image]] : []),
      ...ed.storage.nostr.getEditorTags(),
    ]

    if (await shouldProtect) {
      tags.push(PROTECTED)
    }

    if (h) {
      tags.push(["h", h])
    }

    const event = makeEvent(MARKETPLACE_PRODUCT, {content, tags})

    pushToast({message: "Your listing has been saved!"})
    publishThunk({event, relays: [url]})
    history.back()
  }

  const content = initialValues?.content || ""
  const editor = makeEditor({url, submit, uploading, content})

  let title = $state(initialValues?.title || "")
  let price = $state(initialValues?.price || "")
  let currency = $state(initialValues?.currency || "sats")
  let image = $state(initialValues?.image || "")
</script>

<form novalidate class="column gap-4" onsubmit={preventDefault(submit)}>
  {@render header()}
  <Field>
    {#snippet label()}
      <p>Title*</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <input bind:value={title} class="grow" type="text" />
      </label>
    {/snippet}
  </Field>
  <Field>
    {#snippet label()}
      <p>Description</p>
    {/snippet}
    {#snippet input()}
      <div class="relative z-feature flex gap-2 border-t border-solid border-base-100 bg-base-100">
        <div class="input-editor flex-grow overflow-hidden">
          <EditorContent {editor} />
        </div>
        <Button data-tip="Add an image" class="center btn tooltip" onclick={selectFiles}>
          {#if $uploading}
            <span class="loading loading-spinner loading-xs"></span>
          {:else}
            <Icon icon={GallerySend} />
          {/if}
        </Button>
      </div>
    {/snippet}
  </Field>
  <Field>
    {#snippet label()}
      <p>Price (optional)</p>
    {/snippet}
    {#snippet input()}
      <div class="flex gap-2">
        <label class="input input-bordered flex w-full items-center gap-2">
          <input bind:value={price} class="grow" type="text" placeholder="0" />
        </label>
        <label class="input input-bordered flex w-full items-center gap-2">
          <input bind:value={currency} class="grow" type="text" placeholder="sats" />
        </label>
      </div>
    {/snippet}
  </Field>
  <Field>
    {#snippet label()}
      <p>Image URL (optional)</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <input bind:value={image} class="grow" type="url" placeholder="https://..." />
      </label>
    {/snippet}
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon={AltArrowLeft} />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={$uploading}>
      <Spinner loading={$uploading}>Save Listing</Spinner>
    </Button>
  </ModalFooter>
</form>
