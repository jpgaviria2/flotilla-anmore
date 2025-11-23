<script lang="ts">
  import type {Snippet} from "svelte"
  import {writable} from "svelte/store"
  import {randomId} from "@welshman/lib"
  import {makeEvent} from "@welshman/util"
  import {publishThunk} from "@welshman/app"
  import {MARKETPLACE_PRODUCT} from "@app/core/state"
  import {preventDefault, compressFile} from "@lib/html"
  import GallerySend from "@assets/icons/gallery-send.svg?dataurl"
  import AltArrowLeft from "@assets/icons/alt-arrow-left.svg?dataurl"
  import CloseCircle from "@assets/icons/close-circle.svg?dataurl"
  import UploadMinimalistic from "@assets/icons/upload-minimalistic.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import EditorContent from "@app/editor/EditorContent.svelte"
  import {PROTECTED} from "@app/core/state"
  import {makeEditor} from "@app/editor"
  import {pushToast} from "@app/util/toast"
  import {canEnforceNip70, uploadFile} from "@app/core/commands"

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
      category: string
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
      ...(category ? [["category", category]] : []),
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
  let category = $state(initialValues?.category || "good")
  let price = $state(initialValues?.price || "")
  let currency = $state(initialValues?.currency || "CAD")
  let image = $state(initialValues?.image || "")
  let imageFile = $state<File | undefined>()
  let imagePreview = $state(initialValues?.image || "")
  let imageUploading = $state(false)

  const imageInputId = randomId()

  $effect(() => {
    if (imageFile) {
      imageUploading = true
      const reader = new FileReader()
      reader.onload = e => {
        imagePreview = e.target?.result as string
      }
      reader.readAsDataURL(imageFile)

      const uploadImage = async () => {
        try {
          const compressedFile = await compressFile(imageFile!)
          const {error, result} = await uploadFile(compressedFile)

          if (error) {
            pushToast({theme: "error", message: error})
            imageFile = undefined
            imagePreview = initialValues?.image || ""
            image = initialValues?.image || ""
          } else if (result?.url) {
            image = result.url
            imagePreview = result.url
          }
        } catch (err) {
          pushToast({theme: "error", message: "Failed to upload image"})
          imageFile = undefined
          imagePreview = initialValues?.image || ""
          image = initialValues?.image || ""
        } finally {
          imageUploading = false
        }
      }

      uploadImage()
    } else if (!image) {
      imagePreview = ""
    }
  })

  $effect(() => {
    if (image && !imageFile && !imageUploading) {
      imagePreview = image
    }
  })

  const handleImageUpload = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file && file.type.startsWith("image/")) {
      imageFile = file
    }
  }

  const clearImage = () => {
    imageFile = undefined
    image = ""
    imagePreview = ""
  }
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
      <p>Category*</p>
    {/snippet}
    {#snippet input()}
      <select bind:value={category} class="select select-bordered w-full">
        <option value="good">Good</option>
        <option value="service">Service</option>
      </select>
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
          <input bind:value={currency} class="grow" type="text" placeholder="CAD" />
        </label>
      </div>
    {/snippet}
  </Field>
  <Field>
    {#snippet label()}
      <p>Image (optional)</p>
    {/snippet}
    {#snippet input()}
      <div class="flex flex-col gap-2">
        {#if imagePreview}
          <div class="relative">
            <img
              src={imagePreview}
              alt="Preview"
              class="h-48 w-full rounded-lg border border-base-300 object-cover" />
            <Button
              type="button"
              class="btn btn-error btn-sm absolute right-2 top-2"
              onclick={clearImage}>
              <Icon icon={CloseCircle} />
            </Button>
          </div>
        {/if}
        <div class="flex gap-2">
          <label class="input input-bordered flex w-full items-center gap-2">
            <input
              bind:value={image}
              class="grow"
              type="url"
              placeholder="https://..."
              disabled={imageUploading} />
          </label>
          <label
            for={imageInputId}
            class="btn btn-neutral flex cursor-pointer items-center gap-2"
            class:btn-disabled={imageUploading}>
            {#if imageUploading}
              <span class="loading loading-spinner loading-xs"></span>
            {:else}
              <Icon icon={UploadMinimalistic} />
            {/if}
            Upload
            <input
              id={imageInputId}
              type="file"
              accept="image/*"
              class="hidden"
              onchange={handleImageUpload}
              disabled={imageUploading} />
          </label>
        </div>
      </div>
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
