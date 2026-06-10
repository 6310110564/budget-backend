import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'

type AuthRequest = Request & {
  user?: {
    id: number
    email: string
    name: string
  }
}

type UserPayload = {
  name: string
  email: string
  password: string
}

type CategorySeed = {
  name: string
  icon: string
}

const defaultIncomes: CategorySeed[] = [
  { name: 'เงินเดือน', icon: '💼' },
  { name: 'โบนัส', icon: '🎁' },
  { name: 'Freelance', icon: '💻' },
  { name: 'ลงทุน', icon: '📈' },
  { name: 'อื่นๆ', icon: '💰' }
]

const defaultExpenses: CategorySeed[] = [
  { name: 'อาหาร', icon: '🍜' },
  { name: 'เดินทาง', icon: '🚗' },
  { name: 'ที่พัก', icon: '🏠' },
  { name: 'สุขภาพ', icon: '💊' },
  { name: 'บันเทิง', icon: '🎮' },
  { name: 'ช้อปปิ้ง', icon: '🛍️' },
  { name: 'ออม', icon: '🏦' },
  { name: 'อื่นๆ', icon: '📦' }
]

function createToken(user: { id: number; email: string; name: string }) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d'
  })
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body as UserPayload

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ message: 'อีเมลนี้ถูกใช้แล้ว' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash
      }
    })

    const categories = [
      ...defaultIncomes.map((item) => ({
        userId: user.id,
        name: item.name,
        type: 'income',
        icon: item.icon
      })),
      ...defaultExpenses.map((item) => ({
        userId: user.id,
        name: item.name,
        type: 'expense',
        icon: item.icon
      }))
    ]

    await prisma.category.createMany({ data: categories })

    return res.status(201).json({
      token: createToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน' })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email: string; password: string }

    if (!email || !password) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
    }

    return res.json({
      token: createToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' })
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id ?? 0 },
      select: { id: true, name: true, email: true, createdAt: true }
    })

    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' })
    }

    return res.json(user)
  } catch (error) {
    console.error('Get profile error:', error)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' })
  }
}
