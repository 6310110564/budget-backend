import { Request, Response } from 'express'
import prisma from '../config/prisma.js'

export async function getHello(req: Request, res: Response) {
  try {

    const payload = {
      message: 'Hello World, Test'
    }

    return res.ok(payload)

  } catch (error) {
    console.error('Error fetching categories:', error)
    return res.error({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' })
  }
}

export async function getError(req: Request, res: Response) {
  try {
    res.error({ message: 'เกิดข้อผิดพลาด' })
  } catch (error) {
    console.error('Expected error:', error)
    return res.error({ message: 'เกิดข้อผิดพลาดตามที่คาดไว้' })
  }
}

export async function getBadReq(req: Request, res: Response) {
  try {
    res.badRequest('Invalid request')
  } catch (error) {
    console.error('Bad request error:', error)
    return res.error({ message: 'เกิดข้อผิดพลาดในการประมวลผลคำขอ' })
  }
}

export async function getUnauthorized(req: Request, res: Response) {
  try {
    res.unauthorized('Unauthorized access')
  } catch (error) {
    console.error('Unauthorized error:', error)
    return res.error({ message: 'เกิดข้อผิดพลาดในการเข้าถึง' })
  }
}

export async function getForbidden(req: Request, res: Response) {
  try {
    res.forbidden('Forbidden access')
  } catch (error) {
    console.error('Forbidden error:', error)
    return res.error({ message: 'เกิดข้อผิดพลาดในการเข้าถึง' })
  }
}

export async function getNotFound(req: Request, res: Response) {
  try {
    res.notFound('Resource not found')
  } catch (error) {
    console.error('Not found error:', error)
    return res.error({ message: 'เกิดข้อผิดพลาดในการค้นหาทรัพยากร' })
  }
}

export async function createTest(req: Request, res: Response) {
  try {
    const payload = {     
      data: {
        userId: 1,
        name: 'Test Transaction',
        amount: 100,
        type: 'income',
        category: 'Test Category',    
        date: new Date(),
        note: 'This is a test transaction'
      }
    }
    return res.created(payload)
  } catch (error) {
    console.error('Error creating test transaction:', error)
    return res.error({ message: 'เกิดข้อผิดพลาดในการสร้างรายการทดสอบ' })
  } 
}

