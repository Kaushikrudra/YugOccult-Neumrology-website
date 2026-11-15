import { useState, useEffect } from 'react'

let cachedHasReports: boolean | null = null
let fetchPromise: Promise<boolean> | null = null

export function invalidateReportsCache() {
  cachedHasReports = null
  fetchPromise = null
}

export function useHasReports(): { hasReports: boolean; loading: boolean } {
  const [hasReports, setHasReports] = useState<boolean>(cachedHasReports ?? false)
  const [loading, setLoading] = useState<boolean>(cachedHasReports === null)

  useEffect(() => {
    let isMounted = true

    if (cachedHasReports !== null) {
      setHasReports(cachedHasReports)
      setLoading(false)
      return
    }

    if (!fetchPromise) {
      fetchPromise = fetch('/api/reports')
        .then((res) => (res.ok ? res.json() : { reports: [] }))
        .then((data) => {
          const exists = Boolean(Array.isArray(data?.reports) && data.reports.length > 0)
          cachedHasReports = exists
          return exists
        })
        .catch(() => {
          cachedHasReports = false
          return false
        })
    }

    fetchPromise.then((exists) => {
      if (isMounted) {
        setHasReports(exists)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return { hasReports, loading }
}
