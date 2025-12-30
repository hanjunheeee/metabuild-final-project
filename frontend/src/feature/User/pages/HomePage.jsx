import { useState, useEffect } from 'react'

function HomePage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:7878/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="text-white">로딩 중...</div>
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-cyan-400">사용자 목록</h2>
      
      {users.length === 0 ? (
        <p className="text-white/70">등록된 사용자가 없습니다.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-cyan-500/30">
              <th className="text-left py-3 px-4 text-cyan-300">ID</th>
              <th className="text-left py-3 px-4 text-cyan-300">이름</th>
              <th className="text-left py-3 px-4 text-cyan-300">이메일</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="py-3 px-4 text-white/80">{user.id}</td>
                <td className="py-3 px-4 text-white/80">{user.name}</td>
                <td className="py-3 px-4 text-white/80">{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default HomePage
