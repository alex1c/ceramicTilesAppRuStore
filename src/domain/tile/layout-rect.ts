import { ceilPhysicalCount } from './math'

/**
 * One-dimensional edge yield: how many identical pieces fit along a tile edge.
 * Example: tile 100 mm, piece 50 mm → 2; tile 600 mm, piece 400 mm → 1.
 */
export function piecesPerSourceTile(
	tileDimensionMm: number,
	pieceDimensionMm: number,
): number {
	if (pieceDimensionMm <= 0 || tileDimensionMm <= 0) {
		return 0
	}

	return Math.floor(tileDimensionMm / pieceDimensionMm)
}

export function sourceTilesForIdenticalPieces(
	requiredPieces: number,
	piecesPerTile: number,
): number {
	if (requiredPieces <= 0) {
		return 0
	}

	if (piecesPerTile <= 0) {
		return requiredPieces
	}

	return ceilPhysicalCount(requiredPieces / piecesPerTile)
}

export interface RectLayoutInput {
	/** Surface axis treated as horizontal in the scheme (width / room length). */
	surfaceWidthMm: number
	/** Surface axis treated as vertical in the scheme (height / room width). */
	surfaceHeightMm: number
	/** Tile extent along surface width for this orientation. */
	tileWidthMm: number
	/** Tile extent along surface height for this orientation. */
	tileHeightMm: number
}

/**
 * Edge strip description for explanation and visualization.
 * Dimensions are the cut piece size, not the source tile.
 */
export interface EdgeStripLayout {
	axis: 'vertical' | 'horizontal'
	pieceWidthMm: number
	pieceHeightMm: number
	pieceCount: number
	piecesPerSourceTile: number
	sourceTileCount: number
}

export interface RectLayoutResult {
	surfaceWidthMm: number
	surfaceHeightMm: number
	tileWidthMm: number
	tileHeightMm: number
	fullColumns: number
	fullRows: number
	remainderWidthMm: number
	remainderHeightMm: number
	fullTileCount: number
	verticalEdge: EdgeStripLayout | null
	horizontalEdge: EdgeStripLayout | null
	/** Conservative +1 when both remainders exist (Phase 3B corner policy). */
	cornerSourceTiles: number
	cornerPieceWidthMm: number
	cornerPieceHeightMm: number
	baseLayoutTileCount: number
}

/**
 * Straight rectangular layout with 1D edge reuse and conservative corner policy.
 * Does not model openings or diagonal/offset patterns.
 */
export function calculateRectLayout(input: RectLayoutInput): RectLayoutResult {
	const {
		surfaceWidthMm,
		surfaceHeightMm,
		tileWidthMm,
		tileHeightMm,
	} = input

	if (
		surfaceWidthMm <= 0 ||
		surfaceHeightMm <= 0 ||
		tileWidthMm <= 0 ||
		tileHeightMm <= 0
	) {
		return emptyLayout(input)
	}

	const fullColumns = Math.floor(surfaceWidthMm / tileWidthMm)
	const fullRows = Math.floor(surfaceHeightMm / tileHeightMm)
	const remainderWidthMm = surfaceWidthMm - fullColumns * tileWidthMm
	const remainderHeightMm = surfaceHeightMm - fullRows * tileHeightMm
	const fullTileCount = fullColumns * fullRows
	const bothRemainders = remainderWidthMm > 0 && remainderHeightMm > 0

	/*
	 * Surface smaller than one tile in both axes → a single cut piece / corner.
	 * Avoid inventing zero-count edge strips.
	 */
	if (fullColumns === 0 && fullRows === 0) {
		return {
			surfaceWidthMm,
			surfaceHeightMm,
			tileWidthMm,
			tileHeightMm,
			fullColumns: 0,
			fullRows: 0,
			remainderWidthMm,
			remainderHeightMm,
			fullTileCount: 0,
			verticalEdge: null,
			horizontalEdge: null,
			cornerSourceTiles: 1,
			cornerPieceWidthMm: remainderWidthMm,
			cornerPieceHeightMm: remainderHeightMm,
			baseLayoutTileCount: 1,
		}
	}

	let verticalEdge: EdgeStripLayout | null = null
	if (remainderWidthMm > 0 && fullRows > 0) {
		const perTile = piecesPerSourceTile(tileWidthMm, remainderWidthMm)
		verticalEdge = {
			axis: 'vertical',
			pieceWidthMm: remainderWidthMm,
			pieceHeightMm: tileHeightMm,
			pieceCount: fullRows,
			piecesPerSourceTile: perTile,
			sourceTileCount: sourceTilesForIdenticalPieces(fullRows, perTile),
		}
	}

	let horizontalEdge: EdgeStripLayout | null = null
	if (remainderHeightMm > 0 && fullColumns > 0) {
		const perTile = piecesPerSourceTile(tileHeightMm, remainderHeightMm)
		horizontalEdge = {
			axis: 'horizontal',
			pieceWidthMm: tileWidthMm,
			pieceHeightMm: remainderHeightMm,
			pieceCount: fullColumns,
			piecesPerSourceTile: perTile,
			sourceTileCount: sourceTilesForIdenticalPieces(fullColumns, perTile),
		}
	}

	const cornerSourceTiles = bothRemainders ? 1 : 0
	const baseLayoutTileCount =
		fullTileCount +
		(verticalEdge?.sourceTileCount ?? 0) +
		(horizontalEdge?.sourceTileCount ?? 0) +
		cornerSourceTiles

	return {
		surfaceWidthMm,
		surfaceHeightMm,
		tileWidthMm,
		tileHeightMm,
		fullColumns,
		fullRows,
		remainderWidthMm,
		remainderHeightMm,
		fullTileCount,
		verticalEdge,
		horizontalEdge,
		cornerSourceTiles,
		cornerPieceWidthMm: bothRemainders ? remainderWidthMm : 0,
		cornerPieceHeightMm: bothRemainders ? remainderHeightMm : 0,
		baseLayoutTileCount: Math.max(1, baseLayoutTileCount),
	}
}

function emptyLayout(input: RectLayoutInput): RectLayoutResult {
	return {
		surfaceWidthMm: input.surfaceWidthMm,
		surfaceHeightMm: input.surfaceHeightMm,
		tileWidthMm: input.tileWidthMm,
		tileHeightMm: input.tileHeightMm,
		fullColumns: 0,
		fullRows: 0,
		remainderWidthMm: 0,
		remainderHeightMm: 0,
		fullTileCount: 0,
		verticalEdge: null,
		horizontalEdge: null,
		cornerSourceTiles: 0,
		cornerPieceWidthMm: 0,
		cornerPieceHeightMm: 0,
		baseLayoutTileCount: 0,
	}
}
