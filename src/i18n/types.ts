/**
 * Shape of the translation catalog — values are strings, not locale-specific literals.
 */
export interface TranslationTree {
	app: {
		title: string
		subtitle: string
	}
	calculator: {
		intro: string
		calculate: string
		surface: {
			title: string
			floor: string
			walls: string
			length: string
			width: string
			height: string
			wallTitle: string
			addWall: string
			removeWall: string
		}
		openings: {
			title: string
			addDoor: string
			addWindow: string
			addOther: string
			door: string
			window: string
			other: string
			remove: string
			empty: string
		}
		tile: {
			title: string
			presets: string
			custom: string
			width: string
			height: string
		}
		layout: {
			title: string
			straight: string
			diagonal: string
			offsetHalf: string
			offsetThird: string
			reserveHint: string
		}
		reserve: {
			title: string
			custom: string
			percent: string
		}
		packaging: {
			title: string
			enable: string
			tilesPerBox: string
			areaPerBox: string
			tilesCount: string
			boxArea: string
			otherCount: string
		}
		price: {
			title: string
			enable: string
			perTile: string
			perBox: string
			perM2: string
			amount: string
			boxRequiresPackaging: string
		}
		units: {
			meters: string
			centimeters: string
			squareMeters: string
			percent: string
			currency: string
		}
		result: {
			buyBoxes: string
			needTiles: string
			boxUnitOne: string
			boxUnitFew: string
			boxUnitMany: string
			tileUnitOne: string
			tileUnitFew: string
			tileUnitMany: string
			requiredTiles: string
			inBoxTiles: string
			inBoxArea: string
			purchasedTiles: string
			purchasedArea: string
			remainingTiles: string
			remainingArea: string
			surfaceArea: string
			tileArea: string
			reserve: string
			requiredArea: string
			cost: string
			pricePrincipleTile: string
			pricePrincipleBox: string
			pricePrincipleM2Purchased: string
			pricePrincipleM2Required: string
		}
		explanation: {
			toggleLabel: string
			toggleHintCollapsed: string
			toggleHintExpanded: string
			noFakePrecision: string
			surfaceTitle: string
			surfaceFloor: string
			surfaceWalls: string
			openingsTitle: string
			openingsBody: string
			tileTitle: string
			tileBody: string
			rawTitle: string
			rawBody: string
			reserveTitle: string
			reserveBody: string
			packagingTitle: string
			packagingTiles: string
			packagingArea: string
			purchaseTitle: string
			purchaseTiles: string
			purchaseArea: string
		}
		errors: {
			field: {
				empty: string
				invalidFormat: string
				notPositive: string
				notFinite: string
				negative: string
				tooLarge: string
			}
			domain: {
				invalidDimension: string
				invalidTileSize: string
				invalidReserve: string
				openingsExceedWalls: string
				invalidPackaging: string
				invalidPrice: string
				priceBoxRequiresPackaging: string
				notFinite: string
				generic: string
			}
		}
	}
	common: {
		optional: string
	}
}
