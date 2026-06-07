// Real Compass Minerals (Ogden site) photos, compressed for web.
// Imported as bundled assets (so they inline in the single-file preview build).
const photoUrls = import.meta.glob('../assets/departments/*.jpg', { eager: true, query: '?url', import: 'default' })
const img = (name) => photoUrls[`../assets/departments/${name}.jpg`] || ''

// A representative photo for each staffed department. Some are approximate —
// the site only provided haul, loader, and salt-plant imagery.
export const DEPARTMENT_PHOTOS = {
  'Haul Driver':   img('outside-haul-truck'),
  'Haul Operator': img('inside-haul-truck'),
  'Harvest / HEO': img('inside-loader'),
  'Salt Plant':    img('salt-plant-line-1'),
  'Mag Plant':     img('salt-plant-line-3'),
  'Fueler':        img('outside-loader'),
  'Maintenance':   img('salt-plant-line-5'),
  'SOP Plant':     img('salt-building'),
}

export const DEFAULT_DEPARTMENT_PHOTO = img('salt-building')

// Full site gallery (caption + file).
export const SITE_PHOTOS = [
  { src: img('outside-haul-truck'), caption: 'Haul truck — exterior' },
  { src: img('inside-haul-truck'),  caption: 'Haul truck — cab' },
  { src: img('inside-loader'),      caption: 'Loader — cab' },
  { src: img('outside-loader'),     caption: 'Loader — exterior' },
  { src: img('salt-plant-line-1'),  caption: 'Salt Plant — Line 1' },
  { src: img('salt-plant-line-3'),  caption: 'Salt Plant — Line 3' },
  { src: img('salt-plant-line-5'),  caption: 'Salt Plant — Line 5' },
  { src: img('salt-building'),      caption: 'Salt building' },
  { src: img('salt-admin-door'),    caption: 'Salt Plant — admin entrance' },
]
