interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

function getSmtpConfig(): SmtpConfig {
  return {
    host: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
    port: parseInt(Deno.env.get("SMTP_PORT") || "465"),
    user: Deno.env.get("SMTP_USER") || "",
    pass: Deno.env.get("SMTP_PASS") || "",
    from: Deno.env.get("EMAIL_FROM") || "",
  }
}

export function generateOtpCode(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const num = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]
  const code = Math.abs(num) % 100000000
  return code.toString().padStart(8, "0")
}

export async function sendOtpEmail(to: string, code: string, fullName: string): Promise<boolean> {
  const config = getSmtpConfig()
  if (!config.user || !config.pass) {
    console.error("SMTP credentials not configured")
    return false
  }

  const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background-color:#1e293b;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
    <div style="background:linear-gradient(135deg,#2563eb,#06b6d4);padding:32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">Velocity</h1>
    </div>
    <div style="padding:40px 32px;text-align:center;">
      <h2 style="color:#f1f5f9;margin:0 0 8px;font-size:22px;">Verify Your Identity</h2>
      <p style="color:#94a3b8;margin:0 0 32px;font-size:14px;">Hi ${fullName}, enter the code below to complete your login.</p>
      <div style="background-color:#0f172a;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin:0 0 32px;">
        <p style="color:#64748b;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
        <p style="color:#ffffff;margin:0;font-size:36px;font-weight:700;letter-spacing:8px;font-family:'Courier New',monospace;">${code}</p>
      </div>
      <p style="color:#64748b;margin:0 0 8px;font-size:13px;">This code expires in <strong style="color:#94a3b8;">5 minutes</strong></p>
      <p style="color:#64748b;margin:0;font-size:13px;">If you didn't request this, please ignore this email.</p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
      <p style="color:#475569;margin:0;font-size:11px;">Velocity Logistics Platform</p>
    </div>
  </div>
</body></html>`

  const textBody = `Your Velocity verification code is: ${code}. It expires in 5 minutes.`
  return await sendEmail(config, to, `Your Verification Code: ${code}`, htmlBody, textBody)
}

export async function sendWelcomeEmail(to: string, fullName: string, role: string): Promise<boolean> {
  const config = getSmtpConfig()
  if (!config.user || !config.pass) {
    console.error("SMTP credentials not configured")
    return false
  }

  const roleDisplay = role === "admin" ? "Admin" : "Broker"
  const origin = Deno.env.get("CORS_ORIGIN") || "https://path-wounded.vercel.app"

  const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background-color:#1e293b;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
    <div style="background:linear-gradient(135deg,#2563eb,#06b6d4);padding:32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">Velocity</h1>
    </div>
    <div style="padding:40px 32px;text-align:center;">
      <div style="width:56px;height:56px;border-radius:50%;background-color:rgba(34,197,94,0.15);display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
        <span style="font-size:28px;">&#10003;</span>
      </div>
      <h2 style="color:#f1f5f9;margin:0 0 8px;font-size:22px;">Welcome to Velocity!</h2>
      <p style="color:#94a3b8;margin:0 0 24px;font-size:14px;">Hi ${fullName}, your account has been created successfully.</p>
      <div style="background-color:#0f172a;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;margin:0 0 24px;text-align:left;">
        <p style="color:#64748b;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Account Details</p>
        <p style="color:#e2e8f0;margin:0 0 8px;font-size:14px;">Email: <strong>${to}</strong></p>
        <p style="color:#e2e8f0;margin:0;font-size:14px;">Role: <strong>${roleDisplay}</strong></p>
      </div>
      <p style="color:#94a3b8;margin:0 0 24px;font-size:14px;">Sign in anytime with your email and password. You'll receive a verification code for two-factor authentication.</p>
      <a href="${origin}/login" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">Sign In to Velocity</a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
      <p style="color:#475569;margin:0;font-size:11px;">Velocity Logistics Platform</p>
    </div>
  </div>
</body></html>`

  const textBody = `Welcome to Velocity, ${fullName}! Your account has been created as a ${roleDisplay}. Sign in at ${origin}/login`
  return await sendEmail(config, to, "Welcome to Velocity - Your Account is Ready!", htmlBody, textBody)
}

async function sendEmail(config: SmtpConfig, to: string, subject: string, htmlBody: string, textBody: string): Promise<boolean> {
  const fromAddr = config.from || config.user
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  try {
    const conn = await Deno.connectTls({ hostname: config.host, port: 465 })

    const reader = conn.readable.getReader()
    const writer = conn.writable.getWriter()

    let buffer = ""

    async function readLine(timeoutMs = 15000): Promise<string> {
      const start = Date.now()
      while (Date.now() - start < timeoutMs) {
        const idx = buffer.indexOf("\r\n")
        if (idx >= 0) {
          const line = buffer.substring(0, idx)
          buffer = buffer.substring(idx + 2)
          return line
        }
        try {
          const { value, done } = await Promise.race([
            reader.read(),
            new Promise<{ value: undefined; done: true }>((r) =>
              setTimeout(() => r({ value: undefined, done: true }), 3000)
            ),
          ])
          if (done && !value) break
          if (value) buffer += decoder.decode(value)
        } catch {
          break
        }
      }
      return buffer.trim()
    }

    async function readAllLines(timeoutMs = 15000): Promise<string[]> {
      const lines: string[] = []
      const start = Date.now()
      while (Date.now() - start < timeoutMs) {
        while (buffer.indexOf("\r\n") >= 0) {
          const idx = buffer.indexOf("\r\n")
          const line = buffer.substring(0, idx)
          buffer = buffer.substring(idx + 2)
          lines.push(line)
        }
        if (lines.length > 0) {
          const last = lines[lines.length - 1]
          if (last && !last.startsWith("250-") && !last.startsWith("250 ") === false) return lines
          if (last && /^(250\s|[^2-3])/.test(last)) return lines
        }
        try {
          const { value, done } = await Promise.race([
            reader.read(),
            new Promise<{ value: undefined; done: true }>((r) =>
              setTimeout(() => r({ value: undefined, done: true }), 3000)
            ),
          ])
          if (done && !value) break
          if (value) buffer += decoder.decode(value)
        } catch {
          break
        }
      }
      return lines
    }

    async function send(cmd: string): Promise<string> {
      await writer.write(encoder.encode(cmd + "\r\n"))
      return await readLine()
    }

    async function sendMulti(cmd: string): Promise<string[]> {
      await writer.write(encoder.encode(cmd + "\r\n"))
      return await readAllLines()
    }

    const greeting = await readLine()
    console.log("SMTP greeting:", greeting)

    const ehloResp = await sendMulti("EHLO velocity.com")
    console.log("EHLO:", ehloResp.join(" | "))

    const authResp = await send("AUTH LOGIN")
    console.log("AUTH LOGIN:", authResp)

    const userResp = await send(btoa(config.user))
    console.log("User:", userResp)

    const passResp = await send(btoa(config.pass))
    console.log("Pass:", passResp)

    if (!passResp.startsWith("235")) {
      console.error("SMTP auth failed:", passResp)
      try { reader.cancel() } catch {}
      try { writer.releaseLock() } catch {}
      try { conn.close() } catch {}
      return false
    }

    const mailResp = await send(`MAIL FROM:<${fromAddr}>`)
    console.log("MAIL FROM:", mailResp)

    const rcptResp = await send(`RCPT TO:<${to}>`)
    console.log("RCPT TO:", rcptResp)

    const dataResp = await send("DATA")
    console.log("DATA:", dataResp)

    const boundary = "----=_Part_" + Date.now()
    const emailContent = [
      `From: "Velocity" <${fromAddr}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      textBody,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      htmlBody,
      ``,
      `--${boundary}--`,
      `.`,
      ``,
    ].join("\r\n")

    await writer.write(encoder.encode(emailContent))
    const dataEndResp = await readLine()
    console.log("DATA end:", dataEndResp)

    await send("QUIT")

    try { reader.cancel() } catch {}
    try { writer.releaseLock() } catch {}
    try { conn.close() } catch {}

    return true
  } catch (err) {
    console.error("SMTP email failed:", err)
    return false
  }
}
