import { Request, Response } from 'express'
import prisma from '../config/prisma.js'

type AuthRequest = Request & {
  user?: {
    id: number
  }
}

type TransactionFilters = {
  type?: string
  category?: string
  month?: string
  year?: string
}

function buildDateRange(filters: TransactionFilters) {
  if (!filters.year) return undefined
  if (filters.month) {
    const monthValue = filters.month.toString().padStart(2, '0')
    const start = new Date(`${filters.year}-${monthValue}-01T00:00:00.000Z`)
    const end = new Date(start)
    end.setMonth(end.getMonth() + 1)
    return { gte: start, lt: end }
  }

  const start = new Date(`${filters.year}-01-01T00:00:00.000Z`)
  const end = new Date(`${Number(filters.year) + 1}-01-01T00:00:00.000Z`)
  return { gte: start, lt: end }
}

export async function getTransactions(req: AuthRequest, res: Response) {
  try {
    const where: any = { userId: req.user?.id }
    if (req.query.type) where.type = req.query.type
    if (req.query.category) where.category = req.query.category
    const dateRange = buildDateRange(req.query as TransactionFilters)
    if (dateRange) where.date = dateRange

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return res.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายการ' })
  }
}

export async function getSummary(req: AuthRequest, res: Response) {
  try {
    const where: any = { userId: req.user?.id }
    const dateRange = buildDateRange(req.query as TransactionFilters)
    if (dateRange) where.date = dateRange

    const incomeResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { ...where, type: 'income' }
    })
    const expenseResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { ...where, type: 'expense' }
    })

    const byCategory = await prisma.transaction.groupBy({
      by: ['category', 'type'],
      where,
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } }
    })

    const totalIncome = incomeResult._sum.amount ?? 0
    const totalExpense = expenseResult._sum.amount ?? 0
    return res.json({
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome - totalExpense,
      by_category: byCategory.map((item) => ({
        category: item.category,
        type: item.type,
        total: item._sum.amount ?? 0
      }))
    })
  } catch (error) {
    console.error('Error fetching summary:', error)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการคำนวณสรุป' })
  }
}

function validateTransactionPayload(payload: any) {
  const { name, amount, type, category, date } = payload
  if (!name || amount == null || !type || !category || !date) {
    const error = new Error('กรุณากรอกข้อมูลให้ครบ')
    ;(error as any).status = 400
    throw error
  }
  if (!['income', 'expense'].includes(type)) {
    const error = new Error('ประเภทต้องเป็น income หรือ expense')
    ;(error as any).status = 400
    throw error
  }
  if (Number(amount) <= 0) {
    const error = new Error('จำนวนเงินต้องมากกว่า 0')
    ;(error as any).status = 400
    throw error
  }
}

export async function createTransaction(req: AuthRequest, res: Response) {
  try {
    validateTransactionPayload(req.body)
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user?.id ?? 0,
        name: req.body.name,
        amount: Number(req.body.amount),
        type: req.body.type,
        category: req.body.category,
        date: new Date(req.body.date),
        note: req.body.note || ''
      }
    })
    return res.status(201).json(transaction)
  } catch (error) {
    if ((error as any).status) {
      return res.status((error as any).status).json({ message: (error as any).message })
    }
    console.error('Error creating transaction:', error)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรายการ' })
  }
}

export async function updateTransaction(req: AuthRequest, res: Response) {
  try {
    const transactionId = Number(req.params.id)
    const existing = await prisma.transaction.findFirst({
      where: { id: transactionId, userId: req.user?.id }
    })
    if (!existing) {
      return res.status(404).json({ message: 'ไม่พบรายการ' })
    }

    const data = {
      name: req.body.name ?? existing.name,
      amount: req.body.amount != null ? Number(req.body.amount) : existing.amount,
      type: req.body.type ?? existing.type,
      category: req.body.category ?? existing.category,
      date: req.body.date ? new Date(req.body.date) : existing.date,
      note: req.body.note ?? existing.note
    }

    if (!['income', 'expense'].includes(data.type)) {
      return res.status(400).json({ message: 'ประเภทต้องเป็น income หรือ expense' })
    }
    if (data.amount <= 0) {
      return res.status(400).json({ message: 'จำนวนเงินต้องมากกว่า 0' })
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data
    })
    return res.json(updated)
  } catch (error) {
    if ((error as any).status) {
      return res.status((error as any).status).json({ message: (error as any).message })
    }
    console.error('Error updating transaction:', error)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตรายการ' })
  }
}

export async function deleteTransaction(req: AuthRequest, res: Response) {
  try {
    const transactionId = Number(req.params.id)
    const existing = await prisma.transaction.findFirst({
      where: { id: transactionId, userId: req.user?.id }
    })
    if (!existing) {
      return res.status(404).json({ message: 'ไม่พบรายการ' })
    }

    await prisma.transaction.delete({ where: { id: transactionId } })
    return res.json({ message: 'ลบรายการสำเร็จ' })
  } catch (error) {
    if ((error as any).status) {
      return res.status((error as any).status).json({ message: (error as any).message })
    }
    console.error('Error deleting transaction:', error)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบรายการ' })
  }
}
