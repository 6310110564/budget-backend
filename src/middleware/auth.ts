import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

type AuthRequest = Request & {
  user?: {
    id: number
    email: string
    name: string
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const token = auth.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: number
      email: string
      name: string
    }
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
