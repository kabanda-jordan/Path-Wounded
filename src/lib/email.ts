export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`)
    console.log(`[EMAIL STUB] Body: ${html}`)
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Velocity <noreply@velocity.com>',
      to,
      subject,
      html,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.statusText}`)
  }
}

export async function sendOtpEmail(email: string, code: string, name: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px; }
        .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        h1 { color: #1a1a1a; font-size: 24px; margin: 0 0 16px; }
        p { color: #555; line-height: 1.6; margin: 0 0 16px; }
        .code { background: #f0f0f0; border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a; margin: 24px 0; }
        .footer { color: #999; font-size: 13px; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Velocity - Verify Your Email</h1>
        <p>Hi ${name},</p>
        <p>Use the following code to verify your email address:</p>
        <div class="code">${code}</div>
        <p>This code will expire in 10 minutes.</p>
        <p class="footer">If you didn't request this, please ignore this email.</p>
      </div>
    </body>
    </html>
  `
  await sendEmail(email, 'Velocity - Your Verification Code', html)
}
