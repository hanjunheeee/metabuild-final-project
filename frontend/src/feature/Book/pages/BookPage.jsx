import useBooks from '../hooks/useBooks'

function BookPage() {
  const { books, loading } = useBooks()

  if (loading) {
    return <div className="text-white">로딩 중...</div>
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-cyan-400">도서 목록</h2>
      
      {books.length === 0 ? (
        <p className="text-white/70">등록된 도서가 없습니다.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-cyan-500/30">
              <th className="text-left py-3 px-4 text-cyan-300">도서ID</th>
              <th className="text-left py-3 px-4 text-cyan-300">ISBN</th>
              <th className="text-left py-3 px-4 text-cyan-300">제목</th>
              <th className="text-left py-3 px-4 text-cyan-300">저자</th>
              <th className="text-left py-3 px-4 text-cyan-300">출판사</th>
              <th className="text-left py-3 px-4 text-cyan-300">출판일</th>
              <th className="text-left py-3 px-4 text-cyan-300">태그</th>
            </tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book.bookId} className="border-b border-white/10 hover:bg-white/5">
                <td className="py-3 px-4 text-white/80">{book.bookId}</td>
                <td className="py-3 px-4 text-white/80">{book.isbn}</td>
                <td className="py-3 px-4 text-white/80">{book.title}</td>
                <td className="py-3 px-4 text-white/80">{book.author}</td>
                <td className="py-3 px-4 text-white/80">{book.publisher}</td>
                <td className="py-3 px-4 text-white/80">{book.publishedDate}</td>
                <td className="py-3 px-4 text-white/80">{book.tag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default BookPage
