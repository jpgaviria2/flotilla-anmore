<script lang="ts">
  import {writable} from "svelte/store"
  import {makeEvent, NOTE} from "@welshman/util"
  import {publishThunk} from "@welshman/app"
  import {preventDefault} from "@lib/html"
  import Paperclip from "@assets/icons/paperclip-2.svg?dataurl"
  import AltArrowLeft from "@assets/icons/alt-arrow-left.svg?dataurl"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import EditorContent from "@app/editor/EditorContent.svelte"
  import {pushToast} from "@app/util/toast"
  import {PROTECTED} from "@app/core/state"
  import {makeEditor} from "@app/editor"
  import {canEnforceNip70} from "@app/core/commands"

  type Props = {
    url: string
  }

  const {url}: Props = $props()

  const shouldProtect = canEnforceNip70(url)

  const uploading = writable(false)

  const back = () => history.back()

  const selectFiles = () => editor.then(ed => ed.commands.selectFiles())

  const submit = async () => {
    if ($uploading) return

    const ed = await editor
    const content = ed.getText({blockSeparator: "\n"}).trim()

    if (!content.trim()) {
      return pushToast({
        theme: "error",
        message: "Please provide some content for your note.",
      })
    }

    const tags = ed.storage.nostr.getEditorTags()

    if (await shouldProtect) {
      tags.push(PROTECTED)
    }

    publishThunk({
      relays: [url],
      event: makeEvent(NOTE, {content, tags}),
    })

    pushToast({message: "Note published!"})
    ed.chain().clearContent().run()
    history.back()
  }

  const editor = makeEditor({url, submit, uploading, placeholder: "What's on your mind?"})
</script>

<form class="column gap-4" onsubmit={preventDefault(submit)}>
  <ModalHeader>
    {#snippet title()}
      <div>Create Note</div>
    {/snippet}
    {#snippet info()}
      <div>Share your thoughts with the community.</div>
    {/snippet}
  </ModalHeader>
  <div class="col-8 relative">
    <div class="note-editor flex-grow overflow-hidden">
      <EditorContent {editor} />
    </div>
    <Button
      data-tip="Add an image"
      class="tooltip tooltip-left absolute bottom-1 right-2"
      onclick={selectFiles}>
      {#if $uploading}
        <span class="loading loading-spinner loading-xs"></span>
      {:else}
        <Icon icon={Paperclip} size={3} />
      {/if}
    </Button>
  </div>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back} type="button">
      <Icon icon={AltArrowLeft} />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary">Post Note</Button>
  </ModalFooter>
</form>
