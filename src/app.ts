import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import transactionRoutes from './routes/transactions.js'
import categoryRoutes from './routes/categories.js'

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

type RouteModule = express.Router | { prefix: string; router: express.Router }

const mountRoute = (defaultPath: string, routeModule: RouteModule) => {
  const targetPath = 'prefix' in routeModule ? `/${routeModule.prefix}` : defaultPath
  const router = 'prefix' in routeModule ? routeModule.router : routeModule
  app.use(targetPath, router)
}

mountRoute('/api/auth', authRoutes)
mountRoute('/api/transactions', transactionRoutes)
mountRoute('/api/categories', categoryRoutes)

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal server error' })
})

export default app
