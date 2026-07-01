# Double-click edit dialog — price_range

## Parent

[PRD: Double-click drawing to edit exact price](../PRD-double-click-edit-price.md)

## What to build

Extend the double-click-to-edit dialog to support the `price_range` drawing type. A price range has two independent price points; the dialog shows two labeled inputs ("Point 1 price" and "Point 2 price") pre-filled with the current values. Either or both can be changed before confirming.

The dialog component and `subscribeDblClick` infrastructure already exist from issue #0007. This slice adds the two-input variant and wires up the `price_range` drawing type.

## Acceptance criteria

- [ ] Double-clicking a price range band while in cursor mode opens the edit dialog
- [ ] The dialog title reads "Price Range"
- [ ] Two inputs are shown: "Point 1 price" and "Point 2 price", each pre-filled with the corresponding current price
- [ ] Both inputs are independently editable — changing one does not affect the other
- [ ] Clicking Ok or pressing Enter applies both prices and closes the dialog
- [ ] Clicking Cancel or pressing Escape closes the dialog without changing the drawing
- [ ] Any finite numeric value is accepted for each input (no clamping, no top > bottom validation)
- [ ] The band visually repositions to the new prices immediately after confirm
- [ ] The updated prices persist across page reloads

## Blocked by

- [#0007 Double-click edit dialog — horizontal_ray](./0007-double-click-edit-horizontal-ray.md)
- [#0004 PriceRange tool](./0004-price-range.md)
