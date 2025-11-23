<script lang="ts">
  import "@src/app.css"
  import "@capacitor-community/safe-area"
  import {throttle} from "throttle-debounce"
  import * as nip19 from "nostr-tools/nip19"
  import type {Unsubscriber} from "svelte/store"
  import {get} from "svelte/store"
  import {App, type URLOpenListenerEvent} from "@capacitor/app"
  import {Capacitor} from "@capacitor/core"
  import {dev} from "$app/environment"
  import {goto} from "$app/navigation"
  import {onMount} from "svelte"
  import LogIn from "@app/components/LogIn.svelte"
  import {pushModal} from "@app/util/modal"
  import {sync} from "@welshman/store"
  import {call, spec} from "@welshman/lib"
  import {defaultSocketPolicies} from "@welshman/net"
  import {pubkey, sessions, signerLog, shouldUnwrap, SignerLogEntryStatus} from "@welshman/app"
  import * as lib from "@welshman/lib"
  import * as util from "@welshman/util"
  import * as feeds from "@welshman/feeds"
  import * as router from "@welshman/router"
  import * as store from "@welshman/store"
  import * as welshmanSigner from "@welshman/signer"
  import * as net from "@welshman/net"
  import * as app from "@welshman/app"
  import {preferencesStorageProvider} from "@lib/storage"
  import AppContainer from "@app/components/AppContainer.svelte"
  import ModalContainer from "@app/components/ModalContainer.svelte"
  import {setupHistory} from "@app/util/history"
  import {setupTracking} from "@app/util/tracking"
  import {setupAnalytics} from "@app/util/analytics"
  import {authPolicy, trustPolicy, mostlyRestrictedPolicy} from "@app/util/policies"
  import {userSettingsValues} from "@app/core/state"
  import {syncApplicationData} from "@app/core/sync"
  import {theme} from "@app/util/theme"
  import {toast, pushToast} from "@app/util/toast"
  import {initializePushNotifications} from "@app/util/push"
  import * as commands from "@app/core/commands"
  import * as requests from "@app/core/requests"
  import * as appState from "@app/core/state"
  import * as notifications from "@app/util/notifications"
  import * as storage from "@app/util/storage"
  import NewNotificationSound from "@src/app/components/NewNotificationSound.svelte"

  const {children} = $props()

  const policies = [authPolicy, trustPolicy, mostlyRestrictedPolicy]

  // Add stuff to window for convenience
  try {
    Object.assign(window, {
      get,
      nip19,
      theme,
      ...lib,
      ...welshmanSigner,
      ...router,
      ...store,
      ...util,
      ...feeds,
      ...net,
      ...app,
      ...appState,
      ...commands,
      ...requests,
      ...notifications,
    })
  } catch (error) {
    console.error("Failed to assign window properties:", error)
  }

  // Initialize push notification handler asap
  try {
    initializePushNotifications()
  } catch (error) {
    console.warn("Failed to initialize push notifications:", error)
  }

  // Listen for navigation messages from service worker
  try {
    navigator.serviceWorker?.addEventListener("message", event => {
      if (event.data && event.data.type === "NAVIGATE") {
        goto(event.data.url)
      }
    })
  } catch (error) {
    console.warn("Failed to register service worker message listener:", error)
  }

  // Listen for deep link events (only on native platforms)
  if (Capacitor.getPlatform() !== "web") {
    try {
      App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
        const url = new URL(event.url)
        const target = `${url.pathname}${url.search}${url.hash}`
        goto(target, {replaceState: false, noScroll: false})
      })

      // Handle back button on mobile
      App.addListener("backButton", () => {
        if (window.history.length > 1) {
          window.history.back()
        } else {
          App.exitApp()
        }
      })
    } catch (error) {
      console.warn("Failed to register Capacitor App listeners:", error)
    }
  }

  // Handle return from nstart.me
  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const key = urlParams.get("key")

    if (key) {
      const nsec = sessionStorage.getItem(key)

      if (nsec) {
        // Clean up URL
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, "", cleanUrl)

        // Show instructions
        pushToast({
          message: `Welcome back! You can now log in using your nsec key. Click "Log in" and paste your nsec key (starting with nsec1...) to access your account.`,
          timeout: 8000,
        })

        // Optionally open login modal after a short delay
        setTimeout(() => {
          pushModal(LogIn)
        }, 2000)

        // Clean up sessionStorage after showing the message
        sessionStorage.removeItem(key)
        sessionStorage.removeItem(`${key}_email`)
        sessionStorage.removeItem(`${key}_npub`)
      }
    }
  })

  const unsubscribe = call(async () => {
    const unsubscribers: Unsubscriber[] = []

    try {
      // Sync stuff to localstorage
      await Promise.all([
        sync({
          key: "pubkey",
          store: pubkey,
          storage: preferencesStorageProvider,
        }),
        sync({
          key: "sessions",
          store: sessions,
          storage: preferencesStorageProvider,
        }),
        sync({
          key: "shouldUnwrap",
          store: shouldUnwrap,
          storage: preferencesStorageProvider,
        }),
      ])
    } catch (error) {
      console.error("Failed to sync preferences:", error)
    }

    try {
      // Wait until data storage is initialized before syncing other stuff
      unsubscribers.push(await storage.syncDataStores())
    } catch (error) {
      console.error("Failed to sync data stores:", error)
    }

    try {
      // Add our extra policies now that we're set up
      defaultSocketPolicies.push(...policies)

      // Remove policies when we're done
      unsubscribers.push(() => defaultSocketPolicies.splice(-policies.length))
    } catch (error) {
      console.error("Failed to setup socket policies:", error)
    }

    try {
      // History, navigation, bug tracking, application data
      unsubscribers.push(setupHistory(), setupAnalytics(), setupTracking(), syncApplicationData())
    } catch (error) {
      console.error("Failed to setup app services:", error)
    }

    try {
      // Subscribe to badge count for changes
      unsubscribers.push(notifications.badgeCount.subscribe(notifications.handleBadgeCountChanges))
    } catch (error) {
      console.error("Failed to subscribe to badge count:", error)
    }

    try {
      // Listen for signer errors, report to user via toast
      unsubscribers.push(
        signerLog.subscribe(
          throttle(10_000, $log => {
            const recent = $log.slice(-10)
            const success = recent.filter(spec({status: SignerLogEntryStatus.Success}))
            const failure = recent.filter(spec({status: SignerLogEntryStatus.Failure}))

            if (!$toast && failure.length > 5 && success.length === 0) {
              pushToast({
                theme: "error",
                timeout: 60_000,
                message: "Your signer appears to be unresponsive.",
                action: {
                  message: "Details",
                  onclick: () => goto("/settings/profile"),
                },
              })
            }
          }),
        ),
      )
    } catch (error) {
      console.error("Failed to subscribe to signer log:", error)
    }

    try {
      // Sync theme and font size
      unsubscribers.push(
        theme.subscribe($theme => {
          document.body.setAttribute("data-theme", $theme)
        }),
        userSettingsValues.subscribe($userSettingsValues => {
          // @ts-ignore
          document.documentElement.style["font-size"] = `${$userSettingsValues.font_size}rem`
        }),
      )
    } catch (error) {
      console.error("Failed to subscribe to theme/settings:", error)
    }

    return () => unsubscribers.forEach(call)
  })

  // Cleanup on hot reload
  import.meta.hot?.dispose(() => {
    if (Capacitor.getPlatform() !== "web") {
      try {
        App.removeAllListeners()
      } catch (error) {
        console.warn("Failed to remove Capacitor App listeners:", error)
      }
    }
    unsubscribe.then(call)
  })
</script>

<svelte:head>
  {#if !dev}
    <link rel="manifest" href="/manifest.webmanifest" />
  {/if}
</svelte:head>

{#await unsubscribe}
  <!-- pass -->
{:then}
  <div>
    <AppContainer>
      {@render children()}
    </AppContainer>
    <ModalContainer />
    <div class="tippy-target"></div>
    <NewNotificationSound />
  </div>
{:catch error}
  <div class="flex h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="mb-4 text-2xl font-bold text-error">Application Error</h1>
      <p class="mb-4 text-error">{error?.message || "An unexpected error occurred"}</p>
      <button class="btn btn-primary" onclick={() => window.location.reload()}>
        Reload Page
      </button>
      {#if dev}
        <pre
          class="mt-4 max-w-2xl overflow-auto rounded bg-base-200 p-4 text-left text-xs">{error?.stack ||
            String(error)}</pre>
      {/if}
    </div>
  </div>
{/await}
