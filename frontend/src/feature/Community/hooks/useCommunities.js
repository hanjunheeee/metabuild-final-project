import { useState, useEffect, useCallback } from 'react'
import { fetchCommunities } from '../api/communityApi'

function useCommunities() {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadCommunities = useCallback(() => {
    setLoading(true)
    fetchCommunities()
      .then(data => {
        setCommunities(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error:', err)
        setError(err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadCommunities()
  }, [loadCommunities])

  // 목록 새로고침 함수
  const refetch = useCallback(() => {
    loadCommunities()
  }, [loadCommunities])

  return { communities, loading, error, refetch }
}

export default useCommunities

