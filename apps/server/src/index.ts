import { closeDb } from '@/db/connection.js'
import authRoutes from '@/routes/auth.js'
import postsRoutes from '@/routes/posts.js'
import usersRoutes from '@/routes/users.js'
import cors from 'cors'
import express from 'express'

const NODE_ENV = process.env.NODE_ENV ?? 'development'
if (NODE_ENV === 'development') {
  const dotenv = await import('dotenv')
  dotenv.config()
}

const app = express()
const PORT = Number(process.env.PORT ?? 3001)
if (Number.isNaN(PORT)) {
  throw new Error('PORT is NaN')
}
const API_BASE_URL = process.env.API_BASE_URL ?? '/api'

// Middleware
app.use(
  cors({
    origin: process.env.APP_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())

// Routes
app.use(`${API_BASE_URL}/auth`, authRoutes)
app.use(`${API_BASE_URL}/users`, usersRoutes)
app.use(`${API_BASE_URL}/posts`, postsRoutes)

// Health check
app.get(`${API_BASE_URL}/health`, (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('Unhandled error:', err)
    res.status(500).json({
      message: 'Internal server error',
      code: 'SERVER_ERROR',
    })
  },
)

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(
    `API endpoints available at http://localhost:${PORT}${API_BASE_URL}`,
  )
})

async function shutdown() {
  console.log('\nShutting down gracefully...')
  server.close(() => {
    console.log('HTTP server closed')
  })
  await closeDb()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
