import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { fetchGuList, fetchLibraryData, checkLoan, searchBooks } from '../api/libraryApi'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function LibraryMapPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const isbn = searchParams.get('isbn') || ''
  const title = decodeURIComponent(searchParams.get('title') || searchParams.get('query') || '')
  const fallbackCover = 'https://via.placeholder.com/70x100?text=No+Image'

  const [guList, setGuList] = useState([])
  const [selectedGu, setSelectedGu] = useState('')
  const [libraryData, setLibraryData] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selectedBookImage, setSelectedBookImage] = useState('')
  const [selectedBookTitle, setSelectedBookTitle] = useState('')
  const [resolvedIsbn, setResolvedIsbn] = useState('')

  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerGroup = useRef(null)
  const latestDataRef = useRef({ isbn: '', libraryData: [], selectedGu: '' })
  const lastIsbnRef = useRef('')


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
    gu: '\uAD6C\uBA85',
    code: '\uB3C4\uC11C\uAD00\uCF54\uB4DC',
    lat: '\uC704\uB3C4',
    lng: '\uACBD\uB3C4',
    address: '\uB3C4\uB85C\uBA85\uC8FC\uC18C',
    addressFallback: '\uC8FC\uC18C',
    name: '\uB3C4\uC11C\uAD00\uBA85'
  }

  const normalizeImageUrl = (url) => {
    if (!url || url === 'undefined' || url === 'null') return ''
    return url
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
      value => typeof value === 'string' && value.includes('\uAD6C')
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


  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const [guData, libData] = await Promise.all([
          fetchGuList(),
          fetchLibraryData()
        ])
        setGuList(guData)
        setLibraryData(libData)
        if (guData.length > 0) {
          setSelectedGu(guData[0])
        }
      } catch (e) {
        console.error('데이터 로드 실패:', e)
      }
    }
    loadData()
  }, [])


  useEffect(() => {
    latestDataRef.current = { isbn: resolvedIsbn || isbn, libraryData, selectedGu }
  }, [resolvedIsbn, isbn, libraryData, selectedGu])

  useEffect(() => {
    setSelectedBookTitle(title || '')
  }, [title])

  useEffect(() => {
    if (!title || selectedBookImage) return
    let cancelled = false

    const loadImageByTitle = async () => {
      try {
        const data = await searchBooks(title)
        const docs = data.response?.docs || []
        const exact = docs.find(item => item.doc?.bookname === title) || docs[0]
        const doc = exact?.doc
        if (!cancelled && doc?.bookImageURL) {
          setSelectedBookImage(normalizeImageUrl(doc.bookImageURL))
        }
        if (!cancelled && !selectedBookTitle && doc?.bookname) {
          setSelectedBookTitle(doc.bookname)
        }
      } catch (e) {
        console.error(e)
      }
    }

    loadImageByTitle()
    return () => {
      cancelled = true
    }
  }, [title, selectedBookImage, selectedBookTitle])

  useEffect(() => {
    if (isbn) {
      setResolvedIsbn(isbn)
      return
    }
    if (!title) {
      setResolvedIsbn('')
      return
    }

    let cancelled = false

    const loadByTitle = async () => {
      try {
        const data = await searchBooks(title)
        const docs = data.response?.docs || []
        const exact = docs.find(item => item.doc?.bookname === title) || docs[0]
        const doc = exact?.doc
        const nextIsbn = doc?.isbn13 || doc?.isbn
        if (!cancelled && nextIsbn) {
          setResolvedIsbn(nextIsbn)
          if (doc?.bookImageURL) {
            setSelectedBookImage(normalizeImageUrl(doc.bookImageURL))
          }
          if (!title && doc?.bookname) {
            setSelectedBookTitle(doc.bookname)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }

    loadByTitle()
    return () => {
      cancelled = true
    }
  }, [isbn, title])

  useEffect(() => {
    if (!resolvedIsbn || resolvedIsbn === lastIsbnRef.current) return
    lastIsbnRef.current = resolvedIsbn

    const loadBookByIsbn = async () => {
      try {
        const data = await searchBooks(resolvedIsbn)
        const docs = data.response?.docs || []
        const exact = docs.find(item => item.doc?.isbn13 === resolvedIsbn) || docs[0]
        const doc = exact?.doc
        if (doc) {
          if (doc.bookImageURL) {
            setSelectedBookImage(normalizeImageUrl(doc.bookImageURL))
          }
          if (!title && doc.bookname) {
            setSelectedBookTitle(doc.bookname)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }

    loadBookByIsbn()
  }, [resolvedIsbn, title])

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, { maxZoom: 20 }).setView([37.5665, 126.9780], 11)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map)

    mapInstance.current = map
    markerGroup.current = L.layerGroup().addTo(map)

    fetch('https://raw.githubusercontent.com/southkorea/seoul-maps/master/kostat/2013/json/seoul_municipalities_geo_simple.json')
      .then(res => res.json())
      .then(data => {
        L.geoJson(data, {
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
            layer.on('click', () => {
              setSelectedGu(name)
              filterAndZoom(name)
            })
          }
        }).addTo(map)
      })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  const filterAndZoom = async (guOverride) => {
    const { isbn: currentIsbn, libraryData: currentLibraryData, selectedGu: currentGu } = latestDataRef.current
    const targetGu = guOverride || currentGu
    if (!targetGu || !currentIsbn) {
      if (!currentIsbn) {
        alert('Select a book first.')
      }
      return
    }

    setLoading(true)
    markerGroup.current?.clearLayers()
    const bounds = []

    const targets = currentLibraryData.filter(lib => lib[LIB_KEYS.gu] === targetGu)

    for (const lib of targets) {
      try {
        const codeKey = Object.keys(lib).find(k => k.replace(/\s/g, '').includes(LIB_KEYS.code))
        const libCode = lib[codeKey]

        const data = await checkLoan(libCode, currentIsbn)

        const isAvailable =
          (data.response?.result?.loanAvailable === 'Y') ||
          (data.status === 'Y')

        if (isAvailable) {
          const lat = parseFloat(lib[LIB_KEYS.lat])
          const lng = parseFloat(lib[LIB_KEYS.lng])

          const marker = L.circleMarker([lat, lng], {
            radius: 9,
            color: 'black',
            fillColor: '#FF7043',
            fillOpacity: 0.8,
            weight: 2
          }).addTo(markerGroup.current)

          const address = lib[LIB_KEYS.address] || lib[LIB_KEYS.addressFallback]
          const tooltipContent = `
            <div style="min-width: 180px; position: relative;">
              <span style="color: #0050b3; font-size: 14px; font-weight: bold;">${lib[LIB_KEYS.name]}</span><br>
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 5px;">
                <span style="font-size: 11px; color: #555;">${address}</span>
              </div>
            </div>
          `

          marker.bindTooltip(tooltipContent, {
            direction: 'top',
            sticky: false,
            interactive: true,
            offset: [0, -10],
            className: 'custom-tooltip'
          })

          bounds.push([lat, lng])
        }
      } catch (e) {
        console.error('대출 확인 실패:', e)
      }
    }

    if (bounds.length > 0) {
      mapInstance.current?.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    } else {
      alert('대출 가능한 도서관이 없습니다.')
    }

    setLoading(false)
  }


  const runSearch = async (value) => {
    const trimmed = value.trim()
    if (!trimmed) {
      alert('검색어를 입력해주세요')
      return
    }

    setSearchLoading(true)
    setSearchError('')
    setSearchResults([])

    try {
      const data = await searchBooks(trimmed)
      const bookList = data.response?.docs || []
      if (bookList.length === 0) {
        setSearchError('검색 결과가 없습니다.')
      } else {
        setSearchResults(bookList)
      }
    } catch (e) {
      console.error(e)
      setSearchError('도서 검색 중 문제가 발생했습니다.')
    } finally {
      setSearchLoading(false)
    }
  }

  const toggleSearch = () => {
    if (!showSearch && !searchQuery && title) {
      setSearchQuery(title)
    }
    setShowSearch(prev => !prev)
  }

  const handleSearchKeyUp = (e) => {
    if (e.key === 'Enter') {
      runSearch(searchQuery)
    }
  }

  const selectBook = (nextIsbn, nextTitle, nextImage) => {
    if (!nextIsbn || nextIsbn === 'undefined') {
      alert('ISBN 정보가 없는 도서입니다.')
      return
    }
    setSelectedBookImage(normalizeImageUrl(nextImage))
    setSelectedBookTitle(nextTitle || '')
    navigate(`/library/map?isbn=${nextIsbn}&title=${encodeURIComponent(nextTitle)}`)
    setShowSearch(false)
  }

  return (
    <div className="flex h-screen">
      {/* 사이드바 */}
      <div className="w-80 p-5 bg-white border-r border-gray-200 z-10 overflow-y-auto">
        {(selectedBookTitle || title) && (
                  <div className="mt-4">
                    <div className="text-sm font-bold text-gray-800 mb-2">선택한 책</div>
                    <div className="flex items-center gap-3">
                      <img
                        src={normalizeImageUrl(selectedBookImage) || fallbackCover}
                        alt="book cover"
                        className="h-24 w-16 rounded-lg border border-gray-300 object-cover bg-gray-100 flex-shrink-0"
                      />
                      <div className="text-sm text-gray-700">
                        {selectedBookTitle || title}
                      </div>
                    </div>
                  </div>
                )}
        <button
                  onClick={toggleSearch}
                  className="w-full py-3 bg-gray-500 text-white rounded-lg font-bold mt-4 hover:bg-gray-600 transition"
                >
                  {showSearch ? '\uAC80\uC0C9 \uB2EB\uAE30' : '\uB2E4\uB978 \uCC45 \uAC80\uC0C9\uD558\uAE30'}
                </button>

                {showSearch && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-xl">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyUp={handleSearchKeyUp}
                      placeholder="도서명 또는 ISBN을 입력하세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                    <button
                      onClick={() => runSearch(searchQuery)}
                      disabled={searchLoading}
                      className="w-full mt-3 py-2 bg-gray-800 text-white rounded-lg text-sm font-bold hover:bg-gray-700 transition disabled:bg-gray-400"
                    >
                      {searchLoading ? '검색 중...' : '도서 검색하기'}
                    </button>

                    {searchError && (
                      <p className="text-center text-red-500 text-xs mt-3">{searchError}</p>
                    )}

                    <div className="max-h-72 overflow-y-auto space-y-3 mt-3">
                      {searchResults.map((item, index) => {
                        const book = item.doc
                        return (
                          <div
                            key={index}
                            className="flex items-start p-3 border border-gray-200 rounded-lg bg-white"
                          >
                            <img
                              src={book.bookImageURL || fallbackCover}
                              alt="표지"
                              className="w-12 h-16 rounded object-cover border border-gray-200 mr-3 flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 text-xs leading-tight mb-1">
                                {book.bookname}
                              </div>
                              <div className="text-[11px] text-gray-500 mb-1">
                                {book.authors}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                ISBN: {book.isbn13}
                              </div>
                              <button
                                onClick={() => selectBook(book.isbn13, book.bookname, book.bookImageURL)}
                                className="mt-2 px-2 py-1 bg-pink-300 text-white rounded text-[11px] font-bold hover:bg-pink-400 transition"
                              >
                                이 책으로 변경
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
        <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="font-bold text-sm">지역(구) 선택</label>
                  <select
                    value={selectedGu}
                    onChange={(e) => setSelectedGu(e.target.value)}
                    className="w-full mt-2 p-3 border border-gray-300 rounded-lg"
                  >
                    {guList.map((gu, index) => (
                      <option key={index} value={gu}>{gu}</option>
                    ))}
                  </select>
                  <button
                    onClick={filterAndZoom}
                    disabled={loading}
                    className="w-full mt-3 py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 transition disabled:bg-gray-400"
                  >
                    {loading ? '확인 중...' : '대출 가능 도서관 찾기'}
                  </button>
                </div>
        {loading && (
                  <div className="mt-4 text-center text-red-400 font-bold">
                    대출 가능 여부 확인 중...
                  </div>
                )}








        

        

        

        
      </div>

      {/* 지도 */}
      <div ref={mapRef} className="flex-1" />

      {/* 커스텀 툴팁 스타일 */}
      <style>{`
        .custom-tooltip {
          pointer-events: auto !important;
          user-select: text !important;
          background-color: white !important;
          border: 1px solid #aaa !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          padding: 12px !important;
          opacity: 1 !important;
          white-space: normal !important;
        }
        .leaflet-tooltip-top.custom-tooltip::before {
          display: none !important;
        }
        .gu-label {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: #1f2937 !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          text-shadow: 0 1px 2px rgba(255,255,255,0.8);
        }
      `}</style>
    </div>
  )
}

export default LibraryMapPage
