function BookManagePage() {
  // 더미 도서 데이터
  const books = [
    { id: 1, title: '클린 코드', author: '로버트 마틴', isbn: '9788966260959', status: '활성' },
    { id: 2, title: '리팩터링', author: '마틴 파울러', isbn: '9791162242742', status: '활성' },
    { id: 3, title: '이펙티브 자바', author: '조슈아 블로크', isbn: '9788966262281', status: '비활성' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">도서 관리</h2>
        <button className="px-4 py-2 bg-main-bg text-white text-sm rounded hover:bg-opacity-90 transition-colors">
          도서 추가
        </button>
      </div>

      {/* 검색 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="도서명, 저자, ISBN 검색..."
          className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
        />
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-y border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">도서명</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">저자</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ISBN</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">상태</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {books.map((book) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{book.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{book.title}</td>
                <td className="px-4 py-3 text-gray-600">{book.author}</td>
                <td className="px-4 py-3 text-gray-500">{book.isbn}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    book.status === '활성' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {book.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-blue-600 hover:underline mr-3">수정</button>
                  <button className="text-red-600 hover:underline">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default BookManagePage

