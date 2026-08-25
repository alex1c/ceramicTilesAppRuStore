# Sharing and reports — Tile

```
domain TileCalculationResult
  → presentTileResult
  → buildTileExportReport
  → ExportReport
  → formatExportTextReport / formatExportPdfHtml
  → ShareService
```

No recalculation in Share/PDF layers.  
Changing inputs clears both presented result and export report (stale-export protection).
