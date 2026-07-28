function formatMessage(level: string, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString()
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
  return `[${timestamp}] [${level}] ${message}${metaStr}`
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.log(formatMessage('INFO', message, meta))
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(formatMessage('ERROR', message, meta))
  },
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(formatMessage('WARN', message, meta))
  },
  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('DEBUG', message, meta))
    }
  },
}
