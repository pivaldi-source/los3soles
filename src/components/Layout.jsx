import { Outlet, useLocation, useNavigate } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {!isHome && (
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-900 p-1 -ml-1"
              aria-label="Volver"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xl">☀️</span>
            <h1 className="text-lg font-bold text-gray-900 leading-none">Los 3 Soles</h1>
            <span className="text-xs text-gray-400 font-normal">Mundial 2026</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
