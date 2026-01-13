import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchUsers, updateUserStatus } from '../api/adminUserApi'
import Pagination from '@/shared/components/navigation/Pagination'

const ITEMS_PER_PAGE = 10

function UserManagePage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  // 필터 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // 회원 목록 조회
  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load users:', e)
      alert('회원 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // 필터링
  const filteredUsers = useMemo(() => {
    let result = [...users]

    // 검색어 필터
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(user => 
        (user.email || '').toLowerCase().includes(term) ||
        (user.nickname || '').toLowerCase().includes(term)
      )
    }

    // 상태 필터
    if (statusFilter) {
      result = result.filter(user => user.isActive === statusFilter)
    }

    // 역할 필터
    if (roleFilter) {
      result = result.filter(user => user.role === roleFilter)
    }

    return result
  }, [users, searchTerm, statusFilter, roleFilter])

  // 페이지네이션
  const totalPages = useMemo(() => Math.ceil(filteredUsers.length / ITEMS_PER_PAGE), [filteredUsers.length])
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredUsers, currentPage])

  // 핸들러
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value)
    setCurrentPage(1)
  }

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value)
    setCurrentPage(1)
  }

  // 날짜 포맷
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR')
  }

  // 상태 변경 핸들러
  const handleToggleStatus = async (user) => {
    const newStatus = user.isActive === 'Y' ? 'N' : 'Y'
    const action = newStatus === 'Y' ? '활성화' : '비활성화'
    
    if (!confirm(`"${user.nickname || user.email}" 회원을 ${action}하시겠습니까?`)) {
      return
    }

    try {
      const result = await updateUserStatus(user.userId, newStatus)
      if (result.success) {
        alert(result.message)
        loadUsers()
      } else {
        alert(result.message || '상태 변경에 실패했습니다.')
      }
    } catch (e) {
      console.error('Failed to update user status:', e)
      alert('상태 변경에 실패했습니다.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">회원 관리</h2>
        <div className="text-sm text-gray-500">
          총 <span className="font-bold text-main-bg">{filteredUsers.length}</span>명
        </div>
      </div>

      {/* 검색/필터 */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="이메일, 닉네임 검색...(최대 30자)"
          maxLength={30}
          className="flex-1 md:flex-initial md:w-[32rem] px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
        />
        <select 
          value={statusFilter}
          onChange={handleStatusChange}
          className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
        >
          <option value="">전체 상태</option>
          <option value="Y">활성</option>
          <option value="N">비활성</option>
        </select>
        <select 
          value={roleFilter}
          onChange={handleRoleChange}
          className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
        >
          <option value="">전체 역할</option>
          <option value="USER">일반 회원</option>
          <option value="ADMIN">관리자</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-10 text-center text-gray-500">로딩 중...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            {users.length === 0 ? '등록된 회원이 없습니다.' : '검색 결과가 없습니다.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-4 py-3 text-center font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">이메일</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">닉네임</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">역할</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">가입일</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">상태</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUsers.map((user) => (
                <tr 
                  key={user.userId} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/admin/users/${user.userId}`)}
                >
                  <td className="px-4 py-3 text-gray-500 text-center">{user.userId}</td>
                  <td className="px-4 py-3 text-gray-800">{user.email}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 hover:text-main-bg">{user.nickname || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs rounded ${
                      user.role === 'ADMIN' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.role === 'ADMIN' ? '관리자' : '일반'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-center whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs rounded ${
                      user.isActive === 'Y' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.isActive === 'Y' ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {/* 관리자 본인은 상태 변경 불가 */}
                    {user.role !== 'ADMIN' && (
                      user.isActive === 'Y' ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}
                          className="text-orange-600 hover:underline cursor-pointer"
                        >
                          정지
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}
                          className="text-green-600 hover:underline cursor-pointer"
                        >
                          해제
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {!loading && filteredUsers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

export default UserManagePage
