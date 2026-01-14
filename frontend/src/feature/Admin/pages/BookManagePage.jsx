import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchBooks, createBook, updateBook, deleteBook } from '../api/adminBookApi'
import Pagination from '@/shared/components/navigation/Pagination'
import BookFormModal from '../components/BookFormModal'
import BookSearchFilter from '../components/BookSearchFilter'

const ITEMS_PER_PAGE = 10

function BookManagePage() {
  // 상태
  const [allBooks, setAllBooks] = useState([])  // 전체 도서 (API에서 가져온)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [agesFilter, setAgesFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  // 모달 상태
  const [showModal, setShowModal] = useState(false)
  const [editingBook, setEditingBook] = useState(null)

  // 도서 목록 조회 (2글자 이상일 때만)
  const loadBooks = useCallback(async () => {
    if (searchQuery.length < 2) {
      setAllBooks([])
      return
    }
    setLoading(true)
    try {
      const data = await fetchBooks(searchQuery)
      setAllBooks(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load books:', e)
      alert('도서 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  // 필터링된 도서 목록
  const filteredBooks = useMemo(() => {
    if (!agesFilter) return allBooks
    return allBooks.filter(book => book.ages === agesFilter)
  }, [allBooks, agesFilter])

  // 페이지네이션 계산
  const totalPages = useMemo(() => {
    return Math.ceil(filteredBooks.length / ITEMS_PER_PAGE)
  }, [filteredBooks.length])

  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredBooks.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredBooks, currentPage])

  // 검색/필터 핸들러
  const handleSearch = ({ query, ages }) => {
    setSearchQuery(query)
    setAgesFilter(ages)
    setCurrentPage(1)
  }

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // 모달 열기 (추가)
  const openAddModal = () => {
    setEditingBook(null)
    setShowModal(true)
  }

  // 모달 열기 (수정)
  const openEditModal = (book) => {
    setEditingBook(book)
    setShowModal(true)
  }

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false)
    setEditingBook(null)
  }

  // 저장 (추가/수정)
  const handleModalSubmit = async (formData) => {
    try {
      if (editingBook) {
        await updateBook(editingBook.bookId, formData)
        alert('도서가 수정되었습니다.')
      } else {
        await createBook(formData)
        alert('도서가 추가되었습니다.')
      }
      closeModal()
      loadBooks()
    } catch (e) {
      console.error('Failed to save book:', e)
      alert('저장에 실패했습니다.')
    }
  }

  // 삭제
  const handleDelete = async (book) => {
    if (!confirm(`"${book.title}" 도서를 삭제하시겠습니까?`)) {
      return
    }
    try {
      await deleteBook(book.bookId)
      alert('도서가 삭제되었습니다.')
      loadBooks()
    } catch (e) {
      console.error('Failed to delete book:', e)
      alert('삭제에 실패했습니다. 연관된 데이터가 있을 수 있습니다.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">도서 관리</h2>
        <button 
          onClick={openAddModal}
          className="px-4 py-2 bg-main-bg text-white text-sm hover:bg-opacity-90 transition-colors cursor-pointer"
        >
          도서 추가
        </button>
      </div>

      {/* 검색/필터 */}
      <BookSearchFilter onSearch={handleSearch} />

      {/* 통계 */}
      <div className="mb-4 text-sm text-gray-600">
        {searchQuery.length >= 2 ? (
          <>
            총 {filteredBooks.length}권의 도서
            {agesFilter && <span className="ml-2 text-main-bg">({agesFilter} 필터 적용)</span>}
          </>
        ) : (
          <span className="text-gray-400">도서명, 저자, ISBN으로 검색해주세요 (2글자 이상)</span>
        )}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-10 text-center text-gray-500">로딩 중...</div>
        ) : searchQuery.length < 2 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-gray-500 mb-2">도서를 검색해주세요</p>
            <p className="text-sm text-gray-400">2글자 이상 입력하면 검색 결과가 표시됩니다</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            검색 결과가 없습니다.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-4 py-3 text-center font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">도서명</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">저자</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">출판사</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">ISBN</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">연령</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedBooks.map((book) => (
                <tr key={book.bookId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{book.bookId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      {book.imageUrl && (
                        <img 
                          src={book.imageUrl} 
                          alt={book.title} 
                          className="w-8 h-10 object-cover rounded"
                        />
                      )}
                      <span className="line-clamp-1">{book.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{book.author}</td>
                  <td className="px-4 py-3 text-gray-600">{book.publisher}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{book.isbn}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {book.ages && (
                      <span className={`px-2 py-1 text-xs rounded ${
                        book.ages === '아동' 
                          ? 'bg-green-100 text-green-700' 
                          : book.ages === '청소년'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {book.ages}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button 
                      onClick={() => openEditModal(book)}
                      className="text-blue-600 hover:underline mr-3 cursor-pointer"
                    >
                      수정
                    </button>
                    <button 
                      onClick={() => handleDelete(book)}
                      className="text-red-600 hover:underline cursor-pointer"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {!loading && filteredBooks.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* 추가/수정 모달 */}
      <BookFormModal
        isOpen={showModal}
        book={editingBook}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
      />
    </div>
  )
}

export default BookManagePage
