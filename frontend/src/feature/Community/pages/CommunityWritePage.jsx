import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CommunityForm } from '@/shared/components'
import { getUserFromSession } from '@/shared/api/authApi'
import { createCommunity, processImagesInContent } from '../api/communityApi'

function CommunityWritePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // PrivateRoute를 통과했으므로 사용자 정보는 반드시 존재
  const currentUser = getUserFromSession()

  // 콘텐츠에서 첫 번째 이미지 URL 추출
  const extractFirstImage = (content) => {
    const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/
    const match = content.match(imgPattern)
    return match ? match[1] : null
  }

  // 글 등록
  const handleSubmit = async (formData) => {
    setIsSubmitting(true)
    
    try {
      // 1. 콘텐츠 내 Base64 이미지를 서버에 업로드하고 URL로 교체
      const processedContent = await processImagesInContent(formData.content)
      
      // 2. 첫 번째 이미지를 썸네일로 자동 추출
      const thumbnailUrl = extractFirstImage(processedContent)
      
      // 3. 게시글 작성 API 호출
      const result = await createCommunity({
        userId: currentUser.userId,
        bookId: formData.bookId,
        title: formData.title,
        content: processedContent,
        communityKind: formData.communityKind,
        thumbnailUrl,
      })

      if (result.success) {
        alert('게시글이 등록되었습니다.')
        navigate('/community')
      } else {
        alert(result.message || '등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('등록 실패:', error)
      alert('등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 취소
  const handleCancel = () => {
    navigate('/community')
  }

  return (
    <div className="flex-1 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-sub-bg mb-2">글쓰기</h1>
          <p className="text-gray-400 text-sm">책에 대한 생각을 공유해보세요.</p>
        </div>

        {/* 폼 */}
        <CommunityForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}

export default CommunityWritePage
