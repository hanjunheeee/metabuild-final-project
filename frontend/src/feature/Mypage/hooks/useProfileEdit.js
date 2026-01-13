import { useState, useRef, useEffect } from 'react'
import { getUserFromSession, updateProfile, uploadProfilePhoto } from '@/shared/api/authApi'

const API_BASE_URL = 'http://localhost:7878'

/**
 * 프로필 편집 관련 로직을 관리하는 커스텀 훅
 */
function useProfileEdit() {
  const [user, setUser] = useState(getUserFromSession())
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [topTitles, setTopTitles] = useState([])
  const fileInputRef = useRef(null)

  // 칭호 조회
  useEffect(() => {
    const fetchTitles = async () => {
      if (!user?.userId) return
      try {
        const res = await fetch(`${API_BASE_URL}/api/titles/user/${user.userId}/top`)
        const data = await res.json()
        setTopTitles(data || [])
      } catch (err) {
        console.error('칭호 조회 실패:', err)
      }
    }
    fetchTitles()
  }, [user?.userId])

  // 프로필 이미지 URL 생성
  const getProfileImageUrl = (photo) => {
    if (!photo) return null
    if (photo.startsWith('http') || photo.startsWith('data:')) return photo
    return `${API_BASE_URL}/uploads/profile/${photo}`
  }

  const currentProfileImage = photoPreview || getProfileImageUrl(user?.userPhoto)

  // 사진 선택 핸들러
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 이미지 파일 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    // 5MB 제한
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    setPhotoFile(file)
    // 미리보기 생성
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  // 사진 삭제 핸들러
  const handlePhotoRemove = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 수정 시작
  const handleStartEdit = () => {
    setIsEditing(true)
  }

  // 수정 취소
  const handleCancel = () => {
    setIsEditing(false)
    setNickname(user?.nickname || '')
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  // 저장 핸들러
  const handleSave = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.')
      return
    }

    // 닉네임 유효성 검사
    const nicknameRegex = /^[a-zA-Z0-9가-힣]{2,5}$/
    if (!nicknameRegex.test(nickname)) {
      alert('닉네임은 2~5자의 영문, 숫자, 한글만 사용 가능합니다.')
      return
    }

    setIsLoading(true)

    try {
      let newUserPhoto = user?.userPhoto

      // 새 사진이 있으면 업로드
      if (photoFile) {
        const uploadResult = await uploadProfilePhoto(photoFile)
        if (uploadResult.success) {
          newUserPhoto = uploadResult.filename
        } else {
          throw new Error(uploadResult.message || '사진 업로드에 실패했습니다.')
        }
      }

      // 프로필 수정 API 호출
      const result = await updateProfile(user.userId, nickname, newUserPhoto)

      if (result.success) {
        // 로컬 상태 업데이트
        setUser(getUserFromSession())
        setIsEditing(false)
        setPhotoFile(null)
        setPhotoPreview(null)
        alert('프로필이 수정되었습니다.')
      } else {
        throw new Error(result.message || '프로필 수정에 실패했습니다.')
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 파일 input 클릭 트리거
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return {
    // 상태
    user,
    isEditing,
    isLoading,
    nickname,
    setNickname,
    photoPreview,
    topTitles,
    currentProfileImage,
    fileInputRef,

    // 액션
    handlePhotoChange,
    handlePhotoRemove,
    handleStartEdit,
    handleCancel,
    handleSave,
    triggerFileInput,
  }
}

export default useProfileEdit

