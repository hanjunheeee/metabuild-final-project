import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CommunityForm } from '@/shared/components'
import { Spinner } from '@/shared/components/icons'
import { getUserFromSession } from '@/shared/api/authApi'
import { createCommunity, updateCommunity, fetchCommunityById, processImagesInContent } from '../api/communityApi'

function CommunityWritePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit') // 수정 모드일 경우 게시글 ID

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState(null)
  
  // PrivateRoute를 통과했으므로 사용자 정보는 반드시 존재
  const currentUser = getUserFromSession()

  const isEditMode = !!editId

  // 수정 모드일 때 기존 게시글 데이터 로드
  useEffect(() => {
    if (isEditMode) {
      const loadPost = async () => {
        try {
          setLoading(true)
          const post = await fetchCommunityById(editId)
          
          // 작성자 확인
          if (post.userId !== currentUser?.userId) {
            alert('본인이 작성한 게시글만 수정할 수 있습니다.')
            navigate('/community')
            return
          }

          // contentJson 파싱
          let title = ''
          let content = ''
          try {
            const parsed = JSON.parse(post.contentJson || '{}')
            title = parsed.title || ''
            content = parsed.content || ''
          } catch {
            title = ''
            content = post.contentJson || ''
          }

          // 초기 데이터 설정
          setInitialData({
            title,
            content,
            communityKind: post.communityKind || 'FREE',
            book: post.bookId ? {
              bookId: post.bookId,
              title: post.bookTitle,
              author: post.bookAuthor,
            } : null,
          })
        } catch (err) {
          console.error('게시글 로딩 실패:', err)
          alert('게시글을 불러올 수 없습니다.')
          navigate('/community')
        } finally {
          setLoading(false)
        }
      }
      loadPost()
    }
  }, [editId, isEditMode, currentUser?.userId, navigate])

  // 콘텐츠에서 첫 번째 이미지 URL 추출
  const extractFirstImage = (content) => {
    const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/
    const match = content.match(imgPattern)
    return match ? match[1] : null
  }

  // 글 등록/수정
  const handleSubmit = async (formData) => {
    setIsSubmitting(true)
    
    try {
      // 1. 콘텐츠 내 Base64 이미지를 서버에 업로드하고 URL로 교체
      const processedContent = await processImagesInContent(formData.content)
      
      // 2. 첫 번째 이미지를 썸네일로 자동 추출
      const thumbnailUrl = extractFirstImage(processedContent)
      
      if (isEditMode) {
        // 수정 모드
        const result = await updateCommunity(editId, {
          userId: currentUser.userId,
          bookId: formData.bookId,
          title: formData.title,
          content: processedContent,
          communityKind: formData.communityKind,
          thumbnailUrl,
        })

        if (result.success) {
          alert('게시글이 수정되었습니다.')
          navigate(`/community/${editId}`)
        } else {
          alert(result.message || '수정에 실패했습니다.')
        }
      } else {
        // 작성 모드
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
      }
    } catch (error) {
      console.error('처리 실패:', error)
      alert('처리에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 취소
  const handleCancel = () => {
    if (isEditMode) {
      navigate(`/community/${editId}`)
    } else {
      navigate('/community')
    }
  }

  // 수정 모드 로딩 중
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-10 h-10 text-main-bg" />
          <p className="text-gray-400 text-sm">게시글을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 수정 모드인데 데이터 로드 안 됨
  if (isEditMode && !initialData) {
    return null
  }

  return (
    <div className="flex-1 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-sub-bg mb-2">
            {isEditMode ? '글 수정' : '글쓰기'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isEditMode ? '게시글을 수정하세요.' : '책에 대한 생각을 공유해보세요.'}
          </p>
        </div>

        {/* 폼 */}
        <CommunityForm
          mode={isEditMode ? 'edit' : 'create'}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}

export default CommunityWritePage
