import { prisma } from '../../config/database.js'

export async function listNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } })
}

export async function markRead(id: string) {
  return prisma.notification.update({ where: { id }, data: { readAt: new Date() } })
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } })
}

export async function createNotification(userId: string, type: string, payload: any) {
  return prisma.notification.create({ data: { userId, type, payload } })
}
