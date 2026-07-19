import { PrismaClient, UserRole, OrderStatus, VehicleType, InvoiceStatus, CarrierStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.automation.deleteMany()
  await prisma.message.deleteMany()
  await prisma.review.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.partner.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.order.deleteMany()
  await prisma.carrier.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('Admin@123', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@pathwounded.com',
      passwordHash,
      fullName: 'James Admin',
      companyName: 'Path Wounded Inc.',
      role: UserRole.admin,
      emailVerified: true,
    },
  })

  const broker1 = await prisma.user.create({
    data: {
      email: 'sarah@freightco.com',
      passwordHash,
      fullName: 'Sarah Mitchell',
      companyName: 'FreightCo Logistics',
      role: UserRole.broker,
      emailVerified: true,
    },
  })

  const broker2 = await prisma.user.create({
    data: {
      email: 'mike@shipfast.com',
      passwordHash,
      fullName: 'Mike Chen',
      companyName: 'ShipFast Express',
      role: UserRole.broker,
      emailVerified: true,
    },
  })

  const dispatcher1 = await prisma.user.create({
    data: {
      email: 'lisa@dispatch.io',
      passwordHash,
      fullName: 'Lisa Park',
      companyName: 'Dispatch IO',
      role: UserRole.dispatcher,
      emailVerified: true,
    },
  })

  const viewer1 = await prisma.user.create({
    data: {
      email: 'viewer@pathwounded.com',
      passwordHash,
      fullName: 'Tom Viewer',
      role: UserRole.viewer,
      emailVerified: true,
    },
  })

  console.log('✅ Users created')

  const carrierData = [
    { name: 'Swift haul Logistics', location: 'Dallas, TX', rating: 4.8 },
    { name: 'Atlas Freight Co.', location: 'Chicago, IL', rating: 4.6 },
    { name: 'Pacific Route Carriers', location: 'Los Angeles, CA', rating: 4.5 },
    { name: 'East Coast Express', location: 'Newark, NJ', rating: 4.3 },
    { name: 'Mountain View Transport', location: 'Denver, CO', rating: 4.7 },
    { name: 'Southern Star Freight', location: 'Atlanta, GA', rating: 4.2 },
    { name: 'Northern Lights Haulage', location: 'Seattle, WA', rating: 4.4 },
    { name: 'Sun Belt Carriers', location: 'Phoenix, AZ', rating: 4.1 },
    { name: 'Great Plains Logistics', location: 'Kansas City, MO', rating: 3.9 },
    { name: 'Coastal Cargo Inc.', location: 'Miami, FL', rating: 4.0 },
  ]

  const carriers = []
  for (const data of carrierData) {
    const carrier = await prisma.carrier.create({
      data: { ...data, status: CarrierStatus.active },
    })
    carriers.push(carrier)
  }

  console.log('✅ Carriers created')

  const vehicleTypes: VehicleType[] = ['truck', 'truck', 'truck', 'truck', 'truck', 'truck', 'cargo_van', 'cargo_van', 'trailer', 'trailer', 'cargo_plane', 'other']
  const vehicles: any[] = []

  for (const carrier of carriers) {
    const count = Math.floor(Math.random() * 4) + 1
    for (let i = 0; i < count; i++) {
      const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)]
      const v = await prisma.vehicle.create({
        data: {
          carrierId: carrier.id,
          type,
          identifier: `${carrier.name.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          status: 'active' as any,
        },
      })
      vehicles.push(v)
    }
    await prisma.carrier.update({
      where: { id: carrier.id },
      data: { vehicleCount: count },
    })
  }

  console.log('✅ Vehicles created')

  const addresses = [
    { origin: '123 Main St, Houston, TX 77001', dest: '456 Oak Ave, Memphis, TN 38103' },
    { origin: '789 Industrial Blvd, Phoenix, AZ 85001', dest: '321 Commerce Dr, Las Vegas, NV 89101' },
    { origin: '555 Harbor Way, Long Beach, CA 90802', dest: '888 Mountain Rd, Salt Lake City, UT 84101' },
    { origin: '100 Port Authority, Newark, NJ 07102', dest: '200 Financial Pl, Boston, MA 02101' },
    { origin: '300 Airport Rd, Atlanta, GA 30320', dest: '400 Market St, Charlotte, NC 28202' },
    { origin: '600 Warehouse Ln, Nashville, TN 37201', dest: '700 Broad St, Birmingham, AL 35203' },
    { origin: '900 Tech Campus, Austin, TX 78701', dest: '111 Innovation Way, San Antonio, TX 78205' },
    { origin: '222 Distribution Center, Portland, OR 97201', dest: '333 Supply Chain Blvd, Boise, ID 83701' },
  ]

  const statuses: OrderStatus[] = ['pending', 'pending', 'assigned', 'assigned', 'in_transit', 'in_transit', 'in_transit', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'cancelled']
  const orders: any[] = []

  for (let i = 0; i < 50; i++) {
    const addr = addresses[i % addresses.length]
    const status = statuses[i % statuses.length]
    const carrier = carriers[i % carriers.length]
    const broker = [broker1, broker2][i % 2]
    const daysAgo = Math.floor(Math.random() * 60)
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    const amountPaid = Math.round((Math.random() * 15000 + 500) * 100) / 100

    const order = await prisma.order.create({
      data: {
        orderNumber: `PW-${String(i + 1).padStart(4, '0')}`,
        brokerId: broker.id,
        carrierId: status !== 'pending' ? carrier.id : null,
        status,
        originAddress: addr.origin,
        destinationAddress: addr.dest,
        amountPaid,
        hoursOnRoad: status === 'delivered' ? Math.round(Math.random() * 48 + 2) : null,
        deliveredAt: status === 'delivered' ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        createdAt,
      },
    })
    orders.push(order)
  }

  console.log('✅ Orders created')

  const partnerTypes = ['supplier', 'distributor', 'warehouse', 'customs', 'other'] as const
  for (const carrier of carriers) {
    const partnerCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < partnerCount; i++) {
      await prisma.partner.create({
        data: {
          carrierId: carrier.id,
          name: `Partner ${i + 1} of ${carrier.name}`,
          type: partnerTypes[i % partnerTypes.length],
        },
      })
    }
    await prisma.carrier.update({
      where: { id: carrier.id },
      data: { partnerCount },
    })
  }

  console.log('✅ Partners created')

  const deliveredOrders = orders.filter((o) => o.status === 'delivered')
  for (const order of deliveredOrders.slice(0, 25)) {
    const invoiceDate = new Date(order.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000)
    await prisma.invoice.create({
      data: {
        orderId: order.id,
        carrierId: order.carrierId!,
        amount: order.amountPaid,
        status: Math.random() > 0.3 ? InvoiceStatus.paid : Math.random() > 0.5 ? InvoiceStatus.unpaid : InvoiceStatus.overdue,
        dueDate: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        paidAt: Math.random() > 0.3 ? new Date(invoiceDate.getTime() + Math.random() * 20 * 24 * 60 * 60 * 1000) : null,
      },
    })
  }

  console.log('✅ Invoices created')

  const comments = [
    'Excellent service, very professional team.',
    'Delivered on time, great communication throughout.',
    'Smooth process from start to finish.',
    'Had a minor delay but overall good experience.',
    'Highly recommend for long-haul freight.',
    'Reliable and efficient carrier.',
    'Good pricing and transparent billing.',
    'Will definitely use again for future shipments.',
  ]

  const reviewers = [admin, broker1, broker2, dispatcher1]
  for (const carrier of carriers) {
    const reviewCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < reviewCount; i++) {
      const author = reviewers[i % reviewers.length]
      try {
        await prisma.review.create({
          data: {
            carrierId: carrier.id,
            authorId: author.id,
            rating: Math.floor(Math.random() * 2) + 4,
            comment: comments[Math.floor(Math.random() * comments.length)],
          },
        })
      } catch {}
    }
  }

  const agg = await prisma.review.groupBy({
    by: ['carrierId'],
    _avg: { rating: true },
  })
  for (const a of agg) {
    await prisma.carrier.update({
      where: { id: a.carrierId },
      data: { rating: a._avg.rating || 0 },
    })
  }

  console.log('✅ Reviews created')

  for (const user of [admin, broker1, broker2]) {
    for (let i = 0; i < 5; i++) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: ['order_update', 'invoice_created', 'system_alert'][i % 3],
          payload: { message: `Sample notification ${i + 1}` },
          readAt: i > 2 ? new Date() : null,
        },
      })
    }
  }

  console.log('✅ Notifications created')

  console.log('🎉 Seeding complete!')
  console.log(`   - Users: 5 (admin@pathwounded.com / Admin@123)`)
  console.log(`   - Carriers: ${carriers.length}`)
  console.log(`   - Vehicles: ${vehicles.length}`)
  console.log(`   - Orders: ${orders.length}`)
  console.log(`   - Invoices: 25`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
