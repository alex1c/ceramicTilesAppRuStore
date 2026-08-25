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
			orientationTitle: string
			orientationEconomical: string
			orientationHint: string
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
			/** Accusative (Нужно / Купить): плитку / упаковку */
			boxUnitOne: string
			boxUnitFew: string
			boxUnitMany: string
			tileUnitOne: string
			tileUnitFew: string
			tileUnitMany: string
			/** Nominative (Итого / По раскладке): плитка / упаковка */
			tileNomOne: string
			tileNomFew: string
			tileNomMany: string
			boxNomOne: string
			boxNomFew: string
			boxNomMany: string
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
			layoutBase: string
			areaBase: string
			reserveAdded: string
			totalTiles: string
			pricePrincipleTile: string
			pricePrincipleBox: string
			pricePrincipleM2Purchased: string
			pricePrincipleM2Required: string
			schemeTitle: string
			schemeEstimateNote: string
			schemeOpeningsNote: string
			schemePanelFloor: string
			schemePanelWall: string
			schemeLabelFloor: string
			schemeLabelWall: string
			schemeLegendFull: string
			schemeLegendCut: string
		}
		share: {
			button: string
			sheetTitle: string
			textAction: string
			textActionHint: string
			pdfAction: string
			pdfActionHint: string
			cancel: string
			reportTitle: string
			footer: string
			sections: {
				surface: string
				tile: string
				result: string
				note: string
			}
			status: {
				generatingPdf: string
			}
			errors: {
				generic: string
				unavailable: string
				pdfFailed: string
			}
		}
		explanation: {
			toggleLabel: string
			toggleHintCollapsed: string
			toggleHintExpanded: string
			noFakePrecision: string
			noFakePrecisionLayout: string
			noFakePrecisionEstimate: string
			surfaceTitle: string
			surfaceFloor: string
			surfaceWalls: string
			openingsTitle: string
			openingsBody: string
			openingsEstimateNote: string
			tileTitle: string
			tileBody: string
			layoutTitle: string
			layoutBody: string
			layoutReuseBody: string
			rawTitle: string
			rawBody: string
			estimateTitle: string
			estimateBody: string
			reserveTitle: string
			reserveBody: string
			reserveBodyLayout: string
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
