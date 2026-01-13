import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-gray-50 px-8 py-4 border-t border-main-bg">
      <div className="max-w-6xl mx-auto flex justify-between">
        {/* 왼쪽: 회사 정보 */}
        <div className="text-left flex flex-col justify-center">
          <p className="text-sm text-gray-600 font-medium">MetaBuild</p>
          <p className="text-xs text-gray-500">
            서울특별시 서초구 서초중앙로 64 (메타빌드 제2사옥 4층)
          </p>
        </div>

        {/* 오른쪽: 링크 + 참여 인원 + 저작권 */}
        <div className="text-right">
          <div className="flex justify-end gap-4 mb-2">
            <Link to="/about" className="text-sm text-gray-600 hover:text-main-bg">
              사이트 소개
            </Link>
          </div>
          <p className="text-xs text-gray-500">참여 인원: 한준희·정연종·김주성</p>
          <p className="text-xs text-gray-400">&copy; 2025 MetaBuild. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
