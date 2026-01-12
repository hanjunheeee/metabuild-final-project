import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CommunityForm } from '@/shared/components'
import { createCommunity, processImagesInContent } from '@/feature/Community/api/communityApi'
import { getUserFromSession } from '@/shared/api/authApi'

function NoticeWritePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentUser = getUserFromSession()

  // 콘텐츠에서 첫 번째 이미지 URL 추출
  const extractFirstImage = (content) => {
    const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/
    const match = content.match(imgPattern)
    return match ? match[1] : null
  }

  // 공지 등록
  const handleSubmit = async (formData) => {
    setIsSubmitting(true)
    
    try {
      // 1. 콘텐츠 내 Base64 이미지를 서버에 업로드하고 URL로 교체
      const processedContent = await processImagesInContent(formData.content)
      
      // 2. 첫 번째 이미지를 썸네일로 자동 추출
      const thumbnailUrl = extractFirstImage(processedContent)
      
      const result = await createCommunity({
        userId: currentUser.userId,
        bookId: formData.bookId,
        title: formData.title,
        content: processedContent,
        communityKind: 'FREE',  // 공지는 종류 고정
        thumbnailUrl,
        isNotice: 1,  // 공지로 설정
      })

      if (result.success) {
        alert('공지가 등록되었습니다.')
        navigate('/admin/posts')
      } else {
        alert(result.message || '등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('공지 등록 실패:', error)
      alert('공지 등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 취소
  const handleCancel = () => {
    navigate('/admin/posts')
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">공지 작성</h2>
        <p className="text-sm text-gray-500 mt-1">
          작성된 공지는 커뮤니티 상단에 고정됩니다.
        </p>
      </div>

      {/* 폼 */}
      <CommunityForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        hideKindSelector={true}  // 종류 선택 숨김
      />
    </div>
  )
}

export default NoticeWritePage
