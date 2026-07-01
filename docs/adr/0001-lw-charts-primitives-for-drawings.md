# Use LWC IPanePrimitive for Drawing rendering

Drawings are rendered as TradingView Lightweight Charts pane primitives (`IPanePrimitive`) attached to the main candlestick series, rather than as an absolutely-positioned canvas or SVG overlay on top of the chart DOM element.

The alternative — an overlay `<canvas>` element — is simpler to set up but requires manually mapping pixel↔price/time coordinates on every scroll, zoom, and resize event. Primitives receive a `CanvasRenderingTarget2D` already transformed to chart coordinate space, so the rendering code works directly in price/time units and survives zoom/scroll automatically. The trade-off is a more complex API with sparse documentation.

## Considered Options

- **Canvas overlay**: Straightforward canvas API, full control, but manual coordinate sync on every viewport change.
- **SVG overlay**: Same coordinate-sync burden as canvas, worse performance for freehand brush paths.
- **LWC series tricks** (e.g. LineSeries per drawing): Only works for line-shaped drawings; can't represent Brush or filled bands.
