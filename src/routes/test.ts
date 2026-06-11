import { Router } from 'express'
import { getHello, getError, getBadReq, getUnauthorized, getForbidden, getNotFound, createTest} from '../controllers/TestController.js'
// import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/hello', getHello)
router.get('/error', getError)
router.get('/bad-request', getBadReq)
router.get('/unauthorized', getUnauthorized)
router.get('/forbidden', getForbidden)
router.get('/not-found', getNotFound)
router.get('/transactions', createTest)

export default {
  prefix: 'v1/test',
  router
}

