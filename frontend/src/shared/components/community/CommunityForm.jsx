import { useState, useRef, useEffect } from 'react'
import useBookSearch from '@/feature/Community/hooks/useBookSearch'
import useRichTextEditor from '@/feature/Community/hooks/useRichTextEditor'

// 게시판 종류 옵션
const COMMUNITY_KINDS = [
  { value: 'FREE', label: '자유', color: 'gray' },
  { value: 'QUESTION', label: '질문', color: 'purple' },
  { value: 'REVIEW', label: '리뷰', color: 'green' },
]

/**
 * 커뮤니티 글 작성/수정 폼 공통 컴포넌트
 * 
 * @param {string} mode - 'create' | 'edit'
 * @param {Object} initialData - 수정 시 초기 데이터 { title, content, communityKind, book }
 * @param {Function} onSubmit - 제출 핸들러 (formData) => void
 * @param {Function} onCancel - 취소 핸들러
 * @param {boolean} isSubmitting - 제출 중 여부
 */
function CommunityForm({ 
  mode = 'create', 
  initialData = null, 
  onSubmit, 
  onCancel,
  isSubmitting = false 
}) {
  const [title, setTitle] = useState('')
  const [communityKind, setCommunityKind] = useState('FREE')

  // 책 검색/선택 훅 사용
  const {
    selectedBook,
    bookSearchTerm,
    showDropdown,
    filteredBooks,
    searchRef,
    handleSearchChange,
    handleFocus,
    handleBookSelect,
    handleBookRemove,
    setSelectedBook,
  } = useBookSearch()

  // 리치 텍스트 에디터 훅 사용
  const {
    editorRef,
    activeFormats,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrikeThrough,
    alignLeft,
    alignCenter,
    alignRight,
    insertQuote,
    insertHorizontalRule,
    handleImageFileChange,
    handleKeyDown,
    handlePaste,
    getContent,
    getTextContent,
    setContent,
  } = useRichTextEditor()

  // 이미지 파일 input ref
  const imageInputRef = useRef(null)

  // 초기 데이터 설정 (수정 모드)
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.title || '')
      setCommunityKind(initialData.communityKind || 'FREE')
      if (initialData.book) {
        setSelectedBook(initialData.book)
      }
      if (initialData.content) {
        // 에디터가 마운트된 후 콘텐츠 설정
        setTimeout(() => {
          setContent(initialData.content)
        }, 0)
      }
    }
  }, [mode, initialData, setSelectedBook, setContent])

  // 이미지 업로드 버튼 클릭
  const handleImageButtonClick = () => {
    imageInputRef.current?.click()
  }

  // 툴바 버튼 스타일
  const getButtonClass = (isActive) => {
    return `p-2 transition-colors ${
      isActive 
        ? 'bg-main-bg text-white' 
        : 'hover:bg-gray-200 text-gray-600'
    }`
  }

  // 폼 제출
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }
    
    const content = getTextContent()
    if (!content.trim()) {
      alert('내용을 입력해주세요.')
      return
    }

    const htmlContent = getContent()

    onSubmit({
      title,
      content: htmlContent,
      bookId: selectedBook?.bookId || null,
      communityKind
    })
  }

  // 취소
  const handleCancel = () => {
    const content = getTextContent()
    if (title || content) {
      if (window.confirm('작성 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
        onCancel()
      }
    } else {
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-main-bg p-6 shadow-sm">
      {/* 게시판 종류 선택 */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          게시판 종류 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {COMMUNITY_KINDS.map((kind) => (
            <button
              key={kind.value}
              type="button"
              onClick={() => setCommunityKind(kind.value)}
              className={`flex-1 py-2.5 px-4 text-sm font-medium border transition-colors
                        ${communityKind === kind.value
                          ? kind.color === 'purple'
                            ? 'bg-purple-500 text-white border-purple-500'
                            : kind.color === 'green'
                              ? 'bg-green-500 text-white border-green-500'
                              : 'bg-gray-500 text-white border-gray-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
            >
              {kind.label}
            </button>
          ))}
        </div>
      </div>

      {/* 책 선택 */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          책 선택 
        </label>
        
        {selectedBook ? (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100">
            <div>
              <span className="font-medium text-gray-800">{selectedBook.title}</span>
              <span className="text-gray-400 text-sm ml-2">| {selectedBook.author}</span>
            </div>
            <button
              type="button"
              onClick={handleBookRemove}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="책 제목 또는 저자로 검색..."
                value={bookSearchTerm}
                onChange={handleSearchChange}
                onFocus={handleFocus}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 
                         focus:outline-none focus:ring-2 focus:ring-main-bg focus:border-transparent
                         text-gray-700 placeholder-gray-400"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* 검색 결과 드롭다운 */}
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-lg">
                <div className="max-h-48 overflow-y-auto">
                  {filteredBooks.length === 0 ? (
                    <div className="p-3 text-gray-400 text-sm text-center">
                      "{bookSearchTerm}"에 대한 검색 결과가 없습니다
                    </div>
                  ) : (
                    filteredBooks.map((book) => (
                      <button
                        key={book.bookId}
                        type="button"
                        onClick={() => handleBookSelect(book)}
                        className="w-full p-3 text-left hover:bg-gray-50 transition-colors
                                 border-b border-gray-50 last:border-b-0"
                      >
                        <span className="font-medium text-gray-800">{book.title}</span>
                        <span className="text-gray-400 text-sm ml-2">| {book.author}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 제목 */}
      <div className="mb-5">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력해주세요"
          maxLength={100}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 
                   focus:outline-none focus:ring-2 focus:ring-main-bg focus:border-transparent
                   text-gray-700 placeholder-gray-400"
        />
        <p className="mt-1 text-xs text-gray-400 text-right">{title.length}/100</p>
      </div>

      {/* 내용 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          내용 <span className="text-red-500">*</span>
        </label>

        {/* 에디터 툴바 */}
        <div className="flex items-center gap-1 p-2 bg-gray-100 border border-gray-200 border-b-0">
          {/* 텍스트 스타일 */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300">
            <button
              type="button"
              className={getButtonClass(activeFormats.bold)}
              title="굵게 (Ctrl+B)"
              onClick={toggleBold}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
            </button>
            <button
              type="button"
              className={getButtonClass(activeFormats.italic)}
              title="기울임 (Ctrl+I)"
              onClick={toggleItalic}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="19" y1="4" x2="10" y2="4" />
                <line x1="14" y1="20" x2="5" y2="20" />
                <line x1="15" y1="4" x2="9" y2="20" />
              </svg>
            </button>
            <button
              type="button"
              className={getButtonClass(activeFormats.underline)}
              title="밑줄 (Ctrl+U)"
              onClick={toggleUnderline}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3" />
                <line x1="4" y1="21" x2="20" y2="21" />
              </svg>
            </button>
            <button
              type="button"
              className={getButtonClass(activeFormats.strikeThrough)}
              title="취소선"
              onClick={toggleStrikeThrough}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="4" y1="12" x2="20" y2="12" />
                <path d="M17.5 7.5c-1.5-1.5-3.5-2-5.5-2s-4 .5-5.5 2c-1 1-1.5 2-1.5 3.5 0 1.5.5 2.5 1.5 3.5 1.5 1.5 3.5 2 5.5 2s4-.5 5.5-2" />
              </svg>
            </button>
          </div>

          {/* 문단 정렬 */}
          <div className="flex items-center gap-0.5 px-2 border-r border-gray-300">
            <button
              type="button"
              className={getButtonClass(activeFormats.justifyLeft)}
              title="왼쪽 정렬"
              onClick={alignLeft}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="15" y2="12" />
                <line x1="3" y1="18" x2="18" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              className={getButtonClass(activeFormats.justifyCenter)}
              title="가운데 정렬"
              onClick={alignCenter}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              className={getButtonClass(activeFormats.justifyRight)}
              title="오른쪽 정렬"
              onClick={alignRight}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="9" y1="12" x2="21" y2="12" />
                <line x1="6" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          {/* 블록 요소 */}
          <div className="flex items-center gap-0.5 px-2 border-r border-gray-300">
            <button
              type="button"
              className="p-2 hover:bg-gray-200 transition-colors text-gray-600"
              title="인용구"
              onClick={insertQuote}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
              </svg>
            </button>
            <button
              type="button"
              className="p-2 hover:bg-gray-200 transition-colors text-gray-600"
              title="구분선"
              onClick={insertHorizontalRule}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="3" y1="12" x2="21" y2="12" />
              </svg>
            </button>
          </div>

          {/* 이미지 */}
          <div className="flex items-center gap-0.5 pl-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />
            <button
              type="button"
              className="p-2 hover:bg-gray-200 transition-colors text-gray-600"
              title="이미지 업로드"
              onClick={handleImageButtonClick}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
          </div>
        </div>

        {/* 에디터 본문 */}
        <div
          ref={editorRef}
          contentEditable
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="w-full min-h-[300px] px-4 py-3 bg-white border border-gray-200 border-t-0
                   focus:outline-none focus:ring-2 focus:ring-main-bg
                   text-gray-700 overflow-auto
                   [&_b]:font-black [&_strong]:font-black
                   [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:text-gray-600
                   [&_hr]:my-4 [&_hr]:border-gray-300
                   [&_a]:text-main-bg [&_a]:underline
                   [&_img]:max-w-[400px] [&_img]:max-h-[300px] [&_img]:h-auto [&_img]:my-2 [&_img]:object-contain"
          data-placeholder="책에 대한 생각, 감상, 추천 이유 등을 자유롭게 작성해주세요."
          suppressContentEditableWarning
        />
        <style>{`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `}</style>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="flex-1 py-3 bg-gray-100 text-gray-600 font-medium
                   hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 bg-main-bg text-white font-medium
                   hover:bg-sub-bg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? '처리 중...' : mode === 'edit' ? '수정하기' : '등록하기'}
        </button>
      </div>
    </form>
  )
}

export default CommunityForm

