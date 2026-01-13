import { useState, useEffect, useCallback, useMemo } from 'react'
import { Spinner } from '@/shared/components/icons'
import Pagination from '@/shared/components/navigation/Pagination'
import { 
  fetchKeywordTrends, 
  fetchBlockedKeywords, 
  blockKeyword, 
  unblockKeyword 
} from '../api/adminTrendApi'

const ITEMS_PER_PAGE = 15

function TrendManagePage() {
  const [trends, setTrends] = useState([])
  const [blockedKeywords, setBlockedKeywords] = useState([])
  const [loading, setLoading] = useState(true)
  const [newBlockKeyword, setNewBlockKeyword] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('trends') // 'trends' | 'blocked'
  const [trendPage, setTrendPage] = useState(1)
  const [blockedPage, setBlockedPage] = useState(1)

  // 데이터 로드
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [trendsData, blockedData] = await Promise.all([
        fetchKeywordTrends(),
        fetchBlockedKeywords()
      ])
      
      // 트렌드 데이터 변환 (API: text, value → keyword, count)
      setTrends(trendsData.map(t => ({
        keyword: t.text,
        count: t.value
      })))
      
      // 차단 키워드 데이터
      setBlockedKeywords(blockedData)
    } catch (error) {
      console.error('Failed to load data:', error)
      alert('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 키워드 차단
  const handleBlockKeyword = async (keyword) => {
    if (!confirm(`"${keyword}" 키워드를 차단하시겠습니까?\n차단된 키워드는 트렌드에 표시되지 않습니다.`)) return

    try {
      const result = await blockKeyword(keyword)
      
      if (result.success) {
        // 로컬 상태 업데이트
        setTrends(prev => prev.filter(t => t.keyword !== keyword))
        setBlockedKeywords(prev => [
          { keyword, blockedAt: new Date().toISOString().split('T')[0] },
          ...prev
        ])
        alert(`"${keyword}" 키워드가 차단되었습니다.`)
      } else {
        alert(result.message || '키워드 차단에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to block keyword:', error)
      alert('키워드 차단에 실패했습니다.')
    }
  }

  // 키워드 차단 해제
  const handleUnblockKeyword = async (keyword) => {
    if (!confirm(`"${keyword}" 키워드의 차단을 해제하시겠습니까?`)) return

    try {
      const result = await unblockKeyword(keyword)
      
      if (result.success) {
        setBlockedKeywords(prev => prev.filter(b => b.keyword !== keyword))
        // 트렌드 목록 새로고침
        const trendsData = await fetchKeywordTrends()
        setTrends(trendsData.map(t => ({
          keyword: t.text,
          count: t.value
        })))
        alert(`"${keyword}" 키워드 차단이 해제되었습니다.`)
      } else {
        alert(result.message || '차단 해제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to unblock keyword:', error)
      alert('차단 해제에 실패했습니다.')
    }
  }

  // 새 키워드 차단 추가
  const handleAddBlockKeyword = async () => {
    const keyword = newBlockKeyword.trim()
    if (!keyword) {
      alert('차단할 키워드를 입력해주세요.')
      return
    }

    if (blockedKeywords.some(b => b.keyword === keyword)) {
      alert('이미 차단된 키워드입니다.')
      return
    }

    try {
      const result = await blockKeyword(keyword)
      
      if (result.success) {
        setBlockedKeywords(prev => [
          { keyword, blockedAt: new Date().toISOString().split('T')[0] },
          ...prev
        ])
        setTrends(prev => prev.filter(t => t.keyword !== keyword))
        setNewBlockKeyword('')
        alert(`"${keyword}" 키워드가 차단 목록에 추가되었습니다.`)
      } else {
        alert(result.message || '키워드 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to add blocked keyword:', error)
      alert('키워드 추가에 실패했습니다.')
    }
  }

  // 필터링된 트렌드
  const filteredTrends = useMemo(() => 
    trends.filter(t => 
      t.keyword && t.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    ), [trends, searchTerm])

  // 필터링된 차단 목록
  const filteredBlocked = useMemo(() => 
    blockedKeywords.filter(b =>
      b.keyword && b.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    ), [blockedKeywords, searchTerm])

  // 페이징 계산
  const trendTotalPages = Math.ceil(filteredTrends.length / ITEMS_PER_PAGE)
  const blockedTotalPages = Math.ceil(filteredBlocked.length / ITEMS_PER_PAGE)

  // 현재 페이지 데이터
  const paginatedTrends = useMemo(() => {
    const start = (trendPage - 1) * ITEMS_PER_PAGE
    return filteredTrends.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredTrends, trendPage])

  const paginatedBlocked = useMemo(() => {
    const start = (blockedPage - 1) * ITEMS_PER_PAGE
    return filteredBlocked.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredBlocked, blockedPage])

  // 검색어 변경 시 페이지 초기화
  useEffect(() => {
    setTrendPage(1)
    setBlockedPage(1)
  }, [searchTerm])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Spinner className="w-10 h-10 text-main-bg" />
        <p className="text-gray-400 text-sm ml-3">데이터를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">검색어 트렌드 관리</h2>

      {/* 탭 메뉴 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-6 py-3 text-sm font-medium transition-colors relative
            ${activeTab === 'trends' 
              ? 'text-main-bg' 
              : 'text-gray-500 hover:text-gray-700 cursor-pointer' 
            }`}
        >
          현재 트렌드
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
            {trends.length}
          </span>
          {activeTab === 'trends' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-main-bg" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`px-6 py-3 text-sm font-medium transition-colors relative
            ${activeTab === 'blocked' 
              ? 'text-main-bg' 
              : 'text-gray-500 hover:text-gray-700 cursor-pointer'
            }`}
        >
          차단된 키워드
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
            {blockedKeywords.length}
          </span>
          {activeTab === 'blocked' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-main-bg" />
          )}
        </button>
      </div>

      {/* 검색 및 추가 영역 */}
      <div className="flex gap-4 mb-6">
        {/* 검색창 */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="키워드 검색..."
            className="w-full px-4 py-2.5 pl-10 border border-gray-300 text-sm focus:outline-none focus:border-main-bg"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* 차단 키워드 추가 (차단 탭에서만) */}
        {activeTab === 'blocked' && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newBlockKeyword}
              onChange={(e) => setNewBlockKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBlockKeyword()}
              placeholder="차단할 키워드 입력"
              className="w-48 px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-main-bg"
            />
            <button
              onClick={handleAddBlockKeyword}
              className="px-4 py-2.5 bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
            >
              + 차단 추가
            </button>
          </div>
        )}
      </div>

      {/* 트렌드 목록 */}
      {activeTab === 'trends' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">순위</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">키워드</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">검색 횟수</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTrends.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    {searchTerm ? '검색 결과가 없습니다.' : '트렌드 데이터가 없습니다.'}
                  </td>
                </tr>
              ) : (
                paginatedTrends.map((trend, index) => {
                  const globalIndex = (trendPage - 1) * ITEMS_PER_PAGE + index
                  return (
                    <tr key={trend.keyword} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                          ${globalIndex < 3 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {globalIndex + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-800">{trend.keyword}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-600">{trend.count}회</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleBlockKeyword(trend.keyword)}
                          className="px-3 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                        >
                          차단
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          {/* 트렌드 페이징 */}
          <div className="mb-6">
            <Pagination
              currentPage={trendPage}
              totalPages={trendTotalPages}
              onPageChange={setTrendPage}
            />
          </div>
        </div>
      )}

      {/* 차단된 키워드 목록 */}
      {activeTab === 'blocked' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">키워드</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">차단일</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedBlocked.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                    {searchTerm ? '검색 결과가 없습니다.' : '차단된 키워드가 없습니다.'}
                  </td>
                </tr>
              ) : (
                paginatedBlocked.map((blocked) => (
                  <tr key={blocked.keyword} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-800">{blocked.keyword}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-500">{blocked.blockedAt || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleUnblockKeyword(blocked.keyword)}
                        className="px-3 py-1 text-xs text-green-600 border border-green-300 rounded hover:bg-green-50 transition-colors"
                      >
                        차단 해제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* 차단 목록 페이징 */}
          <div className="mb-6">
            <Pagination
              currentPage={blockedPage}
              totalPages={blockedTotalPages}
              onPageChange={setBlockedPage}
            />
          </div>
        </div>
      )}

      {/* 안내 문구 */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex gap-2">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">검색어 트렌드 관리 안내</p>
            <ul className="list-disc list-inside text-amber-700 space-y-1">
              <li>차단된 키워드는 메인 페이지의 검색어 트렌드에 표시되지 않습니다.</li>
              <li>기본 비속어 필터(blocked-keywords.sha256)는 자동으로 적용됩니다.</li>
              <li>추가로 차단이 필요한 키워드는 수동으로 등록해주세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrendManagePage
