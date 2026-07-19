import { z } from 'zod'
import { prisma } from '../../config/database.js'
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js'

const createPartnerSchema = z.object({
  carrierId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.enum(['supplier', 'distributor', 'warehouse', 'customs', 'other']),
})

export async function listPartners(carrierId: string) {
  return prisma.partner.findMany({ where: { carrierId } })
}

export async function createPartner(data: { carrierId: string; name: string; type: string }) {
  const partner = await prisma.$transaction(async (tx) => {
    const p = await tx.partner.create({ data: data as any })
    await tx.carrier.update({ where: { id: data.carrierId }, data: { partnerCount: { increment: 1 } } })
    return p
  })
  return partner
}

export async function deletePartner(id: string) {
  const partner = await prisma.partner.findUniqueOrThrow({ where: { id } })
  await prisma.$transaction([
    prisma.partner.delete({ where: { id } }),
    prisma.carrier.update({ where: { id: partner.carrierId }, data: { partnerCount: { decrement: 1 } } }),
  ])
}
