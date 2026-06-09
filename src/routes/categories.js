import { Router } from 'express'
import db from '../db/database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/', (req, res) => {
  try {
    const { type } = req.query
    let query = 'SELECT * FROM categories WHERE user_id = ?'
    const params = [req.user.id]
    if (type) { query += ' AND type = ?'; params.push(type) }
    query += ' ORDER BY name ASC'
    const categories = db.prepare(query).all(...params)
    res.json(categories || [])
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' })
  }
})

router.post('/', (req, res) => {
  try {
    const { name, type, icon } = req.body
    if (!name || !type) return res.status(400).json({ message: 'กรุณากรอกชื่อและประเภท' })
    if (!['income', 'expense'].includes(type)) return res.status(400).json({ message: 'ประเภทต้องเป็น income หรือ expense' })
    
    const exists = db.prepare('SELECT id FROM categories WHERE user_id = ? AND name = ? AND type = ?').get(req.user.id, name, type)
    if (exists) return res.status(409).json({ message: 'หมวดหมู่นี้มีอยู่แล้ว' })
    
    const result = db.prepare('INSERT INTO categories (user_id, name, type, icon) VALUES (?, ?, ?, ?)').run(req.user.id, name, type, icon || '📦')
    const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid)
    
    if (!newCategory) {
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' })
    }
    res.status(201).json(newCategory)
  } catch (error) {
    console.error('Error creating category:', error)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const cat = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
    if (!cat) return res.status(404).json({ message: 'ไม่พบหมวดหมู่' })
    db.prepare('DELETE FROM categories WHERE id = ?').run(cat.id)
    res.json({ message: 'ลบหมวดหมู่สำเร็จ' })
  } catch (error) {
    console.error('Error deleting category:', error)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' })
  }
})

export default router
