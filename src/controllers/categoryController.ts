import { Request, Response } from 'express'
import prisma from '../config/prisma.js'

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

    return res.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' })
  }
}

export async function createCategory(req: AuthRequest, res: Response) {
  try {
    const { name, type, icon } = req.body as { name?: string; type?: string; icon?: string }
    if (!name || !type) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อและประเภท' })
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'ประเภทต้องเป็น income หรือ expense' })
    }

    const existing = await prisma.category.findFirst({
      where: { userId: req.user?.id, name, type }
    })
    if (existing) {
      return res.status(409).json({ message: 'หมวดหมู่นี้มีอยู่แล้ว' })
    }

    const category = await prisma.category.create({
      data: {
        userId: req.user?.id ?? 0,
        name,
        type,
        icon: icon || '📦'
      }
    })

    return res.status(201).json(category)
  } catch (error) {
    console.error('Error creating category:', error)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' })
  }
}

export async function deleteCategory(req: AuthRequest, res: Response) {
  try {
    const categoryId = Number(req.params.id)
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, userId: req.user?.id }
    })
    if (!existing) {
      return res.status(404).json({ message: 'ไม่พบหมวดหมู่' })
    }

    await prisma.category.delete({ where: { id: categoryId } })
    return res.json({ message: 'ลบหมวดหมู่สำเร็จ' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' })
  }
}
