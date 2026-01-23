import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { fetchGuList, fetchLibraryData, checkLoan, searchBooks } from '../api/libraryApi'
import { Spinner } from '@/shared/components/icons'
import { ConfirmModal } from '@/shared/components/modal'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function LibraryMapPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const isbn = searchParams.get('isbn') || ''
  const title = decodeURIComponent(searchParams.get('title') || searchParams.get('query') || '')
  const fallbackCover = 'https://via.placeholder.com/70x100?text=No+Image'
  const ALL_GU = '서울시 전체'

  const [guList, setGuList] = useState([])
  const [selectedGu, setSelectedGu] = useState('')
  const [libraryData, setLibraryData] = useState([])
  const [loading, setLoading] = useState(false)
  const [countsLoading, setCountsLoading] = useState(false)
  const [availableCounts, setAvailableCounts] = useState({})
  const [libraryCounts, setLibraryCounts] = useState({})
  const [mapMode, setMapMode] = useState('loan')
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selectedBookImage, setSelectedBookImage] = useState('')
  const [selectedBookTitle, setSelectedBookTitle] = useState('')
  const [resolvedIsbn, setResolvedIsbn] = useState('')
  const [loanMessage, setLoanMessage] = useState('')
  
  // 위치 확인 모달 상태
  const [locationModal, setLocationModal] = useState({
    isOpen: false,
    destLat: 0,
    destLng: 0,
    destName: ''
  })
  
  // 위치 로딩 상태
  const [locationLoading, setLocationLoading] = useState(false)
  
  // 위치 허용 여부 저장 (null: 미선택, true: 허용, false: 거부)
  const locationPermissionRef = useRef(null)

  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerGroup = useRef(null)
  const guLayerMap = useRef({})
  const seoulBoundsRef = useRef(null)
  const countsCacheRef = useRef({})
  const loanStatusCacheRef = useRef({})
  const lastSearchRef = useRef({ isbn: '', gu: '' })
  const lastAllSearchRef = useRef({ gu: '' })
  const latestDataRef = useRef({ isbn: '', libraryData: [], selectedGu: '' })
  const lastIsbnRef = useRef('')
  const COUNTS_CACHE_TTL_MS = 10 * 60 * 1000
  const LOAN_CACHE_TTL_MS = 10 * 60 * 1000

  const colorPalette = [
    '#8EC1DA',
    '#F2B5A7',
    '#B8D8BA',
    '#F6D186',
    '#D6C2E9',
    '#F2A2B8',
    '#9FD3C7',
    '#F1C0A9',
    '#C2D3F2',
    '#F4B183',
    '#B5E0C0',
    '#E6C3A5'
  ]

  const LIB_KEYS = {
    gu: '구명',
    code: '도서관코드',
    lat: '위도',
    lng: '경도',
    address: '도로명주소',
    addressFallback: '주소',
    name: '도서관명'
  }

  const normalizeImageUrl = (url) => {
    if (!url || url === 'undefined' || url === 'null') return ''
    return url
  }

  const toMercator = (lat, lng) => {
    const x = (lng * 20037508.34) / 180
    const y = (Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180)) * (20037508.34 / 180)
    return { x, y }
  }

  // 실제 네이버 지도 열기 (위치 정보 포함/미포함)
  const openNaverMap = useCallback((destLat, destLng, destName, startLat, startLng) => {
    const { x, y } = toMercator(destLat, destLng)
    const zoom = 10
    const destPart = `${x},${y},${encodeURIComponent(destName)},,ADDRESS_POI`
    
    const hasStart = typeof startLat === 'number' && typeof startLng === 'number'
    const startPart = hasStart
      ? (() => {
          const start = toMercator(startLat, startLng)
          return `${start.x},${start.y},${encodeURIComponent('내 위치')},,ADDRESS_POI`
        })()
      : '-'
    const url = `https://map.naver.com/p/directions/${startPart}/${destPart}/-/transit?c=${zoom},${x},${y},0,dh`
    window.open(url, '_blank', 'noopener')
  }, [])

  // 위치를 사용해서 지도 열기
  const openMapWithLocation = useCallback((destLat, destLng, destName) => {
    if (!navigator.geolocation) {
      openNaverMap(destLat, destLng, destName)
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationLoading(false)
        openNaverMap(destLat, destLng, destName, position.coords.latitude, position.coords.longitude)
      },
      () => {
        setLocationLoading(false)
        // 위치 거부 시에도 목적지만으로 열기
        openNaverMap(destLat, destLng, destName)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [openNaverMap])

  // 모달에서 "허용" 클릭 시
  const requestLocationAndOpenMap = useCallback(() => {
    locationPermissionRef.current = true // 선택 저장
    const { destLat, destLng, destName } = locationModal
    setLocationModal(prev => ({ ...prev, isOpen: false }))
    openMapWithLocation(destLat, destLng, destName)
  }, [locationModal, openMapWithLocation])

  // 모달에서 "허용 안함" 클릭 시
  const openMapWithoutLocation = useCallback(() => {
    locationPermissionRef.current = false // 선택 저장
    const { destLat, destLng, destName } = locationModal
    setLocationModal(prev => ({ ...prev, isOpen: false }))
    openNaverMap(destLat, destLng, destName)
  }, [locationModal, openNaverMap])

  // 길찾기 버튼 클릭 시
  const openNaverDirections = (destLat, destLng, destName) => {
    // 이미 선택한 적이 있으면 모달 없이 바로 실행
    if (locationPermissionRef.current === true) {
      openMapWithLocation(destLat, destLng, destName)
      return
    }
    if (locationPermissionRef.current === false) {
      openNaverMap(destLat, destLng, destName)
      return
    }
    
    // 처음인 경우 모달 표시
    setLocationModal({
      isOpen: true,
      destLat,
      destLng,
      destName
    })
  }

  const getGuName = (properties = {}) => {
    const candidates = [
      properties.name,
      properties.NAME,
      properties.name_kr,
      properties.name_kor,
      properties.nameKo,
      properties.gu,
      properties.GU,
      properties.SIG_KOR_NM,
      properties.SGG_NM,
      properties.SIG_ENG_NM
    ]

    const direct = candidates.find(value => typeof value === 'string' && value.trim())
    if (direct) return direct.trim()

    const fallback = Object.values(properties).find(
      value => typeof value === 'string' && value.includes('구')
    )
    return typeof fallback === 'string' ? fallback.trim() : ''
  }

  const getColorForName = (name) => {
    if (!name) return '#CBD5E1'
    let hash = 0
    for (let i = 0; i < name.length; i += 1) {
      hash = (hash * 31 + name.charCodeAt(i)) % colorPalette.length
    }
    return colorPalette[Math.abs(hash) % colorPalette.length]
  }

  const updateGuLabels = (counts = {}, showCounts = false) => {
    Object.entries(guLayerMap.current).forEach(([name, layer]) => {
      const count = counts[name] ?? 0
      const countClass = count === 0 ? 'gu-count is-zero' : 'gu-count'
      const label = showCounts
        ? `<div class="gu-name">${name}</div><div class="${countClass}">(${count})</div>`
        : `<div class="gu-name">${name}</div>`
      layer.setTooltipContent(label)
    })
  }

  const getCachedLoanStatus = (isbnValue, libCode) => {
    const byIsbn = loanStatusCacheRef.current[isbnValue]
    if (!byIsbn) return null
    const entry = byIsbn[libCode]
    if (!entry) return null
    if (Date.now() - entry.timestamp > LOAN_CACHE_TTL_MS) {
      return null
    }
    return entry.available
  }

  const setCachedLoanStatus = (isbnValue, libCode, available) => {
    if (!loanStatusCacheRef.current[isbnValue]) {
      loanStatusCacheRef.current[isbnValue] = {}
    }
    loanStatusCacheRef.current[isbnValue][libCode] = {
      available,
      timestamp: Date.now()
    }
  }

  const clearMarkers = () => {
    if (markerGroup.current) {
      markerGroup.current.clearLayers()
    }
  }

  const resetLoanState = () => {
    clearMarkers()
    setAvailableCounts({})
    setLoanMessage('')
    lastSearchRef.current = { isbn: '', gu: '' }
  }

  const loadAllLibraryCounts = () => {
    if (libraryData.length === 0) return
    const counts = {}

    libraryData.forEach((lib) => {
      const guName = (lib[LIB_KEYS.gu] || '').trim()
      if (!guName) return
      counts[guName] = (counts[guName] || 0) + 1
    })

    setLibraryCounts(counts)
    updateGuLabels(counts, true)
  }

  const parseSearchResults = (data) => {
    const docs = data?.response?.docs || []
    return docs
      .map((item) => {
        const doc = item?.doc || item || {}
        const isbn13 = doc.isbn13 || ''
        const isbn10 = doc.isbn || ''
        const isbnValue = isbn13 || isbn10
        return {
          title: doc.bookname || doc.title || '',
          author: doc.authors || doc.author || '',
          publisher: doc.publisher || '',
          isbn: isbnValue,
          img: normalizeImageUrl(doc.bookImageURL || doc.cover),
          link: doc.bookDtlUrl || doc.link || ''
        }
      })
      .filter((item) => item.isbn || item.title)
  }

  const handleSearch = async () => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setSearchError('ISBN 또는 도서명을 입력해 주세요.')
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    setSearchError('')
    try {
      const data = await searchBooks(trimmed)
      const results = parseSearchResults(data)
      setSearchResults(results)
      if (results.length === 0) {
        setSearchError('검색 결과가 없습니다.')
      }
    } catch (e) {
      setSearchError('검색에 실패했습니다.')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSelectBook = (book) => {
    if (!book?.isbn) {
      alert('ISBN 정보가 없는 도서입니다.')
      return
    }

    setSelectedBookImage(normalizeImageUrl(book.img))
    setSelectedBookTitle(book.title)
    setResolvedIsbn(book.isbn)
    setSearchQuery(book.isbn)
    setSearchResults([])
    setSearchError('')
    setShowSearch(false)
    setSelectedGu(ALL_GU)
    setMapMode('loan')
    resetLoanState()

    const nextTitle = encodeURIComponent(book.title || '')
    navigate(`/library/map?isbn=${encodeURIComponent(book.isbn)}&title=${nextTitle}`)
  }

  const handleClearSelectedBook = () => {
    setSelectedBookImage('')
    setSelectedBookTitle('')
    setResolvedIsbn('')
    setSearchQuery('')
    setSearchResults([])
    setSearchError('')
    setShowSearch(false)
    setLoanMessage('')
    resetLoanState()
    navigate('/library/map')
  }

  const loadAllGuCounts = async () => {
    const { isbn: currentIsbn, libraryData: currentLibraries } = latestDataRef.current

    if (!currentIsbn) {
      setLoanMessage('ISBN 정보가 없어 도서관을 조회할 수 없습니다.')
      return
    }

    const cached = countsCacheRef.current[currentIsbn]
    if (cached && Date.now() - cached.timestamp < COUNTS_CACHE_TTL_MS) {
      setAvailableCounts(cached.counts)
      updateGuLabels(cached.counts, true)
      const cachedTotal = Object.values(cached.counts).reduce((sum, value) => sum + value, 0)
      if (cachedTotal === 0) {
        setLoanMessage('서울시 전체에서 대출 가능한 도서관이 없습니다.')
      }
      lastSearchRef.current = { isbn: currentIsbn, gu: ALL_GU }
      // 서울 전체가 보이도록 지도 축소
      if (mapInstance.current && seoulBoundsRef.current) {
        mapInstance.current.fitBounds(seoulBoundsRef.current, { padding: [40, 40], animate: true })
      }
      return
    }

    setCountsLoading(true)
    setLoanMessage('')

    try {
      const counts = {}
      await Promise.all(
        currentLibraries.map(async (lib) => {
          const guName = (lib[LIB_KEYS.gu] || '').trim()
          const libCode = lib[LIB_KEYS.code]
          if (!guName || !libCode) return

          let available = false
          const cached = getCachedLoanStatus(currentIsbn, libCode)
          if (cached !== null) {
            available = cached
          } else {
            try {
              const response = await checkLoan(libCode, currentIsbn)
              const result = response?.response?.result || {}
              available = result.loanAvailable === 'Y' || result.hasBook === 'Y'
            } catch (e) {
              available = false
            }
            setCachedLoanStatus(currentIsbn, libCode, available)
          }

          if (available) {
            counts[guName] = (counts[guName] || 0) + 1
          } else if (!Object.prototype.hasOwnProperty.call(counts, guName)) {
            counts[guName] = 0
          }
        })
      )

      countsCacheRef.current[currentIsbn] = { counts, timestamp: Date.now() }
      setAvailableCounts(counts)
      updateGuLabels(counts, true)
      lastSearchRef.current = { isbn: currentIsbn, gu: ALL_GU }

      const total = Object.values(counts).reduce((sum, value) => sum + value, 0)
      if (total === 0) {
        setLoanMessage('서울시 전체에서 대출 가능한 도서관이 없습니다.')
      }

      // 서울 전체가 보이도록 지도 축소
      if (mapInstance.current && seoulBoundsRef.current) {
        mapInstance.current.fitBounds(seoulBoundsRef.current, { padding: [40, 40], animate: true })
      }
    } finally {
      setCountsLoading(false)
    }
  }

  const handleCheckLoan = async (guOverride) => {
    const { isbn: currentIsbn, libraryData: currentLibraries, selectedGu: currentGu } = latestDataRef.current
    const targetGu = (guOverride || currentGu || '').trim()

    if (!targetGu) {
      setLoanMessage('구를 먼저 선택해 주세요.')
      return
    }
    if (!currentIsbn) {
      setLoanMessage('')
      handleShowAllLibraries(targetGu)
      return
    }

    const map = mapInstance.current
    const group = markerGroup.current
    if (!map || !group) {
      setLoanMessage('지도가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    const lastSearch = lastSearchRef.current
    if (lastSearch.isbn === currentIsbn && lastSearch.gu === targetGu) {
      if (targetGu === ALL_GU) {
        if (Object.keys(availableCounts).length > 0) return
      } else if (group.getLayers().length > 0) {
        return
      }
    }

    if (targetGu === ALL_GU) {
      clearMarkers()
      await loadAllGuCounts()
      return
    }

    setLoading(true)
    setLoanMessage('')
    clearMarkers()

    try {
      const candidates = currentLibraries.filter((lib) => {
        const guName = (lib[LIB_KEYS.gu] || '').trim()
        return guName === targetGu
      })
      const markerBounds = []

      if (candidates.length === 0) {
        setLoanMessage('선택한 구에 해당하는 도서관 데이터가 없습니다.')
        return
      }

      const checks = await Promise.all(
        candidates.map(async (lib) => {
          const lat = parseFloat(lib[LIB_KEYS.lat])
          const lng = parseFloat(lib[LIB_KEYS.lng])
          const libCode = lib[LIB_KEYS.code]

          if (!libCode || Number.isNaN(lat) || Number.isNaN(lng)) {
            return null
          }

          let available = false
          const cached = getCachedLoanStatus(currentIsbn, libCode)
          if (cached !== null) {
            available = cached
          } else {
            try {
              const response = await checkLoan(libCode, currentIsbn)
              const result = response?.response?.result || {}
              available = result.loanAvailable === 'Y' || result.hasBook === 'Y'
            } catch (e) {
              available = false
            }
            setCachedLoanStatus(currentIsbn, libCode, available)
          }

          return {
            lib,
            lat,
            lng,
            available
          }
        })
      )

      checks.filter(Boolean).filter(item => item.available).forEach(({ lib, lat, lng }) => {
        const name = lib[LIB_KEYS.name] || '도서관'
        const address = lib[LIB_KEYS.address] || lib[LIB_KEYS.addressFallback] || ''
        const addressText = address || '주소 정보 없음'
        const addressEscaped = addressText.replace(/"/g, '&quot;')
        const nameEscaped = name.replace(/"/g, '&quot;')

        const marker = L.circleMarker([lat, lng], {
          radius: 7,
          fillColor: '#34d399',
          color: '#111827',
          weight: 1,
          fillOpacity: 0.9
        })

        const popupContent = `
            <div style="width:300px;max-width:320px;white-space:normal;word-break:keep-all;">
              <div style="font-weight:700;margin-bottom:4px;color:#111827;font-size:15px;line-height:1.3;">${name}</div>
              <div style="display:flex;gap:10px;align-items:flex-start;justify-content:space-between;">
                <div style="font-size:14px;color:#4b5563;margin-bottom:6px;line-height:1.4;flex:1;">${addressText}</div>
                <div style="display:flex;flex-direction:row;gap:8px;flex-shrink:0;">
                  <button type="button" class="copy-address-btn" data-address="${addressEscaped}" style="border:1px solid #d1d5db;background:#fff;color:#374151;font-size:13px;padding:4px 10px;border-radius:8px;cursor:pointer;">복사</button>
                  <button type="button" class="directions-btn" data-lat="${lat}" data-lng="${lng}" data-name="${nameEscaped}" data-address="${addressEscaped}" style="border:1px solid #2563eb;background:#2563eb;color:#fff;font-size:13px;padding:4px 10px;border-radius:8px;cursor:pointer;">길찾기</button>
                </div>
              </div>
              <div style="font-size:13px;font-weight:600;color:#059669;">대출 가능</div>
            </div>
        `
        const tooltipContent = popupContent

        marker.bindTooltip(tooltipContent, {
          direction: 'top',
          className: 'custom-tooltip',
          opacity: 1,
          offset: [0, -18]
        })

        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          autoClose: true,
          closeOnClick: true,
          offset: [0, -6]
        })

        marker.on('popupopen', (event) => {
          const popupNode = event?.popup?.getElement?.()
          if (!popupNode) return
          const copyButton = popupNode.querySelector('.copy-address-btn')
          if (!copyButton) return
          const textToCopy = copyButton.getAttribute('data-address') || ''
          const directionsButton = popupNode.querySelector('.directions-btn')

          const handleCopy = (copyEvent) => {
            copyEvent.preventDefault()
            if (!textToCopy) return
            navigator.clipboard.writeText(textToCopy).then(() => {
              const original = copyButton.textContent
              copyButton.textContent = '복사됨'
              copyButton.disabled = true
              setTimeout(() => {
                copyButton.textContent = original
                copyButton.disabled = false
              }, 1200)
            })
          }

          copyButton.addEventListener('click', handleCopy)
          event.popup.once('remove', () => {
            copyButton.removeEventListener('click', handleCopy)
          })

          if (directionsButton) {
            const destLat = parseFloat(directionsButton.getAttribute('data-lat'))
            const destLng = parseFloat(directionsButton.getAttribute('data-lng'))
            const destName = directionsButton.getAttribute('data-address') || directionsButton.getAttribute('data-name') || '목적지'
            const handleDirections = (directionsEvent) => {
              directionsEvent.preventDefault()
              if (Number.isNaN(destLat) || Number.isNaN(destLng)) return
              openNaverDirections(destLat, destLng, destName)
            }

            directionsButton.addEventListener('click', handleDirections)
            event.popup.once('remove', () => {
              directionsButton.removeEventListener('click', handleDirections)
            })
          }
        })

        marker.addTo(group)
        markerBounds.push([lat, lng])
      })

      const guBounds = guLayerMap.current[targetGu]?.getBounds?.()
      if (guBounds) {
        map.fitBounds(guBounds, { padding: [40, 40] })
      } else if (markerBounds.length > 0) {
        map.fitBounds(markerBounds, { padding: [40, 40] })
      } else {
        setLoanMessage('해당 구에서 대출 가능한 도서관이 없습니다.')
      }
      lastSearchRef.current = { isbn: currentIsbn, gu: targetGu }
    } finally {
      setLoading(false)
    }
  }

  const handleShowAllLibraries = (guOverride) => {
    const targetGu = (guOverride || selectedGu || '').trim()
    const map = mapInstance.current
    const group = markerGroup.current

    if (!targetGu) {
      setLoanMessage('구를 먼저 선택해 주세요.')
      return
    }
    if (!map || !group) {
      setLoanMessage('지도가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    if (targetGu === ALL_GU) {
      clearMarkers()
      setLoanMessage('')
      lastAllSearchRef.current = { gu: ALL_GU }
      loadAllLibraryCounts()
      return
    }

    if (lastAllSearchRef.current.gu === targetGu && group.getLayers().length > 0) {
      return
    }

    clearMarkers()
    setLoanMessage('')

    const candidates = libraryData.filter((lib) => {
      const guName = (lib[LIB_KEYS.gu] || '').trim()
      return guName === targetGu
    })

    if (candidates.length === 0) {
      setLoanMessage('선택한 구에 해당하는 도서관 데이터가 없습니다.')
      return
    }

    const markerBounds = []
    candidates.forEach((lib) => {
      const lat = parseFloat(lib[LIB_KEYS.lat])
      const lng = parseFloat(lib[LIB_KEYS.lng])
      if (Number.isNaN(lat) || Number.isNaN(lng)) return

      const name = lib[LIB_KEYS.name] || '도서관'
      const address = lib[LIB_KEYS.address] || lib[LIB_KEYS.addressFallback] || ''
      const addressText = address || '주소 정보 없음'
      const addressEscaped = addressText.replace(/"/g, '&quot;')
      const nameEscaped = name.replace(/"/g, '&quot;')

      const marker = L.circleMarker([lat, lng], {
        radius: 6,
        fillColor: '#93c5fd',
        color: '#1f2937',
        weight: 1,
        fillOpacity: 0.9
      })

      const popupContent = `
        <div style="width:300px;max-width:320px;white-space:normal;word-break:keep-all;">
          <div style="font-weight:700;margin-bottom:4px;color:#111827;font-size:15px;line-height:1.3;">${name}</div>
          <div style="display:flex;gap:10px;align-items:flex-start;justify-content:space-between;">
            <div style="font-size:14px;color:#4b5563;line-height:1.4;flex:1;">${addressText}</div>
            <div style="display:flex;flex-direction:row;gap:8px;flex-shrink:0;">
              <button type="button" class="copy-address-btn" data-address="${addressEscaped}" style="border:1px solid #d1d5db;background:#fff;color:#374151;font-size:13px;padding:4px 10px;border-radius:8px;cursor:pointer;">복사</button>
              <button type="button" class="directions-btn" data-lat="${lat}" data-lng="${lng}" data-name="${nameEscaped}" data-address="${addressEscaped}" style="border:1px solid #2563eb;background:#2563eb;color:#fff;font-size:13px;padding:4px 10px;border-radius:8px;cursor:pointer;">길찾기</button>
            </div>
          </div>
        </div>
      `
      const tooltipContent = popupContent

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        className: 'custom-tooltip',
        opacity: 1,
        offset: [0, -18]
      })

      marker.bindPopup(popupContent, {
        className: 'custom-popup',
        autoClose: true,
        closeOnClick: true,
        offset: [0, -6]
      })

      marker.on('popupopen', (event) => {
        const popupNode = event?.popup?.getElement?.()
        if (!popupNode) return
        const copyButton = popupNode.querySelector('.copy-address-btn')
        if (!copyButton) return
        const textToCopy = copyButton.getAttribute('data-address') || ''
        const directionsButton = popupNode.querySelector('.directions-btn')

        const handleCopy = (copyEvent) => {
          copyEvent.preventDefault()
          if (!textToCopy) return
          navigator.clipboard.writeText(textToCopy).then(() => {
            const original = copyButton.textContent
            copyButton.textContent = '복사됨'
            copyButton.disabled = true
            setTimeout(() => {
              copyButton.textContent = original
              copyButton.disabled = false
            }, 1200)
          })
        }

        copyButton.addEventListener('click', handleCopy)
        event.popup.once('remove', () => {
          copyButton.removeEventListener('click', handleCopy)
        })

        if (directionsButton) {
          const destLat = parseFloat(directionsButton.getAttribute('data-lat'))
          const destLng = parseFloat(directionsButton.getAttribute('data-lng'))
          const destName = directionsButton.getAttribute('data-address') || directionsButton.getAttribute('data-name') || '목적지'
          const handleDirections = (directionsEvent) => {
            directionsEvent.preventDefault()
            if (Number.isNaN(destLat) || Number.isNaN(destLng)) return
            openNaverDirections(destLat, destLng, destName)
          }

          directionsButton.addEventListener('click', handleDirections)
          event.popup.once('remove', () => {
            directionsButton.removeEventListener('click', handleDirections)
          })
        }
      })

      marker.addTo(group)
      markerBounds.push([lat, lng])
    })

    const guBounds = guLayerMap.current[targetGu]?.getBounds?.()
    if (guBounds) {
      map.fitBounds(guBounds, { padding: [40, 40] })
    } else if (markerBounds.length > 0) {
      map.fitBounds(markerBounds, { padding: [40, 40] })
    }

    lastAllSearchRef.current = { gu: targetGu }
  }

  const filterAndZoom = (guName) => {
    if (mapMode === 'all') {
      handleShowAllLibraries(guName)
      return
    }
    handleCheckLoan(guName)
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [guData, libData] = await Promise.all([
          fetchGuList(),
          fetchLibraryData()
        ])
        const withAll = [ALL_GU, ...guData.filter(gu => gu !== ALL_GU)]
        setGuList(withAll)
        setLibraryData(libData)
        setSelectedGu(ALL_GU)
      } catch (e) {
        console.error('도서관 목록 로드 실패:', e)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    latestDataRef.current = { isbn: resolvedIsbn || isbn, libraryData, selectedGu }
  }, [resolvedIsbn, isbn, libraryData, selectedGu])

  useEffect(() => {
    if (mapMode !== 'all' || !selectedGu) return
    handleShowAllLibraries(selectedGu)
  }, [mapMode, selectedGu, libraryData])

  useEffect(() => {
    setSelectedBookTitle(title || '')
  }, [title])

  useEffect(() => {
    setResolvedIsbn(isbn || '')
  }, [isbn])

  useEffect(() => {
    if (!resolvedIsbn) return
    setMapMode('loan')
    resetLoanState()
  }, [resolvedIsbn])

  useEffect(() => {
    if (mapMode !== 'all') return
    loadAllLibraryCounts()
  }, [mapMode, libraryData])

  useEffect(() => {
    if (!resolvedIsbn || libraryData.length === 0) return
    if (selectedGu !== ALL_GU) return
    if (mapMode !== 'loan') return
    loadAllGuCounts()
  }, [selectedGu, resolvedIsbn, libraryData, mapMode])

  useEffect(() => {
    if (mapMode === 'all') {
      const hasCounts = Object.keys(libraryCounts).length > 0
      updateGuLabels(libraryCounts, hasCounts)
      return
    }
    const hasCounts = Object.keys(availableCounts).length > 0
    updateGuLabels(availableCounts, hasCounts)
  }, [selectedGu, availableCounts, libraryCounts, mapMode])

  useEffect(() => {
    if (!resolvedIsbn || resolvedIsbn === lastIsbnRef.current) return
    lastIsbnRef.current = resolvedIsbn

    const loadBookByIsbn = async () => {
      try {
        const data = await searchBooks(resolvedIsbn)
        const results = parseSearchResults(data)
        const match = results.find(item => item.isbn === resolvedIsbn) || results[0]
        if (match) {
          setSelectedBookImage(normalizeImageUrl(match.img))
          if (!title && match.title) {
            setSelectedBookTitle(match.title)
          }
        }
      } catch (e) {
        console.error('ISBN 검색 실패:', e)
      }
    }

    loadBookByIsbn()
  }, [resolvedIsbn, title])

  useEffect(() => {
    if (resolvedIsbn) return
    if (!title) return

    const loadBookByTitle = async () => {
      try {
        const data = await searchBooks(title)
        const results = parseSearchResults(data)
        const match = results.find(item => item.title === title) || results[0]
        if (match) {
          setSelectedBookImage(normalizeImageUrl(match.img))
          setSelectedBookTitle(match.title || title)
        }
      } catch (e) {
        console.error('제목 검색 실패:', e)
      }
    }

    loadBookByTitle()
  }, [resolvedIsbn, title])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, { maxZoom: 20 }).setView([37.5665, 126.9780], 11)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map)

    mapInstance.current = map
    markerGroup.current = L.layerGroup().addTo(map)

    fetch('https://raw.githubusercontent.com/southkorea/seoul-maps/master/kostat/2013/json/seoul_municipalities_geo_simple.json')
      .then(res => res.json())
      .then(data => {
        const maskRings = []
        data?.features?.forEach((feature) => {
          const geometry = feature?.geometry
          if (!geometry) return
          const addRing = (ring) => {
            if (!Array.isArray(ring)) return
            maskRings.push(ring.map(([lng, lat]) => [lat, lng]))
          }
          if (geometry.type === 'Polygon') {
            addRing(geometry.coordinates?.[0])
          } else if (geometry.type === 'MultiPolygon') {
            geometry.coordinates?.forEach((polygon) => {
              addRing(polygon?.[0])
            })
          }
        })

        if (maskRings.length > 0) {
          const outerRing = [
            [90, -180],
            [90, 180],
            [-90, 180],
            [-90, -180]
          ]
          L.polygon([outerRing, ...maskRings], {
            color: '#ffffff',
            fillColor: '#ffffff',
            fillOpacity: 1,
            weight: 0,
            interactive: false
          }).addTo(map)
        }

        const seoulLayer = L.geoJson(data, {
          style: (feature) => {
            const name = getGuName(feature?.properties)
            return {
              fillColor: getColorForName(name),
              color: '#ffffff',
              weight: 1.2,
              fillOpacity: 0.55
            }
          },
          onEachFeature: (feature, layer) => {
            const name = getGuName(feature?.properties)
            if (!name) return
            layer.bindTooltip(name, {
              permanent: true,
              direction: 'center',
              className: 'gu-label'
            })
            guLayerMap.current[name] = layer
            layer.on('click', () => {
              setSelectedGu(name)
              filterAndZoom(name)
            })
          }
        }).addTo(map)

        const seoulBounds = seoulLayer.getBounds()
        if (seoulBounds && seoulBounds.isValid()) {
          seoulBoundsRef.current = seoulBounds
          map.fitBounds(seoulBounds, { padding: [20, 20] })
          map.setMaxBounds(seoulBounds.pad(0.08))
          map.setMinZoom(map.getZoom())
        }
      })
      .catch((e) => {
        console.error('지도 데이터 로드 실패:', e)
      })

    return () => {
      map.remove()
      mapInstance.current = null
      markerGroup.current = null
      guLayerMap.current = {}
    }
  }, [])

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <div className="w-[320px] p-6 bg-gray-50 border-r border-gray-200 overflow-y-auto">
        <div className="mb-6 border border-gray-200 bg-white p-3">
          <button
            onClick={() => {
              setMapMode('all')
              setSelectedGu(ALL_GU)
              setLoanMessage('')
              handleShowAllLibraries(ALL_GU)
            }}
            className="w-full py-2 bg-teal-700 text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            서울시 전체 도서관 위치
          </button>
        </div>

        <div className="mb-6 border border-gray-200 bg-white p-3">
          <div className="text-sm font-bold text-gray-800 mb-3">선택한 책</div>

          {(selectedBookTitle || title) && (
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedBookImage || fallbackCover}
                  alt="book cover"
                  className="w-[60px] h-[80px] border border-gray-200 object-cover"
                />
                <div className="text-sm text-gray-700 flex-1">{selectedBookTitle || title}</div>
                <button
                  type="button"
                  onClick={handleClearSelectedBook}
                  className="text-xs text-gray-500 border border-gray-300 w-6 h-6 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                  aria-label="선택한 책 지우기"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              if (showSearch) {
                setSearchQuery('')
                setSearchResults([])
                setSearchError('')
              }
              setShowSearch(!showSearch)
            }}
            className="w-full mt-3 py-2 bg-main-bg text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            {showSearch ? '검색 닫기' : '다른 책 검색하기'}
          </button>

          {showSearch && (
            <div className="mt-4">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="책제목 또는 ISBN을 입력"
                maxLength={30}
                className="w-full p-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-sub-bg focus:border-sub-bg"
              />
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="w-full mt-2 py-2 bg-sub-bg text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-70"
              >
                {searchLoading ? '검색 중...' : '도서 검색하기'}
              </button>

              {searchError && (
                <div className="mt-2 text-sm text-red-500">{searchError}</div>
              )}

              {searchResults.length > 0 && (
                <div className="mt-4 max-h-[300px] overflow-y-auto">
                  {searchResults.map((book) => (
                    <div
                      key={`${book.isbn}-${book.title}`}
                      className="p-2 border border-gray-200 mb-2 flex gap-2 items-center bg-white"
                    >
                      <img
                        src={book.img || fallbackCover}
                        alt="book cover"
                        className="w-[50px] h-[70px] object-cover"
                      />
                      <div className="text-sm flex-1">
                        <div className="font-bold text-gray-800">{book.title}</div>
                        <div className="text-xs text-gray-500">ISBN: {book.isbn}</div>
                        <button
                          onClick={() => handleSelectBook(book)}
                          className="mt-2 w-full px-2 py-1 bg-sub-bg text-white text-xs hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          이 책으로 변경
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border border-gray-200 bg-white p-3">
          <label className="font-bold text-sm text-gray-800">지역(구) 선택</label>
          <select
            value={selectedGu}
            onChange={(e) => setSelectedGu(e.target.value)}
            className="w-full h-11 px-3 border border-gray-300 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-sub-bg focus:border-sub-bg cursor-pointer"
          >
            <option value="">구 선택</option>
            {guList.map((gu) => (
              <option key={gu} value={gu}>
                {gu}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setMapMode('loan')
              handleCheckLoan()
            }}
            className="w-full mt-2 h-11 bg-sub-bg text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            {loading || countsLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner className="w-4 h-4 text-white" />
                조회 중...
              </span>
            ) : (
              '대출 가능 도서관 찾기'
            )}
          </button>
        </div>

      </div>

      <div ref={mapRef} className="flex-1" />

      <style>{`
        .custom-tooltip {
          pointer-events: auto !important;
          user-select: text !important;
          background: #fff !important;
          border: 1px solid #d1d5db !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
          padding: 10px 12px !important;
          opacity: 1 !important;
          max-width: 320px !important;
        }
        .leaflet-tooltip-top.custom-tooltip::before { display: none !important; }
        .custom-popup .leaflet-popup-content { margin: 10px 12px !important; }
        .custom-popup .leaflet-popup-content-wrapper { border-radius: 4px !important; }
        .custom-popup .leaflet-popup-tip { background: #fff !important; }
        .copy-address-btn:disabled { cursor: default; opacity: 0.7; }
        .gu-label {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: #374151 !important;
          font-weight: 600 !important;
          text-shadow: 0 1px 2px rgba(255,255,255,0.8);
          text-align: center;
        }
        .gu-label .gu-name { font-size: 12px; display: block; }
        .gu-label .gu-count { font-size: 14px; line-height: 1.1; display: block; color: #1e40af; }
        .gu-label .gu-count.is-zero { color: #dc2626; }
      `}</style>

      {/* 위치 허용 확인 모달 */}
      <ConfirmModal
        isOpen={locationModal.isOpen}
        title="위치 정보 사용"
        message={`현재 위치를 출발지로 설정하시겠습니까?\n\n허용하면 내 위치에서 도서관까지의\n길찾기가 제공됩니다.`}
        type="info"
        confirmText="허용"
        cancelText="허용 안함"
        onConfirm={requestLocationAndOpenMap}
        onCancel={openMapWithoutLocation}
      />

      {/* 위치 로딩 오버레이 */}
      {locationLoading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000]">
          <div className="bg-white px-6 py-4 shadow-lg flex items-center gap-3">
            <Spinner className="w-5 h-5 text-sub-bg" />
            <span className="text-gray-700 font-medium">위치 확인 중...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default LibraryMapPage
