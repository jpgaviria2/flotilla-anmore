<script lang="ts">
  import type {Snippet} from "svelte"
  import {goto} from "$app/navigation"
  import {pubkey, userProfile} from "@welshman/app"
  import NotesMinimalistic from "@assets/icons/notes-minimalistic.svg?dataurl"
  import ShopMinimalistic from "@assets/icons/shop-minimalistic.svg?dataurl"
  import Wallet from "@assets/icons/wallet.svg?dataurl"
  import CalendarMinimalistic from "@assets/icons/calendar-minimalistic.svg?dataurl"
  import ChatRound from "@assets/icons/chat-round.svg?dataurl"
  import HomeSmile from "@assets/icons/home-smile.svg?dataurl"
  import UserRounded from "@assets/icons/user-rounded.svg?dataurl"
  import LoginIcon from "@assets/icons/login-3.svg?dataurl"
  import AddCircle from "@assets/icons/add-circle.svg?dataurl"
  import Exit from "@assets/icons/logout-3.svg?dataurl"
  import SettingsMinimalistic from "@assets/icons/settings-minimalistic.svg?dataurl"
  import ImageIcon from "@lib/components/ImageIcon.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import PrimaryNavItem from "@lib/components/PrimaryNavItem.svelte"
  import LogIn from "@app/components/LogIn.svelte"
  import SignUp from "@app/components/SignUp.svelte"
  import LogOut from "@app/components/LogOut.svelte"
  import {PLATFORM_LOGO, PLATFORM_NAME} from "@app/core/state"
  import {pushModal} from "@app/util/modal"

  type Props = {
    children?: Snippet
  }

  const {children}: Props = $props()

  const primaryNavItems = [
    {title: "Feed", href: "/feed", icon: NotesMinimalistic},
    {title: "Marketplace", href: "/marketplace", icon: ShopMinimalistic},
    {title: "Fundraising", href: "/fundraising", icon: Wallet},
    {title: "Calendar", href: "/calendar", icon: CalendarMinimalistic},
  ]

  const openLogin = () => pushModal(LogIn)
  const openSignUp = () => pushModal(SignUp)
  const openLogOut = () => pushModal(LogOut)

  const goToHome = () => goto("/feed")
  const goToSettings = () => goto("/settings/profile")
</script>

<div
  class="ml-sai mt-sai mb-sai relative z-nav hidden w-16 flex-shrink-0 bg-base-200 pt-4 md:block">
  <div class="flex h-full flex-col items-center gap-4">
    <button title={PLATFORM_NAME} class="tooltip-right" onclick={goToHome}>
      <ImageIcon alt={PLATFORM_NAME} src={PLATFORM_LOGO || HomeSmile} class="rounded-full" />
    </button>
    <Divider />
    <div class="flex flex-col items-center gap-2">
      {#each primaryNavItems as item (item.href)}
        <PrimaryNavItem title={item.title} href={item.href} class="tooltip-right">
          <ImageIcon alt={item.title} src={item.icon} size={7} />
        </PrimaryNavItem>
      {/each}
      {#if $pubkey}
        <PrimaryNavItem title="Activity" href="/chat" class="tooltip-right">
          <ImageIcon alt="Activity" src={ChatRound} size={7} />
        </PrimaryNavItem>
      {/if}
    </div>
    <Divider />
    <div class="flex flex-col items-center gap-2">
      {#if $pubkey}
        <PrimaryNavItem
          title="Profile & Settings"
          href="/settings/profile"
          prefix="/settings"
          class="tooltip-right">
          <ImageIcon
            alt="Settings"
            src={$userProfile?.picture || SettingsMinimalistic}
            size={7}
            class="rounded-full" />
        </PrimaryNavItem>
        <PrimaryNavItem title="Log out" onclick={openLogOut} class="tooltip-right">
          <ImageIcon alt="Log out" src={Exit} size={7} />
        </PrimaryNavItem>
      {:else}
        <PrimaryNavItem title="Log in" onclick={openLogin} class="tooltip-right">
          <ImageIcon alt="Log in" src={LoginIcon} size={7} />
        </PrimaryNavItem>
        <PrimaryNavItem title="Sign up" onclick={openSignUp} class="tooltip-right">
          <ImageIcon alt="Sign up" src={AddCircle} size={7} />
        </PrimaryNavItem>
      {/if}
    </div>
  </div>
</div>

{@render children?.()}

<!-- Mobile navigation -->
<div class="fixed bottom-0 left-0 right-0 z-nav h-[var(--saib)] bg-base-100 md:hidden"></div>
<div
  class="border-top bottom-sai fixed left-0 right-0 z-nav h-16 border border-base-200 bg-base-100 md:hidden">
  <div class="flex items-center justify-between px-4">
    <div class="flex flex-1 justify-around">
      {#each primaryNavItems as item (item.href)}
        <PrimaryNavItem title={item.title} href={item.href}>
          <ImageIcon alt={item.title} src={item.icon} size={7} />
        </PrimaryNavItem>
      {/each}
      {#if $pubkey}
        <PrimaryNavItem title="Activity" href="/chat">
          <ImageIcon alt="Activity" src={ChatRound} size={7} />
        </PrimaryNavItem>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      {#if $pubkey}
        <PrimaryNavItem title="Profile" onclick={goToSettings}>
          <ImageIcon
            alt="Profile"
            src={$userProfile?.picture || UserRounded}
            size={7}
            class="rounded-full" />
        </PrimaryNavItem>
      {:else}
        <PrimaryNavItem title="Log in" onclick={openLogin}>
          <ImageIcon alt="Log in" src={LoginIcon} size={7} />
        </PrimaryNavItem>
      {/if}
    </div>
  </div>
</div>
