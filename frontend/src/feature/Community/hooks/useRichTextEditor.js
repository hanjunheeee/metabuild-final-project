import { useRef, useCallback, useState, useEffect } from 'react'

/**
 * 리치 텍스트 에디터 기능을 관리하는 커스텀 훅
 * contentEditable div와 함께 사용
 * 
 * @returns {Object} 에디터 관련 ref와 핸들러
 */
function useRichTextEditor() {
  const editorRef = useRef(null)

  // 현재 활성화된 서식 상태
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
  })

  // 현재 서식 상태 확인 및 업데이트
  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
    })
  }, [])

  // 선택 변경 및 키 입력 시 서식 상태 업데이트
  useEffect(() => {
    const handleSelectionChange = () => {
      // 에디터 내부에 포커스가 있을 때만 업데이트
      if (editorRef.current?.contains(document.activeElement) || 
          editorRef.current === document.activeElement) {
        updateActiveFormats()
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [updateActiveFormats])

  // URL 패턴 정규식
  const urlPattern = /(?:https?:\/\/|www\.)[^\s<]+/gi

  // URL 자동 링크 변환
  const autoLinkUrls = useCallback(() => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection.rangeCount) return

    const range = selection.getRangeAt(0)
    const node = range.startContainer

    // 텍스트 노드가 아니거나 이미 링크 안에 있으면 무시
    if (node.nodeType !== Node.TEXT_NODE) return
    if (node.parentElement?.tagName === 'A') return

    const text = node.textContent
    const match = text.match(urlPattern)

    if (match) {
      match.forEach((url) => {
        const urlIndex = text.lastIndexOf(url)
        if (urlIndex === -1) return

        // URL 텍스트를 링크로 변환
        const beforeText = text.substring(0, urlIndex)
        const afterText = text.substring(urlIndex + url.length)

        // 새 노드들 생성
        const beforeNode = document.createTextNode(beforeText)
        const linkNode = document.createElement('a')
        linkNode.href = url.startsWith('http') ? url : `https://${url}`
        linkNode.textContent = url
        linkNode.target = '_blank'
        linkNode.rel = 'noopener noreferrer'
        const afterNode = document.createTextNode(afterText)

        // 기존 노드 교체
        const parent = node.parentNode
        parent.insertBefore(beforeNode, node)
        parent.insertBefore(linkNode, node)
        parent.insertBefore(afterNode, node)
        parent.removeChild(node)

        // 커서를 링크 뒤로 이동
        const newRange = document.createRange()
        newRange.setStartAfter(afterNode.textContent ? afterNode : linkNode)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      })
    }
  }, [])

  // 키 입력 핸들러 (스페이스, 엔터 시 URL 자동 감지)
  const handleKeyDown = useCallback((e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      // 약간의 딜레이 후 URL 체크 (입력이 완료된 후)
      setTimeout(autoLinkUrls, 0)
    }
  }, [autoLinkUrls])

  // 붙여넣기 시에도 URL 자동 감지
  const handlePaste = useCallback(() => {
    setTimeout(autoLinkUrls, 0)
  }, [autoLinkUrls])

  // 에디터에 포커스
  const focusEditor = useCallback(() => {
    editorRef.current?.focus()
  }, [])

  // 현재 선택 영역 저장 (서식 적용 전 호출)
  const saveSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      return selection.getRangeAt(0)
    }
    return null
  }, [])

  // 선택 영역 복원
  const restoreSelection = useCallback((range) => {
    if (range) {
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }, [])

  // 서식 명령 실행
  const execCommand = useCallback((command, value = null) => {
    focusEditor()
    document.execCommand(command, false, value)
    // 명령 실행 후 상태 업데이트
    setTimeout(updateActiveFormats, 0)
  }, [focusEditor, updateActiveFormats])

  // ==================== 텍스트 스타일 ====================

  // 굵게
  const toggleBold = useCallback(() => {
    execCommand('bold')
  }, [execCommand])

  // 기울임
  const toggleItalic = useCallback(() => {
    execCommand('italic')
  }, [execCommand])

  // 밑줄
  const toggleUnderline = useCallback(() => {
    execCommand('underline')
  }, [execCommand])

  // 취소선
  const toggleStrikeThrough = useCallback(() => {
    execCommand('strikeThrough')
  }, [execCommand])

  // ==================== 문단 정렬 ====================

  // 왼쪽 정렬
  const alignLeft = useCallback(() => {
    execCommand('justifyLeft')
  }, [execCommand])

  // 가운데 정렬
  const alignCenter = useCallback(() => {
    execCommand('justifyCenter')
  }, [execCommand])

  // 오른쪽 정렬
  const alignRight = useCallback(() => {
    execCommand('justifyRight')
  }, [execCommand])

  // ==================== 블록 요소 ====================

  // 현재 블록 요소 확인
  const isInsideBlockquote = useCallback(() => {
    const selection = window.getSelection()
    if (!selection.rangeCount) return false
    
    let node = selection.anchorNode
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'BLOCKQUOTE') return true
      node = node.parentNode
    }
    return false
  }, [])

  // 인용구 토글
  const insertQuote = useCallback(() => {
    if (isInsideBlockquote()) {
      // 인용구 안에 있으면 일반 문단으로 변경
      execCommand('formatBlock', 'div')
    } else {
      // 인용구 밖에 있으면 인용구로 변경
      execCommand('formatBlock', 'blockquote')
    }
  }, [execCommand, isInsideBlockquote])

  // 구분선
  const insertHorizontalRule = useCallback(() => {
    execCommand('insertHorizontalRule')
  }, [execCommand])

  // ==================== 미디어/링크 ====================

  // 이미지 삽입 (URL 또는 Base64)
  const insertImage = useCallback((src) => {
    if (src) {
      focusEditor()
      // execCommand 대신 직접 img 태그 삽입 (더 안정적)
      const img = document.createElement('img')
      img.src = src
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
      
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(img)
        // 커서를 이미지 뒤로 이동
        range.setStartAfter(img)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
  }, [focusEditor])

  // 파일에서 이미지 삽입 (서버 업로드 후 URL 삽입)
  const insertImageFromFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 크기는 10MB 이하만 가능합니다.')
      return
    }

    try {
      // 서버에 이미지 업로드
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/files/upload/community', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success && result.url) {
        insertImage(result.url)  // 업로드된 이미지 URL 삽입
      } else {
        alert(result.message || '이미지 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert('이미지 업로드에 실패했습니다.')
    }
  }, [insertImage])

  // 파일 input change 핸들러
  const handleImageFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      insertImageFromFile(file)
    }
    // input 초기화 (같은 파일 재선택 가능하도록)
    e.target.value = ''
  }, [insertImageFromFile])

  // 이미지 삽입 프롬프트 (URL 입력)
  const promptInsertImage = useCallback(() => {
    const url = prompt('이미지 URL을 입력해주세요:')
    if (url) {
      insertImage(url)
    }
  }, [insertImage])

  // 링크 삽입
  const insertLink = useCallback((url) => {
    if (url) {
      execCommand('createLink', url)
    }
  }, [execCommand])

  // 링크 삽입 프롬프트
  const promptInsertLink = useCallback(() => {
    const url = prompt('링크 URL을 입력해주세요:')
    if (url) {
      insertLink(url)
    }
  }, [insertLink])

  // 링크 제거
  const removeLink = useCallback(() => {
    execCommand('unlink')
  }, [execCommand])

  // ==================== 콘텐츠 관리 ====================

  // HTML 콘텐츠 가져오기
  const getContent = useCallback(() => {
    return editorRef.current?.innerHTML || ''
  }, [])

  // HTML 콘텐츠 설정
  const setContent = useCallback((html) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = html
    }
  }, [])

  // 텍스트만 가져오기
  const getTextContent = useCallback(() => {
    return editorRef.current?.innerText || ''
  }, [])

  // 콘텐츠 초기화
  const clearContent = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = ''
    }
  }, [])

  return {
    // Ref
    editorRef,

    // 활성 상태
    activeFormats,

    // 유틸리티
    focusEditor,
    saveSelection,
    restoreSelection,

    // 텍스트 스타일
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrikeThrough,

    // 문단 정렬
    alignLeft,
    alignCenter,
    alignRight,

    // 블록 요소
    insertQuote,
    insertHorizontalRule,

    // 미디어/링크
    insertImage,
    insertImageFromFile,
    handleImageFileChange,
    promptInsertImage,
    insertLink,
    promptInsertLink,
    removeLink,

    // URL 자동 링크
    handleKeyDown,
    handlePaste,

    // 콘텐츠 관리
    getContent,
    setContent,
    getTextContent,
    clearContent,
  }
}

export default useRichTextEditor
