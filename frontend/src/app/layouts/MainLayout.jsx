import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-8 py-8 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
