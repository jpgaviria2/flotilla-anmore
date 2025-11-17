import {json} from "@sveltejs/kit"
import type {RequestHandler} from "@sveltejs/kit"
import {generateSecretKey, getPublicKey} from "nostr-tools"
import * as nip19 from "nostr-tools/nip19"

const RESEND_API_KEY = process.env.RESEND_API_KEY || import.meta.env.VITE_RESEND_API_KEY

export const POST: RequestHandler = async ({request}) => {
  try {
    const {email, npub, nsecEncoded} = await request.json()

    if (!email || !email.includes("@")) {
      return json({error: "Valid email address is required"}, {status: 400})
    }

    if (!RESEND_API_KEY) {
      return json({error: "Resend API key not configured"}, {status: 500})
    }

    // Use keys from client if provided, otherwise generate server-side
    let finalNpub = npub
    let finalNsecEncoded = nsecEncoded

    if (!finalNpub || !finalNsecEncoded) {
      // Generate Nostr keypair server-side if not provided
      const nsec = generateSecretKey()
      const pubkey = getPublicKey(nsec)
      finalNpub = nip19.npubEncode(pubkey)
      finalNsecEncoded = nip19.nsecEncode(nsec)
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Anmore <onboarding@anmore.me>",
        to: email,
        subject: "Welcome to Anmore - Your Nostr Keys",
        html: `
          <h1>Welcome to Anmore!</h1>
          <p>Your Nostr account has been created. Here are your keys:</p>
          
          <h2>Public Key (npub)</h2>
          <p style="font-family: monospace; background: #f0f0f0; padding: 10px; word-break: break-all;">${finalNpub}</p>
          <p>Share this with others to receive messages and zaps.</p>
          
          <h2>Private Key (nsec) - KEEP SECRET!</h2>
          <p style="font-family: monospace; background: #fff3cd; padding: 10px; word-break: break-all; border: 2px solid #ffc107;">${finalNsecEncoded}</p>
          <p style="color: #d32f2f; font-weight: bold;">⚠️ WARNING: Never share your private key (nsec) with anyone! Store it securely.</p>
          
          <h2>What to do next:</h2>
          <ol>
            <li>Save this email in a secure location</li>
            <li>Copy your keys to a password manager or secure note</li>
            <li>Return to Anmore and log in using your keys</li>
          </ol>
          
          <p>If you lose your keys, you will not be able to recover your account.</p>
          
          <p>Happy nostring!</p>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.json()
      console.error("Resend API error:", error)
      return json({error: "Failed to send email. Please try again."}, {status: 500})
    }

    return json({success: true, message: "Keys sent to your email"})
  } catch (error) {
    console.error("Signup error:", error)
    return json({error: "An error occurred during signup"}, {status: 500})
  }
}
