import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-4 border-b border-cyan-500/20">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="no-underline">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
            MetaBuild
          </h1>
        </Link>
        <nav>
          <ul className="flex list-none gap-8">
            <li>
              <Link to="/" className="text-white/80 font-medium px-4 py-2 rounded hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                홈
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
