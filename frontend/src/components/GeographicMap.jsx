import { useEffect, useRef, useState } from 'react'

const INDIA_VIEW = [22.6, 79.7]
const CACHE_KEY = 'healthcore-geocoded-locations'

function getCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}') } catch { return {} }
}

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char])

export default function GeographicMap({ locations = [], states = [], compact = false, userLocation = null, nearbyPlaces = [], assistantMode = false }) {
  const elementRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const [unmatched, setUnmatched] = useState(0)
  const rankedCities = [...locations].sort((a, b) => b.count - a.count)
  const rankedStates = [...states].sort((a, b) => b.count - a.count)
  const highestCity = rankedCities[0]
  const lowestCity = rankedCities[rankedCities.length - 1]
  const highestState = rankedStates[0]

  useEffect(() => {
    const L = window.L
    if (!L || mapRef.current || !elementRef.current) return
    const map = L.map(elementRef.current, { zoomControl: false, scrollWheelZoom: false, attributionControl: false })
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map)
    map.setView(INDIA_VIEW, 4.5)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const L = window.L
    const map = mapRef.current
    if (!L || !map) return
    const controller = new AbortController()
    const cache = getCache()
    const unique = Array.from(new Map(locations.filter(item => item.city && item.state).map(item => [`${item.city}, ${item.state}`, item])).values())

    async function renderMarkers() {
      if (layerRef.current) layerRef.current.remove()
      const layer = L.layerGroup().addTo(map)
      layerRef.current = layer
      const resolved = []
      let misses = 0

      for (const location of unique) {
        const key = `${location.city}, ${location.state}`
        let point = cache[key]
        if (!point) {
          try {
            const query = encodeURIComponent(`${location.city}, ${location.state}, India`)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${query}`, { signal: controller.signal })
            const result = await response.json()
            if (result[0]) {
              point = [Number(result[0].lat), Number(result[0].lon)]
              cache[key] = point
              sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache))
            }
          } catch (error) {
            if (error.name === 'AbortError') return
          }
        }
        if (!point) { misses += 1; continue }
        resolved.push({ ...location, point })
      }

      setUnmatched(misses)
      const max = Math.max(...resolved.map(item => item.count), 1)
      resolved.forEach(item => {
        const intensity = item.count / max
        const marker = L.circleMarker(item.point, {
          radius: 6 + intensity * 12,
          color: '#ffffff', weight: 2,
          fillColor: intensity > .66 ? '#ee5d93' : intensity > .33 ? '#9a83d6' : '#5a9ed8',
          fillOpacity: .84,
        }).addTo(layer)
        marker.bindTooltip(`<strong>${item.city}</strong><br/>${item.state} · ${item.count.toLocaleString()} patients`, { direction: 'top', offset: [0, -8], opacity: .96 })
        marker.bindPopup(`<strong>${item.city}, ${item.state}</strong><br/>${item.count.toLocaleString()} patients`)
      })
      const boundsPoints = resolved.map(item => item.point)
      if (userLocation) {
        const point = [userLocation.latitude, userLocation.longitude]
        L.circleMarker(point, { radius: 8, color: '#fff', weight: 2, fillColor: '#38a9d5', fillOpacity: 1 }).addTo(layer).bindTooltip('Your approximate location', { direction: 'top' }).bindPopup('<strong>Your approximate location</strong>')
        boundsPoints.push(point)
      }
      nearbyPlaces.forEach(place => {
        const point = [place.latitude, place.longitude]
        const directionUrl = userLocation ? `https://www.openstreetmap.org/directions?from=${userLocation.latitude},${userLocation.longitude}&to=${place.latitude},${place.longitude}` : `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=16/${place.latitude}/${place.longitude}`
        const details = [place.area, place.distance_km != null ? `${place.distance_km} km away` : null].filter(Boolean).map(escapeHtml).join('<br/>')
        L.circleMarker(point, { radius: 8, color: '#fff', weight: 2, fillColor: '#45a282', fillOpacity: .95 }).addTo(layer)
          .bindTooltip(`<strong>${escapeHtml(place.name)}</strong><br/>Nearby hospital`, { direction: 'top' })
          .bindPopup(`<strong>${escapeHtml(place.name)}</strong><br/>${details}<br/><a href="${directionUrl}" target="_blank" rel="noreferrer">Directions</a>`)
        boundsPoints.push(point)
      })
      if (boundsPoints.length) map.fitBounds(L.latLngBounds(boundsPoints), { padding: [24, 24], maxZoom: assistantMode ? 14 : 6 })
      else map.setView(INDIA_VIEW, 4.5)
    }

    renderMarkers()
    return () => controller.abort()
  }, [locations, userLocation, nearbyPlaces, assistantMode])

  return (
    <div className={`geo-map-wrap${compact ? ' geo-map-compact' : ''}${assistantMode ? ' geo-map-assistant' : ''}`}>
      <div ref={elementRef} className="geo-map" aria-label={assistantMode ? 'Nearby hospitals map' : 'Patient demand map'} />
      <div className="geo-map-legend" aria-label="Patient demand intensity legend">
        {assistantMode ? <><span>Map markers</span><i className="geo-user" /> You <i className="geo-hospital" /> Hospital</> : <><span>Patient demand</span><i className="geo-low" /> Low <i className="geo-mid" /> Medium <i className="geo-high" /> High</>}
      </div>
      {unmatched > 0 && <div className="geo-map-note">{unmatched} unmatched location{unmatched === 1 ? '' : 's'} not shown</div>}
      {!compact && highestCity && <div className="geo-map-summary"><strong>Highest demand:</strong> {highestCity.city} ({highestCity.count.toLocaleString()}){highestState && <><span>·</span><strong>Leading state:</strong> {highestState.state} ({highestState.count.toLocaleString()})</>}{lowestCity && lowestCity !== highestCity && <><span>·</span><strong>Lowest displayed city:</strong> {lowestCity.city} ({lowestCity.count.toLocaleString()})</>}</div>}
    </div>
  )
}
