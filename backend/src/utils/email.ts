import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { logger } from './logger.js'

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null

export async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter) {
    logger.warn('SMTP not configured — email not sent')
    logger.info({ to, subject, html }, 'Email would have been sent')
    return
  }
  await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html })
}
