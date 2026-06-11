import { Request, Response } from 'express'
import prisma from '../config/prisma.js'
import { TransactionType } from '@prisma/client'

type AuthRequest = Request & {
  user?: {
    id: number
  }
}

export async function getCategories(req: AuthRequest, res: Response) {
  try {
    const where: any = { userId: req.user?.id }
    if (req.query.type) where.type = req.query.type

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' }
    })

    return res.ok(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return res.error({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' })
  }
}

export async function createCategory(req: AuthRequest, res: Response) {
  try {
    const { name, type, icon } = req.body as { name?: string; type?: string; icon?: string }
    if (!name || !type) {
      return res.badRequest('กรุณากรอกชื่อและประเภท')
    }
    if (!['income', 'expense'].includes(type)) {
      return res.badRequest('ประเภทต้องเป็น income หรือ expense')
    }

    const existing = await prisma.category.findFirst({
      where: { userId: req.user?.id, name, type: TransactionType[type as 'income' | 'expense'] }
    })
    if (existing) {
      return res.badRequest('หมวดหมู่นี้มีอยู่แล้ว')
    }

    const category = await prisma.category.create({
      data: {
        userId: req.user?.id ?? 0,
        name,
        type: TransactionType[type as 'income' | 'expense'],
        icon: icon || '📦'
      }
    })

    return res.created(category)
  } catch (error) {
    console.error('Error creating category:', error)
    return res.error({ message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' })
  }
}

export async function deleteCategory(req: AuthRequest, res: Response) {
  try {
    const categoryId = Number(req.params.id)
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, userId: req.user?.id }
    })
    if (!existing) {
      return res.notFound('ไม่พบหมวดหมู่')
    }

    await prisma.category.delete({ where: { id: categoryId } })
    return res.ok({ message: 'ลบหมวดหมู่สำเร็จ' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return res.error({ message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' })
  }
}
