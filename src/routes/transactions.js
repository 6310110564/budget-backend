import { Router } from "express";
import db from "../db/database.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// GET all transactions with optional filters
router.get("/", (req, res) => {
  try {
    const { type, category, month, year } = req.query;
    let query = "SELECT * FROM transactions WHERE user_id = ?";
    const params = [req.user.id];

    if (type) {
      query += " AND type = ?";
      params.push(type);
    }
    if (category) {
      query += " AND category = ?";
      params.push(category);
    }
    if (month && year) {
      query += " AND strftime('%m', date) = ? AND strftime('%Y', date) = ?";
      params.push(month.padStart(2, "0"), year);
    } else if (year) {
      query += " AND strftime('%Y', date) = ?";
      params.push(year);
    }

    query += " ORDER BY date DESC, created_at DESC";
    const rows = db.prepare(query).all(...params);
    res.json(rows || []);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายการ" });
  }
});

// GET summary (income, expense, balance)
router.get("/summary", (req, res) => {
  try {
    const { month, year } = req.query;
    let where = "WHERE user_id = ?";
    const params = [req.user.id];

    if (month && year) {
      where += " AND strftime('%m', date) = ? AND strftime('%Y', date) = ?";
      params.push(month.padStart(2, "0"), year);
    }

    const summary = db
      .prepare(
        `
      SELECT
        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) as balance
      FROM transactions ${where}
    `,
      )
      .get(...params);

    const byCategory = db
      .prepare(
        `
      SELECT category, type, SUM(amount) as total
      FROM transactions ${where}
      GROUP BY category, type
      ORDER BY total DESC
    `,
      )
      .all(...params);

    res.json({ ...summary, by_category: byCategory || [] });
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการคำนวณสรุป" });
  }
});

// POST create transaction
router.post("/", (req, res) => {
  try {
    const { name, amount, type, category, date, note } = req.body;
    if (!name || !amount || !type || !category || !date)
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
    if (!["income", "expense"].includes(type))
      return res
        .status(400)
        .json({ message: "ประเภทต้องเป็น income หรือ expense" });
    if (amount <= 0)
      return res.status(400).json({ message: "จำนวนเงินต้องมากกว่า 0" });

    const result = db
      .prepare(
        "INSERT INTO transactions (user_id, name, amount, type, category, date, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(req.user.id, name, amount, type, category, date, note || "");

    const row = db
      .prepare("SELECT * FROM transactions WHERE id = ?")
      .get(result.lastInsertRowid);
    if (!row) {
      return res
        .status(500)
        .json({ message: "เกิดข้อผิดพลาดในการสร้างรายการ" });
    }
    res.status(201).json(row);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างรายการ" });
  }
});

// PUT update transaction
router.put("/:id", (req, res) => {
  try {
    const tx = db
      .prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?")
      .get(req.params.id, req.user.id);
    if (!tx) return res.status(404).json({ message: "ไม่พบรายการ" });

    const { name, amount, type, category, date, note } = req.body;
    db.prepare(
      "UPDATE transactions SET name=?, amount=?, type=?, category=?, date=?, note=? WHERE id=?",
    ).run(
      name ?? tx.name,
      amount ?? tx.amount,
      type ?? tx.type,
      category ?? tx.category,
      date ?? tx.date,
      note ?? tx.note,
      tx.id,
    );

    const updated = db
      .prepare("SELECT * FROM transactions WHERE id = ?")
      .get(tx.id);
    res.json(updated);
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตรายการ" });
  }
});

// DELETE transaction
router.delete("/:id", (req, res) => {
  try {
    const tx = db
      .prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?")
      .get(req.params.id, req.user.id);
    if (!tx) return res.status(404).json({ message: "ไม่พบรายการ" });
    db.prepare("DELETE FROM transactions WHERE id = ?").run(tx.id);
    res.json({ message: "ลบรายการสำเร็จ" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบรายการ" });
  }
});

router.delete("/:id", (req, res) => {
  const tx = db
    .prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!tx) return res.status(404).json({ message: "ไม่พบรายการ" });
  db.prepare("DELETE FROM transactions WHERE id = ?").run(tx.id);
  res.json({ message: "ลบรายการสำเร็จ" });
});

export default router;
