import { useState, useEffect } from 'react'

/**
 * 도서 추가/수정 모달
 * @param {boolean} isOpen - 모달 표시 여부
 * @param {object} book - 수정할 도서 (null이면 추가 모드)
 * @param {function} onClose - 닫기 핸들러
 * @param {function} onSubmit - 저장 핸들러 (formData) => Promise
 */
function BookFormModal({ isOpen, book, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    publishedDate: '',
    summary: '',
    imageUrl: '',
    ages: ''
  })
  const [saving, setSaving] = useState(false)

  // 수정 모드일 때 폼 데이터 초기화
  useEffect(() => {
    if (book) {
      setFormData({
        isbn: book.isbn || '',
        title: book.title || '',
        author: book.author || '',
        publisher: book.publisher || '',
        publishedDate: book.publishedDate || '',
        summary: book.summary || '',
        imageUrl: book.imageUrl || '',
        ages: book.ages || ''
      })
    } else {
      setFormData({
        isbn: '',
        title: '',
        author: '',
        publisher: '',
        publishedDate: '',
        summary: '',
        imageUrl: '',
        ages: ''
      })
    }
  }, [book, isOpen])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('도서명은 필수입니다.')
      return
    }

    setSaving(true)
    try {
      await onSubmit(formData)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">
            {book ? '도서 수정' : '도서 추가'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                도서명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">저자</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">출판사</label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  placeholder="9788966260959"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">출판일</label>
                <input
                  type="date"
                  name="publishedDate"
                  value={formData.publishedDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연령 구분</label>
              <select
                name="ages"
                value={formData.ages}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
              >
                <option value="">선택 안함</option>
                <option value="아동">아동</option>
                <option value="청소년">청소년</option>
                <option value="성인">성인</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">요약</label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-main-bg text-white hover:bg-opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {saving ? '저장 중...' : (book ? '수정' : '추가')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BookFormModal

