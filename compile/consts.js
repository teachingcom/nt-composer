
export const ASSET_TYPES = [
	'nametags',
	'trails',
	'cars',
	'nitros',
	'fanfare',
	'doodads'
]

export const HASHED_ASSET_TYPES = [
	...ASSET_TYPES,
	'nametag',
	'trail',
	'car',
	'nitro',
]
// remove unwanted hashed types
.filter(key => {
	return !['doodads', 'doodad'].includes(key)
})

export const SPECIAL_CATEGORIES = [
	'doodads'
]

export const ASSET_TYPE_SOURCES = { 
	trail: 'trails', 
	cars: 'cars', 
	fanfare: 'fanfare', 
	nametags: 'nametags', 
	nitros: 'nitros',
	doodads: 'doodads',
}

// need to rename some paths to match
// item types in the game
export function normalizeAssetTypeName(type) {
    return type.replace(/^trails/, 'trail')
      .replace(/^nitros/, 'nitros')
      .replace(/^nametags/, 'nametags')
      .replace(/^fanfares/, 'fanfare')
      .replace(/^doodads/, 'doodad')
}

export function normalizePublicKeyName(name) {
	return name.replace(/namecards/, 'nametag')
		.replace(/nametags/, 'nametag')
		.replace(/nitros/, 'nitro')
		.replace(/doodads/, 'doodad')
}