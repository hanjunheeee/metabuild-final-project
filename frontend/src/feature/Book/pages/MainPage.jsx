import useBooks from '../hooks/useBooks'

function BookPage() {
  const { books, loading } = useBooks()

  if (loading) {
    return <div className="text-gray-600">로딩 중...</div>
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">도서 목록</h2>
      
      {books.length === 0 ? (
        <p className="text-gray-500">등록된 도서가 없습니다.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-3 px-4 text-gray-700">도서ID</th>
              <th className="text-left py-3 px-4 text-gray-700">ISBN</th>
              <th className="text-left py-3 px-4 text-gray-700">제목</th>
              <th className="text-left py-3 px-4 text-gray-700">저자</th>
              <th className="text-left py-3 px-4 text-gray-700">출판사</th>
              <th className="text-left py-3 px-4 text-gray-700">출판일</th>
              <th className="text-left py-3 px-4 text-gray-700">태그</th>
            </tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book.bookId} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-800">{book.bookId}</td>
                <td className="py-3 px-4 text-gray-800">{book.isbn}</td>
                <td className="py-3 px-4 text-gray-800">{book.title}</td>
                <td className="py-3 px-4 text-gray-800">{book.author}</td>
                <td className="py-3 px-4 text-gray-800">{book.publisher}</td>
                <td className="py-3 px-4 text-gray-800">{book.publishedDate}</td>
                <td className="py-3 px-4 text-gray-800">{book.tag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default BookPage
