// Serverless function for Resend API proxy
// Deploy this to Vercel, Netlify, Cloudflare Workers, etc.
// Then update SignUp.svelte to call this endpoint instead

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Resend API key not configured' })
  }

  try {
    const { email } = req.body

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' })
    }

    // Import nostr-tools (you'll need to bundle this or use a CDN)
    // For now, this is a placeholder - you'd need to generate keys server-side
    // or have the client generate them and send the public key
    
    // For simplicity, let's have the client generate keys and send them
    const { npub, nsecEncoded } = req.body

    if (!npub || !nsecEncoded) {
      return res.status(400).json({ error: 'Keys are required' })
    }

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Anmore <onboarding@anmore.me>',
        to: email,
        subject: 'Welcome to Anmore - Your Nostr Keys',
        html: `
          <h1>Welcome to Anmore!</h1>
          <p>Your Nostr account has been created. Here are your keys:</p>
          
          <h2>Public Key (npub)</h2>
          <p style="font-family: monospace; background: #f0f0f0; padding: 10px; word-break: break-all;">${npub}</p>
          <p>Share this with others to receive messages and zaps.</p>
          
          <h2>Private Key (nsec) - KEEP SECRET!</h2>
          <p style="font-family: monospace; background: #fff3cd; padding: 10px; word-break: break-all; border: 2px solid #ffc107;">${nsecEncoded}</p>
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
      console.error('Resend API error:', error)
      return res.status(500).json({ error: 'Failed to send email. Please try again.' })
    }

    return res.status(200).json({ success: true, message: 'Keys sent to your email' })
  } catch (error) {
    console.error('Signup error:', error)
    return res.status(500).json({ error: 'An error occurred during signup' })
  }
}

