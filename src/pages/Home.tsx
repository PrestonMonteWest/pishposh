import { useAuth } from '../contexts/AuthContext';

export function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-pink-500">PishPosh</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">@{user?.username}</span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-xl text-gray-400 mb-4">
              Welcome, {user?.displayName}!
            </p>
            <p className="text-gray-500">
              Your feed will appear here once you start following creators.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
