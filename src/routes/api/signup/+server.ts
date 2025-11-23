import {json} from "@sveltejs/kit"
import type {RequestHandler} from "@sveltejs/kit"
import {generateSecretKey, getPublicKey} from "nostr-tools"
import * as nip19 from "nostr-tools/nip19"
import nodemailer from "nodemailer"

// SMTP configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || import.meta.env.VITE_SMTP_HOST
const SMTP_PORT = parseInt(process.env.SMTP_PORT || import.meta.env.VITE_SMTP_PORT || "587")
const SMTP_SECURE =
  process.env.SMTP_SECURE === "true" ||
  import.meta.env.VITE_SMTP_SECURE === "true" ||
  SMTP_PORT === 465
const SMTP_USER = process.env.SMTP_USER || import.meta.env.VITE_SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS || import.meta.env.VITE_SMTP_PASS
const SMTP_FROM =
  process.env.SMTP_FROM || import.meta.env.VITE_SMTP_FROM || "Anmore <onboarding@anmore.me>"

export const POST: RequestHandler = async ({request}) => {
  try {
    const {email, npub, nsecEncoded} = await request.json()

    if (!email || !email.includes("@")) {
      return json({error: "Valid email address is required"}, {status: 400})
    }

    // Validate SMTP configuration
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return json(
        {
          error:
            "SMTP configuration is incomplete. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS.",
          details: {
            hasHost: !!SMTP_HOST,
            hasUser: !!SMTP_USER,
            hasPass: !!SMTP_PASS,
          },
        },
        {status: 500},
      )
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

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })

    // Email content
    const htmlContent = `
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
    `

    // Send email via SMTP
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: "Welcome to Anmore - Your Nostr Keys",
      html: htmlContent,
    })

    console.log("Email sent successfully:", info.messageId)

    return json({success: true, message: "Keys sent to your email", messageId: info.messageId})
  } catch (error) {
    console.error("Signup error:", error)
    return json(
      {
        error: error instanceof Error ? error.message : "An error occurred during signup",
        details: error instanceof Error ? error.stack : String(error),
      },
      {status: 500},
    )
  }
}
