import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { CreatePost } from './pages/CreatePost'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { PostDetail } from './pages/PostDetail'
import { Signup } from './pages/Signup'
import { VerifyEmail } from './pages/VerifyEmail'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route
            path="/create"
            element={
              <ProtectedRoute emailVerificationRequired={true}>
                <CreatePost />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Home />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
