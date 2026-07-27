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
    port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
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
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background-color:#1e293b;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
    <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">Path Wounded</h1>
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
      <p style="color:#475569;margin:0;font-size:11px;">Path Wounded Logistics Platform</p>
    </div>
  </div>
</body>
</html>`

  const textBody = `Your Path Wounded verification code is: ${code}. It expires in 5 minutes.`

  const fromAddr = config.from || config.user
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  try {
    const conn = await Deno.connect({ hostname: config.host, port: config.port })

    const reader = conn.readable.getReader()
    const writer = conn.writable.getWriter()

    let buffer = ""

    async function readLine(timeoutMs = 10000): Promise<string> {
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
              setTimeout(() => r({ value: undefined, done: true }), 2000)
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

    async function send(cmd: string): Promise<string> {
      await writer.write(encoder.encode(cmd + "\r\n"))
      return await readLine()
    }

    // Read greeting
    await readLine()

    // EHLO
    await send("EHLO pathwounded.com")

    // STARTTLS
    await send("STARTTLS")

    // Upgrade to TLS using Deno.startTls
    const tlsConn = Deno.startTls(conn, { hostname: config.host })
    await tlsConn.writable.ready

    const tlsReader = tlsConn.readable.getReader()
    const tlsWriter = tlsConn.writable.getWriter()
    let tlsBuffer = ""

    async function tlsReadLine(timeoutMs = 10000): Promise<string> {
      const start = Date.now()
      while (Date.now() - start < timeoutMs) {
        const idx = tlsBuffer.indexOf("\r\n")
        if (idx >= 0) {
          const line = tlsBuffer.substring(0, idx)
          tlsBuffer = tlsBuffer.substring(idx + 2)
          return line
        }
        try {
          const { value, done } = await Promise.race([
            tlsReader.read(),
            new Promise<{ value: undefined; done: true }>((r) =>
              setTimeout(() => r({ value: undefined, done: true }), 2000)
            ),
          ])
          if (done && !value) break
          if (value) tlsBuffer += decoder.decode(value)
        } catch {
          break
        }
      }
      return tlsBuffer.trim()
    }

    async function tlsSend(cmd: string): Promise<string> {
      await tlsWriter.write(encoder.encode(cmd + "\r\n"))
      return await tlsReadLine()
    }

    // Read any pending TLS data
    try {
      const { value } = await Promise.race([
        tlsReader.read(),
        new Promise<{ value: undefined; done: true }>((r) =>
          setTimeout(() => r({ value: undefined, done: true }), 2000)
        ),
      ])
      if (value) tlsBuffer += decoder.decode(value)
    } catch {}

    // EHLO again over TLS
    await tlsSend("EHLO pathwounded.com")

    // AUTH LOGIN
    await tlsSend("AUTH LOGIN")
    await tlsSend(btoa(config.user))
    await tlsSend(btoa(config.pass))

    // MAIL FROM / RCPT TO / DATA
    await tlsSend(`MAIL FROM:<${fromAddr}>`)
    await tlsSend(`RCPT TO:<${to}>`)
    await tlsSend("DATA")

    // Email content
    const boundary = "----=_Part_" + Date.now()
    const emailContent = [
      `From: "Path Wounded" <${fromAddr}>`,
      `To: ${to}`,
      `Subject: Your Verification Code: ${code}`,
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

    await tlsWriter.write(encoder.encode(emailContent))
    await tlsReadLine(5000)

    // QUIT
    await tlsSend("QUIT")

    // Cleanup
    try { tlsReader.cancel() } catch {}
    try { tlsWriter.releaseLock() } catch {}
    try { reader.cancel() } catch {}
    try { writer.releaseLock() } catch {}
    try { conn.close() } catch {}
    try { tlsConn.close() } catch {}

    return true
  } catch (err) {
    console.error("SMTP email failed:", err)
    return false
  }
}
