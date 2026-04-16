import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import oauthRoutes from './routes/oauth.js'
import usersRoutes from './routes/users.js'
import postsRoutes from './routes/posts.js'
import { closeDb } from './db/connection.js'

dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') })

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())

// Routes
app.use('/api/oauth', oauthRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/posts', postsRoutes)

// Health check
app.get('/api/health', (_req, res) => {
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
  console.log(`API endpoints available at http://localhost:${PORT}/api`)
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
