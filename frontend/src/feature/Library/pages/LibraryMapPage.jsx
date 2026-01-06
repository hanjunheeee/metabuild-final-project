import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { fetchGuList, fetchLibraryData, checkLoan } from '../api/libraryApi'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function LibraryMapPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const isbn = searchParams.get('isbn') || ''
  const title = decodeURIComponent(searchParams.get('title') || '')

  const [guList, setGuList] = useState([])
  const [selectedGu, setSelectedGu] = useState('')
  const [libraryData, setLibraryData] = useState([])
  const [loading, setLoading] = useState(false)
  
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerGroup = useRef(null)

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

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Leaflet 지도 생성
    const map = L.map(mapRef.current, { maxZoom: 20 }).setView([37.5665, 126.9780], 11)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map)
    
    mapInstance.current = map
    markerGroup.current = L.layerGroup().addTo(map)

    // 서울 경계선 로드
    fetch('https://raw.githubusercontent.com/southkorea/seoul-maps/master/kostat/2013/json/seoul_municipalities_geo_simple.json')
      .then(res => res.json())
      .then(data => {
        L.geoJson(data, {
          style: {
            fillColor: '#2C3E50',
            color: '#ffffff',
            weight: 1.5,
            fillOpacity: 0.15
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

  // 대출 가능 도서관 찾기
  const filterAndZoom = async () => {
    if (!selectedGu || !isbn) return
    
    setLoading(true)
    markerGroup.current?.clearLayers()
    const bounds = []

    const targets = libraryData.filter(lib => lib['구명'] === selectedGu)

    for (const lib of targets) {
      try {
        // 도서관코드 컬럼명 찾기 (공백 대응)
        const codeKey = Object.keys(lib).find(k => k.replace(/\s/g, '').includes('도서관코드'))
        const libCode = lib[codeKey]

        const data = await checkLoan(libCode, isbn)

        // 대출 가능 여부 확인
        const isAvailable = 
          (data.response?.result?.loanAvailable === 'Y') || 
          (data.status === 'Y')

        if (isAvailable) {
          const lat = parseFloat(lib['위도'])
          const lng = parseFloat(lib['경도'])

          const marker = L.circleMarker([lat, lng], {
            radius: 9,
            color: 'black',
            fillColor: '#FF7043',
            fillOpacity: 0.8,
            weight: 2
          }).addTo(markerGroup.current)

          const address = lib['도로명주소'] || lib['주소']
          const tooltipContent = `
            <div style="min-width: 180px; position: relative;">
              <span style="color: #0050b3; font-size: 14px; font-weight: bold;">${lib['도서관명']}</span><br>
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

  return (
    <div className="flex h-screen">
      {/* 사이드바 */}
      <div className="w-80 p-5 bg-white border-r border-gray-200 z-10 overflow-y-auto">
        <button
          onClick={() => navigate('/library/search')}
          className="w-full py-3 bg-gray-500 text-white rounded-lg font-bold mb-4 hover:bg-gray-600 transition"
        >
          ← 다른 책 검색하기
        </button>

        <h2 className="text-lg font-bold mb-4">
          📖 {title || '도서 제목'}
        </h2>

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
            ⚡ 실시간 상태 확인 중...
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
      `}</style>
    </div>
  )
}

export default LibraryMapPage

