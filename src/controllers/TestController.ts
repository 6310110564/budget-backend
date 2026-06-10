import { Request, Response } from 'express'

export async function getHello(req: Request, res: Response) {
  try {

    return res.json('Hello World, Test')
  } catch (error) {
    console.error('Error fetching categories:', error)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' })
  }
}
