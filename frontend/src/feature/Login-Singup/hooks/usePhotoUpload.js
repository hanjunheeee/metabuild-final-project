import { useState, useRef } from 'react'

/**
 * 사진 업로드 훅
 * @param {Object} options - 옵션
 * @param {number} options.maxSizeMB - 최대 파일 크기 (MB), 기본값 5
 * @param {Function} options.onError - 에러 콜백
 */
export function usePhotoUpload({ maxSizeMB = 5, onError } = {}) {
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const fileInputRef = useRef(null)

  // 사진 선택 핸들러
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const allowedMimeTypes = new Set(['image/jpeg', 'image/png'])
      const isAllowed =
        (file.type && allowedMimeTypes.has(file.type)) ||
        (!file.type && /\.(jpe?g|png)$/i.test(file.name || ''))

      // JPG/JPEG/PNG만 허용 (GIF 등 제외)
      if (!isAllowed) {
        onError?.('JPG, JPEG, PNG 파일만 업로드 가능합니다.')
        // 같은 파일 재선택 가능하도록 초기화
        if (e.target) e.target.value = ''
        return
      }
      // 파일 크기 제한
      if (file.size > maxSizeMB * 1024 * 1024) {
        onError?.(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`)
        // 같은 파일 재선택 가능하도록 초기화
        if (e.target) e.target.value = ''
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
  }

  // 사진 삭제 핸들러
  const handlePhotoRemove = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 초기화
  const reset = () => {
    handlePhotoRemove()
  }

  return {
    photoPreview,
    photoFile,
    fileInputRef,
    handlePhotoChange,
    handlePhotoRemove,
    reset,
    setPhotoPreview
  }
}

