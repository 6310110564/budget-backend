import { Router } from 'express'
import { getHello } from '../controllers/TestController.js'
// import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/hello', getHello)

export default {
  prefix: 'v1/test',
  router
}

