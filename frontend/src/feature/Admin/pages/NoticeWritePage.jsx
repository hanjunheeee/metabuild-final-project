import { useState } from 'react'

function NoticeWritePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: 실제 공지 작성 API 연동
    alert('공지 작성 기능은 추후 구현 예정입니다.')
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">공지 작성</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            공지 제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="공지 제목을 입력하세요"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg"
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            공지 내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="공지 내용을 입력하세요"
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-main-bg resize-none"
          />
        </div>

        {/* 옵션 */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" className="w-4 h-4 text-main-bg rounded" />
            상단 고정
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" className="w-4 h-4 text-main-bg rounded" />
            즉시 발행
          </label>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            className="px-6 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-sm text-white bg-main-bg rounded hover:bg-opacity-90 transition-colors"
          >
            공지 등록
          </button>
        </div>
      </form>

      {/* 기존 공지 목록 */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">기존 공지 목록</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm text-gray-700">커뮤니티 이용 안내</span>
            <span className="text-xs text-gray-400">2026-01-08</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm text-gray-700">1월 이벤트 - 독서 챌린지 안내</span>
            <span className="text-xs text-gray-400">2026-01-07</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm text-gray-700">시스템 점검 안내 (1/10)</span>
            <span className="text-xs text-gray-400">2026-01-06</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoticeWritePage

