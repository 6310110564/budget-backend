import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import transactionRoutes from './routes/transactions.js'
import categoryRoutes from './routes/categories.js'
import testRoutes from './routes/test.js'

const app = express()
const allowedOrigins = ['http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true
  })
)
app.use(express.json())

app.get('/health', (_, res) => res.json({ status: 'ok' }))

type RouteModule = { prefix: string; router: express.Router }

const mountRoute = (routeModule: RouteModule) => {
  app.use(`/api/${routeModule.prefix}`, routeModule.router)
}

mountRoute(authRoutes)
mountRoute(transactionRoutes)
mountRoute(categoryRoutes)
mountRoute(testRoutes)

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal server error' })
})

export default app
