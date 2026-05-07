import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AuthProvider from './components/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import CreatePost from './pages/CreatePost'
import Home from './pages/Home'
import PostDetail from './pages/PostDetail'
import Signin from './pages/Signin'
import Signup from './pages/Signup'
import VerifyEmail from './pages/VerifyEmail'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Signin />} />
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
