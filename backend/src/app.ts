import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './swagger.js'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './utils/logger.js'

import authRoutes from './modules/auth/auth.routes.js'
import usersRoutes from './modules/users/users.routes.js'
import ordersRoutes from './modules/orders/orders.routes.js'
import carriersRoutes from './modules/carriers/carriers.routes.js'
import vehiclesRoutes from './modules/vehicles/vehicles.routes.js'
import invoicesRoutes from './modules/invoices/invoices.routes.js'
import partnersRoutes from './modules/partners/partners.routes.js'
import messagesRoutes from './modules/messages/messages.routes.js'
import automationsRoutes from './modules/automations/automations.routes.js'
import notificationsRoutes from './modules/notifications/notifications.routes.js'
import analyticsRoutes from './modules/analytics/analytics.routes.js'
import reportingRoutes from './modules/reporting/reporting.routes.js'

const app = express()

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

app.use((req, _res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID()
  req.headers['x-request-id'] = requestId as string
  logger.debug({ requestId, method: req.method, path: req.path }, 'Request received')
  next()
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Path Wounded API Docs',
}))
app.get('/api/docs.json', (_req, res) => { res.setHeader('Content-Type', 'application/json'); res.send(swaggerSpec) })

const apiPrefix = '/api/v1'
app.use(`${apiPrefix}/auth`, authRoutes)
app.use(`${apiPrefix}/users`, usersRoutes)
app.use(`${apiPrefix}/orders`, ordersRoutes)
app.use(`${apiPrefix}/carriers`, carriersRoutes)
app.use(`${apiPrefix}/vehicles`, vehiclesRoutes)
app.use(`${apiPrefix}/invoices`, invoicesRoutes)
app.use(`${apiPrefix}/partners`, partnersRoutes)
app.use(`${apiPrefix}/messages`, messagesRoutes)
app.use(`${apiPrefix}/automations`, automationsRoutes)
app.use(`${apiPrefix}/notifications`, notificationsRoutes)
app.use(`${apiPrefix}/analytics`, analyticsRoutes)
app.use(`${apiPrefix}/reporting`, reportingRoutes)

app.use(errorHandler)

export default app
