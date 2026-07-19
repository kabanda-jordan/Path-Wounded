import swaggerJSDoc from 'swagger-jsdoc'
import path from 'path'

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Path Wounded API',
      version: '1.0.0',
      description: 'Logistics & freight operations platform API',
    },
    servers: [
      { url: 'http://localhost:3000/api/v1', description: 'Local dev' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {},
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            fullName: { type: 'string' },
            companyName: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['admin', 'broker', 'carrier', 'dispatcher', 'viewer'] },
            avatarUrl: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SignupRequest: {
          type: 'object',
          required: ['email', 'password', 'fullName'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@acme.com' },
            password: { type: 'string', format: 'password', minLength: 8, example: 'Secure@123' },
            fullName: { type: 'string', example: 'John Doe' },
            companyName: { type: 'string', example: 'Acme Inc.' },
            role: { type: 'string', enum: ['admin', 'broker', 'carrier', 'dispatcher', 'viewer'] },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@pathwounded.com' },
            password: { type: 'string', format: 'password', example: 'Admin@123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            fullName: { type: 'string', example: 'Jane Doe' },
            companyName: { type: 'string', example: 'Acme Inc.' },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string', format: 'password' },
            newPassword: { type: 'string', format: 'password', minLength: 8 },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            orderNumber: { type: 'string', example: 'PW-0001' },
            brokerId: { type: 'string', format: 'uuid' },
            carrierId: { type: 'string', format: 'uuid', nullable: true },
            status: { type: 'string', enum: ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'] },
            originAddress: { type: 'string' },
            destinationAddress: { type: 'string' },
            amountPaid: { type: 'string', example: '1500.00' },
            hoursOnRoad: { type: 'number', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            deliveredAt: { type: 'string', format: 'date-time', nullable: true },
            carrier: { type: 'object', nullable: true },
          },
        },
        CreateOrderRequest: {
          type: 'object',
          required: ['originAddress', 'destinationAddress'],
          properties: {
            carrierId: { type: 'string', format: 'uuid' },
            originAddress: { type: 'string', example: '123 Main St, Dallas, TX 75201' },
            destinationAddress: { type: 'string', example: '456 Oak Ave, Houston, TX 77001' },
            amountPaid: { type: 'number', example: 2500.00 },
          },
        },
        UpdateOrderRequest: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'] },
            carrierId: { type: 'string', format: 'uuid' },
            originAddress: { type: 'string' },
            destinationAddress: { type: 'string' },
            amountPaid: { type: 'number' },
            hoursOnRoad: { type: 'number' },
          },
        },
        Carrier: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Coastal Cargo Inc.' },
            logoUrl: { type: 'string', nullable: true },
            location: { type: 'string', example: 'Miami, FL' },
            rating: { type: 'number', example: 4.5 },
            vehicleCount: { type: 'integer' },
            partnerCount: { type: 'integer' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateCarrierRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Pacific Route Carriers' },
            location: { type: 'string', example: 'Los Angeles, CA' },
            logoUrl: { type: 'string', format: 'uri' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string', nullable: true },
            userId: { type: 'string', format: 'uuid' },
            carrierId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateReviewRequest: {
          type: 'object',
          required: ['rating'],
          properties: {
            rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            comment: { type: 'string', example: 'Great service!' },
            orderId: { type: 'string', format: 'uuid' },
          },
        },
        Vehicle: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['truck', 'cargo_van', 'trailer', 'cargo_plane', 'other'] },
            identifier: { type: 'string', example: 'TRK-001' },
            status: { type: 'string', enum: ['active', 'inactive', 'maintenance'] },
            carrierId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateVehicleRequest: {
          type: 'object',
          required: ['type', 'identifier'],
          properties: {
            type: { type: 'string', enum: ['truck', 'cargo_van', 'trailer', 'cargo_plane', 'other'], example: 'truck' },
            identifier: { type: 'string', example: 'TRK-042' },
            status: { type: 'string', enum: ['active', 'inactive', 'maintenance'], example: 'active' },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            orderId: { type: 'string', format: 'uuid' },
            carrierId: { type: 'string', format: 'uuid' },
            amount: { type: 'string', example: '5000.00' },
            status: { type: 'string', enum: ['unpaid', 'paid', 'overdue'] },
            dueDate: { type: 'string', format: 'date-time' },
            paidAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            order: { type: 'object', properties: { id: { type: 'string' }, orderNumber: { type: 'string' } } },
            carrier: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
          },
        },
        CreateInvoiceRequest: {
          type: 'object',
          required: ['orderId', 'carrierId', 'amount', 'dueDate'],
          properties: {
            orderId: { type: 'string', format: 'uuid' },
            carrierId: { type: 'string', format: 'uuid' },
            amount: { type: 'number', example: 5000.00 },
            dueDate: { type: 'string', format: 'date', example: '2026-08-15' },
          },
        },
        Partner: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            carrierId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            threadId: { type: 'string', format: 'uuid' },
            senderId: { type: 'string', format: 'uuid' },
            recipientId: { type: 'string', format: 'uuid' },
            body: { type: 'string' },
            readAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            sender: { type: 'object', properties: { id: { type: 'string' }, fullName: { type: 'string' } } },
            recipient: { type: 'object', properties: { id: { type: 'string' }, fullName: { type: 'string' } } },
          },
        },
        SendMessageRequest: {
          type: 'object',
          required: ['recipientId', 'body'],
          properties: {
            recipientId: { type: 'string', format: 'uuid' },
            body: { type: 'string', example: 'Hello, where is my shipment?' },
            threadId: { type: 'string', format: 'uuid' },
          },
        },
        Automation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Auto-invoice on delivery' },
            triggerType: { type: 'string', enum: ['order_delivered', 'order_created', 'order_cancelled', 'invoice_overdue', 'payment_received'] },
            actionType: { type: 'string', enum: ['send_email', 'send_notification', 'create_invoice', 'update_status', 'send_message'] },
            isActive: { type: 'boolean' },
            config: { type: 'object', nullable: true },
            userId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateAutomationRequest: {
          type: 'object',
          required: ['name', 'triggerType', 'actionType'],
          properties: {
            name: { type: 'string', example: 'Auto-invoice on delivery' },
            triggerType: { type: 'string', enum: ['order_delivered', 'order_created', 'order_cancelled', 'invoice_overdue', 'payment_received'] },
            actionType: { type: 'string', enum: ['send_email', 'send_notification', 'create_invoice', 'update_status', 'send_message'] },
            config: { type: 'object' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            body: { type: 'string' },
            readAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        OverviewStats: {
          type: 'object',
          properties: {
            totalOrders: { type: 'integer', example: 50 },
            deliveredOrders: { type: 'integer', example: 19 },
            activeOrders: { type: 'integer', example: 28 },
            pendingOrders: { type: 'integer', example: 8 },
            totalRevenue: { type: 'number', example: 148979.92 },
            avgHoursOnRoad: { type: 'number', example: 23.5 },
            activeCarriers: { type: 'integer', example: 10 },
          },
        },
        RevenueDataPoint: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date', example: '2026-07-01' },
            revenue: { type: 'number', example: 4500.00 },
          },
        },
        VehicleBreakdownItem: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'truck' },
            count: { type: 'integer', example: 12 },
            percentage: { type: 'number', example: 48 },
          },
        },
        OrderStatusItem: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'delivered' },
            count: { type: 'integer', example: 19 },
            percentage: { type: 'number', example: 38 },
          },
        },
        CarrierPerformance: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            rating: { type: 'number' },
            totalOrders: { type: 'integer' },
            deliveredOrders: { type: 'integer' },
            totalRevenue: { type: 'number' },
            avgHoursOnRoad: { type: 'number' },
            vehicleCount: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(process.cwd(), 'src', 'modules', '*', '*.routes.ts')],
}

export const swaggerSpec = swaggerJSDoc(options)
