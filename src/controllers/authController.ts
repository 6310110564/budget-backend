import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { TransactionType } from '@prisma/client';
import { defaultIncomes, defaultExpenses } from '../config/constant.js';

type AuthRequest = Request & {
  user?: {
    id: number;
    email: string;
    name: string;
  };
};

type UserPayload = {
  name: string;
  email: string;
  password: string;
};

function createToken(user: { id: number; email: string; name: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'secret',
    {
      expiresIn: '7d',
    }
  );
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body as UserPayload;

    if (!name || !email || !password) {
      return res.badRequest('กรุณากรอกชื่อ อีเมล และรหัสผ่าน');
    }
    if (password.length < 6) {
      return res.badRequest('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.badRequest('อีเมลนี้ถูกใช้แล้ว');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
      },
    });

    const categories = [
      ...defaultIncomes.map((item) => ({
        userId: user.id,
        name: item.name,
        type: TransactionType.income,
        icon: item.icon,
      })),
      ...defaultExpenses.map((item) => ({
        userId: user.id,
        name: item.name,
        type: TransactionType.expense,
        icon: item.icon,
      })),
    ];

    await prisma.category.createMany({ data: categories } as any);

    return res.created({
      token: createToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.error({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.badRequest('กรุณากรอกอีเมลและรหัสผ่าน');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.unauthorized('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.unauthorized('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    return res.ok({
      token: createToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.error({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id ?? 0 },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) {
      return res.notFound('ไม่พบผู้ใช้');
    }

    return res.ok(user);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.error({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
  }
}
