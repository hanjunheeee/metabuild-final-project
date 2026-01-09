/**
 * 커뮤니티 관련 유틸리티 함수들을 제공하는 훅
 * CommunityListPage, MyPostsPage 등에서 공통으로 사용
 */
function useCommunityHelpers() {
  // 날짜 포맷 (YY.MM.DD 형식)
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const yy = String(date.getFullYear()).slice(-2)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yy}.${mm}.${dd}`
  }

  // 게시글 제목 추출 (contentJson에서)
  const getPostTitle = (post) => {
    try {
      const parsed = JSON.parse(post.contentJson || '{}')
      return parsed.title || '제목 없음'
    } catch {
      return post.contentJson?.substring(0, 50) || '제목 없음'
    }
  }

  // HTML 태그 제거 함수 (줄바꿈 보존)
  const stripHtml = (html) => {
    if (!html) return ''
    // <br> 태그를 줄바꿈으로 변환
    let text = html.replace(/<br\s*\/?>/gi, '\n')
    // <p>, <div> 태그 끝을 줄바꿈으로 변환
    text = text.replace(/<\/(p|div)>/gi, '\n')
    // 나머지 HTML 태그 제거
    text = text.replace(/<[^>]*>/g, '')
    // HTML 엔티티 디코딩 (&nbsp;, &amp; 등)
    const decoded = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
    // 연속 공백은 하나로 (줄바꿈은 유지)
    return decoded.replace(/[ \t]+/g, ' ').replace(/\n+/g, '\n').trim()
  }

  // 게시글 미리보기 내용 추출
  const getPreviewContent = (post, maxLength = 120) => {
    try {
      const parsed = JSON.parse(post.contentJson || '{}')
      const content = stripHtml(parsed.content || '')
      return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
    } catch {
      const content = stripHtml(post.contentJson || '')
      return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
    }
  }

  // 게시글 내 이미지 URL 추출
  const getPostImages = (post) => {
    try {
      const parsed = JSON.parse(post.contentJson || '{}')
      const content = parsed.content || ''
      // img 태그에서 src 추출
      const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/g
      const images = []
      let match
      while ((match = imgPattern.exec(content)) !== null) {
        images.push(match[1])
      }
      return images
    } catch {
      return []
    }
  }

  // 게시글 종류 라벨 반환
  const getKindLabel = (kind) => {
    const labels = { FREE: '자유', REVIEW: '리뷰', QUESTION: '질문' }
    return labels[kind] || kind
  }

  // 게시글 종류별 스타일 클래스 반환
  const getKindStyle = (kind) => {
    const styles = {
      FREE: 'bg-blue-100 text-blue-700',
      REVIEW: 'bg-purple-100 text-purple-700',
      QUESTION: 'bg-green-100 text-green-700',
    }
    return styles[kind] || 'bg-gray-100 text-gray-700'
  }

  // 게시글 배지 설정 반환 (CommunityPostList용)
  const getBadgeConfig = (post, isNoticeFilter = false) => {
    if (isNoticeFilter || post.isNotice === 1) {
      return { text: '공지', color: 'amber' }
    } else if (post.communityKind === 'REVIEW') {
      return { text: '리뷰', color: 'green' }
    } else if (post.communityKind === 'FREE') {
      return { text: '자유', color: 'gray' }
    } else if (post.communityKind === 'QUESTION') {
      return { text: '질문', color: 'purple' }
    }
    return { text: '일반', color: 'gray' }
  }

  return {
    formatDate,
    getPostTitle,
    stripHtml,
    getPreviewContent,
    getPostImages,
    getKindLabel,
    getKindStyle,
    getBadgeConfig,
  }
}

export default useCommunityHelpers

