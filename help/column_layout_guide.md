# Technical Guide: Column Arrangement & Grid Layouts in Customer 360

This document explains how the column arrangement and spacing are managed in the modal detail views of the Customer 360 dashboard (such as Customer Info, Holdings, or Cards).

---

## 1. The Grid Container (.detail-fields-grid)
The layout for listing key-value fields inside the modal detail blocks uses CSS Grid. 

### A. General Modal Views (e.g., script.js)
* **Configuration:** Defined in style.css under the `.detail-fields-grid` class.
* **Columns:** Set to a 3-column layout.
* **CSS Definition:**
  ```css
  .detail-fields-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-flow: dense;
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }
  ```

### B. Holdings Module (holding.js)
* **Configuration:** Customized inline in holding.js to fit the two-panel explorer layout.
* **Columns:** Set to a 2-column layout.
* **HTML/Style Definition:**
  ```html
  <div class="detail-fields-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
  ```

### C. Column Separators (The 1px border effect)
Borders between cells in the grid are constructed without standard CSS cell borders. Instead:
1. The grid container has a `background` of `var(--border)`.
2. A `gap` of `1px` is defined on the grid.
3. Because the child cards have their own backgrounds (e.g. `var(--bg2)`), the 1px spacing reveals the container's background, producing crisp, clean separator grid lines.

---

## 2. Dynamic Column Spans (Field Widths)
To handle data fields of varying lengths (e.g., long addresses vs. short amounts), the Javascript code dynamically calculates column spans and adds appropriate CSS classes.

### A. Standard Grid Spanning (script.js)
The column span is calculated based on the character length of the value:
* **Span 1 (1 column wide):**
  * Condition: Value length is 15 characters or less.
  * Class: None (default behavior).
* **Span 2 (2 columns wide):**
  * Condition: Value length is between 16 and 35 characters.
  * Class: `.span-2` (translates to `grid-column: span 2;`).
* **Full Width (3 columns wide):**
  * Condition: Value length is greater than 35 characters, or the label is hidden.
  * Class: `.full-width` (translates to `grid-column: 1 / -1;`).

### B. Holdings Grid Spanning (holding.js)
Since the Holdings module uses a 2-column layout, the span logic is simplified:
* **Span 1 (1 column wide):**
  * Condition: Value length is 20 characters or less.
  * Class: None (default behavior).
* **Full Width (2 columns wide):**
  * Condition: Value length is greater than 20 characters, or the label includes "address", "details", or "remarks".
  * Class: `.full-width` (translates to `grid-column: 1 / -1;`).

---

## 3. Responsive Breakpoints (Media Queries)
To ensure the layouts remain readable and functional on tablet and mobile viewports, media queries dynamically rewrite the grid templates:

```css
@media (max-width: 1024px) {
  /* Restructure standard 3-column layouts to 2-columns on tablets/mobiles */
  .detail-fields-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Force span-2 elements to occupy full-width to prevent overflow */
  .detail-field-card.span-2 {
    grid-column: 1 / -1;
  }
}
```
