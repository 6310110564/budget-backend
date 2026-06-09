import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db/database.js'

const router = Router()

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' })
  if (password.length < 6)
    return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (exists) return res.status(409).json({ message: 'อีเมลนี้ถูกใช้แล้ว' })

  const hash = await bcrypt.hash(password, 10)
  const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hash)

  // seed default categories
  const incomes = [
    { name: 'เงินเดือน', icon: '💼' }, { name: 'โบนัส', icon: '🎁' },
    { name: 'Freelance', icon: '💻' }, { name: 'ลงทุน', icon: '📈' }, { name: 'อื่นๆ', icon: '💰' }
  ]
  const expenses = [
    { name: 'อาหาร', icon: '🍜' }, { name: 'เดินทาง', icon: '🚗' },
    { name: 'ที่พัก', icon: '🏠' }, { name: 'สุขภาพ', icon: '💊' },
    { name: 'บันเทิง', icon: '🎮' }, { name: 'ช้อปปิ้ง', icon: '🛍️' },
    { name: 'ออม', icon: '🏦' }, { name: 'อื่นๆ', icon: '📦' }
  ]
  const insertCat = db.prepare('INSERT INTO categories (user_id, name, type, icon) VALUES (?, ?, ?, ?)')
  incomes.forEach(c => insertCat.run(result.lastInsertRowid, c.name, 'income', c.icon))
  expenses.forEach(c => insertCat.run(result.lastInsertRowid, c.name, 'expense', c.icon))

  const token = jwt.sign({ id: result.lastInsertRowid, email, name }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ token, user: { id: result.lastInsertRowid, name, email } })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' })

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
})

router.get('/me', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: 'Unauthorized' })
  try {
    const payload = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET)
    const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(payload.id)
    res.json(user)
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
})

export default router
