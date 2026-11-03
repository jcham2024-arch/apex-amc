# Skill: Accessible Component Patterns

Use when building any interactive component. Work top-down: pick the native element first, add ARIA
only where semantics are genuinely absent.

---

## 1. Decision procedure

```
1. Does a native element do this?
   -> Use it. Done. You inherit keyboard, focus, and platform a11y.

2. Is it a composite widget (combobox, menu, tabs, listbox, tree, grid)?
   -> Copy the ARIA APG pattern exactly. Note the ARIA it requires.

3. Is it an overlay (dialog, popover, tooltip)?
   -> Use <dialog> or popover. Implement focus restoration yourself.

4. Only now: ARIA on a generic element.
   -> You own keyboard behavior, focus management, and testing. All of it.
```

**First rule of ARIA: do not use ARIA if a native element does the job.** Every ARIA attribute you add
is code you now own and must test.

| Need | Use, not |
|---|---|
| Button | `<div role="button" tabindex="0">` |
| Checkbox | `<input type="checkbox">` |
| Modal | `<dialog>` |
| Tooltip / popover | `popover` attribute |
| Disclosure | `<details>`/`<summary>` |
| Progress | `<progress>` |
| Meter | `<meter>` |
| Tabs (simple) | links + `aria-current` |

---

## 2. Every interactive component checklist

- [ ] Native element used where one exists
- [ ] Accessible name present (text content, `aria-label`, or `<label>`)
- [ ] Fully operable by keyboard
- [ ] `:focus-visible` styling, never bare `:focus`, never `outline: none`
- [ ] Hit area >= **24x24 CSS px** (WCAG 2.2 SC 2.5.8)
- [ ] State exposed as `data-*` **and** as ARIA where assistive tech needs it
- [ ] Disabled state uses the `disabled` attribute, not just styling
- [ ] Loading state announced, and announced once (see section 6)
- [ ] Errors identified by **text**, not color alone

---

## 3. Buttons

```html
<button type="button">Save</button>              <!-- correct -->
<button type="submit">Save</button>             <!-- inside a form -->
<a href="/save">Save</a>                        <!-- navigates -->
```

- `type="button"` explicitly on buttons **not** inside a form - the default is `submit`.
- Icon-only needs a name: `<button aria-label="Close"><svg aria-hidden="true">…</svg></button>`
- Loading: `disabled` + `aria-busy="true"`, and the accessible name should change ("Saving").

---

## 4. Dialog / modal

```html
<dialog id="confirm">
  <h2>Delete file?</h2>
  <p>This cannot be undone.</p>
  <form method="dialog">
    <button value="cancel">Cancel</button>
    <button value="confirm">Delete</button>
  </form>
</dialog>
```

```js
const dialog = document.getElementById('confirm');
dialog.addEventListener('close', () => triggerButton.focus());   // YOU implement this
dialog.showModal();
```

`<dialog>` gives you top-layer rendering, focus trap, Escape-to-close, and `::backdrop` for free.

**Still yours:** focus restoration, and ensuring sticky headers don't obscure focus (SC 2.4.11).

**Give it a name:** `aria-labelledby` pointing at the heading, plus `aria-describedby` for body text.

### Enter/exit animation

```css
dialog {
  opacity: 0;
  translate: 0 1rem;
  transition: opacity var(--duration-quick) var(--ease-out),
              translate var(--duration-quick) var(--ease-out),
              display var(--duration-quick) allow-discrete,
              overlay var(--duration-quick) allow-discrete;
}
dialog[open] { opacity: 1; translate: 0 0; }
@starting-style { dialog[open] { opacity: 0; translate: 0 1rem; } }
```

---

## 5. Tooltip / popover

```html
<button popovertarget="hint">What's this?</button>
<div id="hint" popover>Extra explanation</div>
```

```css
#hint {
  position-area: block-start;    /* above the trigger, auto-centered */
  position-try: flip-block;      /* flip below if it overflows */
  max-inline-size: 20em;
}
```

The popover attribute sets `position` and creates the anchor relationship automatically - **no
`anchor-name` or `position-anchor` needed** with this markup.

---

## 6. Announcing async state

```html
<!-- exists in the DOM BEFORE you write to it -->
<div role="status" aria-live="polite"></div>
<div role="alert" aria-live="assertive"></div>
```

- Creating the region and populating it in the same tick often produces **no announcement**.
- `polite` waits for a pause; `assertive` interrupts. Reserve `assertive` for errors.
- `aria-atomic="true"` re-announces the whole region on change.
- Announce **once** - an `aria-busy` toggle pattern avoids repeating the same message.

For SPA navigation, announce the new page title in a live region. A silent page swap is a silent page
to a screen reader user.

---

## 7. Combobox / autocomplete

Copy the APG pattern. Non-negotiables:

- **DOM focus stays on the input**; AT focus moves via `aria-activedescendant`.
- Selection follows focus; one suggestion selected at a time.
- `aria-expanded` reflects popup visibility.
- `aria-controls` only needs setting while the popup is visible.
- Escape closes the popup; if already closed, may clear the value.
- A redundant toggle button gets `tabindex="-1"`.

```html
<label for="city">City</label>
<input
  id="city" role="combobox"
  aria-expanded="false" aria-controls="city-list" aria-autocomplete="list"
  autocomplete="off"
/>
<ul id="city-list" role="listbox">
  <li id="opt-1" role="option" aria-selected="false">Berlin</li>
</ul>
```

Source: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/

---

## 8. Composite widgets - roving tabindex

Tabs, menus, listboxes, and toolbars are **one tab stop**. Arrow keys move within.

```html
<div role="tablist">
  <button role="tab" tabindex="0"  aria-selected="true"  aria-controls="p1">One</button>
  <button role="tab" tabindex="-1" aria-selected="false" aria-controls="p2">Two</button>
</div>
```

- Tabs: choose **automatic** (arrows select) or **manual** (arrows move, Enter selects). Pick one and
  test it.
- Each tab needs `aria-controls`; each panel needs `aria-labelledby` back to its tab.
- Menu items need `role="menuitem"`; the container `role="menu"`.

**Prefer a headless primitive** (Radix / Base UI / React Aria) for these. The keyboard behavior is hard
to get right and impossible to skip.

---

## 9. Forms

```html
<label for="email">Email address</label>
<input id="email" type="email" name="email" autocomplete="email"
       required aria-required="true"
       aria-invalid="true" aria-describedby="email-error" />
<p id="email-error">Enter a valid email address.</p>
```

- Real `<label>`, always. Placeholder text is **not** a label (it disappears on input, fails contrast).
- `autocomplete` tokens (`name`, `email`, `tel`, `street-address`, `one-time-code`) enable password
  managers and autofill.
- `<fieldset>` + `<legend>` for radio and checkbox groups.
- `inputmode` / `enterkeyhint` for the right mobile keyboard.
- Validate on **blur and submit**, never per keystroke.
- On failed submit: move focus to an **error summary** that links to each bad field.
- Never trust client-side validation - Server Actions must revalidate.

---

## 10. Manual test procedure

Automated tools catch **under 50%** of issues. This requires a human:

1. **Unplug the mouse.** Tab through the entire flow. Watch the focus ring the whole time.
2. **Check tab order** matches visual order.
3. **Open and close every overlay.** Does focus return to the trigger?
4. **Escape everything.** Every dismissible thing should close.
5. **Zoom to 200%.** Does it still work?
6. **Enable reduced motion.** Is the flow still understandable?
7. **Turn on a screen reader** for critical flows. Is the announcement *useful*, not just present?

---

## Sources

- ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- Combobox pattern: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
- Dialog pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Popover API: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
- dialog element: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Accessibility Insights for the Web: https://accessibilityinsights.io/