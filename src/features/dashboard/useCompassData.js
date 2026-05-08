import { useQuery } from '@tanstack/react-query'

async function fetchCompassData() {
  const res = await fetch('/data/compass-data.json')
  if (!res.ok) throw new Error('Failed to load dashboard data')
  return res.json()
}

export function useCompassData() {
  return useQuery({
    queryKey: ['compass-data'],
    queryFn: fetchCompassData,
  })
}
