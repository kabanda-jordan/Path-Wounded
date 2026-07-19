import { prisma } from '../../config/database.js'

export async function listVehicles(carrierId: string) {
  return prisma.vehicle.findMany({ where: { carrierId }, orderBy: { id: 'desc' } })
}

export async function getVehicle(id: string) {
  return prisma.vehicle.findUnique({ where: { id } })
}

export async function createVehicle(carrierId: string, data: { type: string; identifier: string; status?: string }) {
  const vehicle = await prisma.$transaction(async (tx) => {
    const v = await tx.vehicle.create({ data: { ...data, carrierId } as any })
    await tx.carrier.update({ where: { id: carrierId }, data: { vehicleCount: { increment: 1 } } })
    return v
  })
  return vehicle
}

export async function updateVehicle(id: string, data: Record<string, any>) {
  return prisma.vehicle.update({ where: { id }, data })
}

export async function deleteVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUniqueOrThrow({ where: { id } })
  await prisma.$transaction([
    prisma.vehicle.delete({ where: { id } }),
    prisma.carrier.update({ where: { id: vehicle.carrierId }, data: { vehicleCount: { decrement: 1 } } }),
  ])
}

export async function getVehicleBreakdown() {
  const vehicles = await prisma.vehicle.groupBy({ by: ['type'], _count: { type: true } })
  const total = vehicles.reduce((sum, v) => sum + v._count.type, 0)
  return vehicles.map((v) => ({
    type: v.type,
    count: v._count.type,
    percentage: total > 0 ? Math.round((v._count.type / total) * 100) : 0,
  }))
}
