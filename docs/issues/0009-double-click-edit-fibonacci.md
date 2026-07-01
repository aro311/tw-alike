# Double-click edit dialog — fibonacci

## Parent

[PRD: Double-click drawing to edit exact price](../PRD-double-click-edit-price.md)

## What to build

Extend the double-click-to-edit dialog to support the `fibonacci` drawing type. A fibonacci drawing has two price points (high anchor and low anchor) that define the retracement grid; the dialog shows two labeled inputs ("Point 1 price" and "Point 2 price") pre-filled with the current anchor values. Editing either point causes the full grid to recompute to the new anchors on confirm.

The dialog component and `subscribeDblClick` infrastructure already exist from issue #0007. This slice reuses the two-input variant (same shape as price_range) and wires up the `fibonacci` drawing type.

## Acceptance criteria

- [ ] Double-clicking a fibonacci drawing while in cursor mode opens the edit dialog
- [ ] The dialog title reads "Fibonacci"
- [ ] Two inputs are shown: "Point 1 price" and "Point 2 price", each pre-filled with the corresponding current anchor price
- [ ] Both inputs are independently editable
- [ ] Clicking Ok or pressing Enter applies both anchor prices and closes the dialog
- [ ] Clicking Cancel or pressing Escape closes the dialog without changing the drawing
- [ ] Any finite numeric value is accepted for each input
- [ ] The fibonacci grid visually recomputes and repositions to the new anchors immediately after confirm
- [ ] The updated prices persist across page reloads

## Blocked by

- [#0007 Double-click edit dialog — horizontal_ray](./0007-double-click-edit-horizontal-ray.md)
- [#0003 Fibonacci retracement tool](./0003-fibonacci.md)
