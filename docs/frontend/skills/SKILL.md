# Skills Index

This directory is the **training surface** of the `webpage-design` knowledge base.

The `docs/` are grounding material. These files are the operational procedures - the things you
actually invoke when doing work.

---

## Available skills

| Skill | Invoke when |
|---|---|
| [`ui-review-checklist.md`](./ui-review-checklist.md) | Reviewing a UI change, or before shipping one |
| [`design-tokens-authoring.md`](./design-tokens-authoring.md) | Creating, extending, or auditing a token system |
| [`accessible-component-patterns.md`](./accessible-component-patterns.md) | Building any interactive component |

---

## How to use this for training

### Grounding a skill in the docs

When writing a new skill, **cite the docs rather than paraphrasing them.** The docs carry sources and
re-verification dates; a paraphrase loses both.

```markdown
Container queries respond to the component's own size, not the viewport.
Source: docs/02-css-layout.md section 2 (Baseline Widely available since Feb 2023)
```

If a claim appears in a skill but not in a doc, either add it to a doc or mark it as an open question.

### The confidence rule

Every skill should distinguish three kinds of statement:

| Kind | How to write it |
|---|---|
| **Stable** (multiple independent confirmations) | State it directly |
| **Volatile** (browser support, version status) | State it with a date and a re-check trigger |
| **Contested** (APCA vs WCAG 2, Astro vs Qwik) | State both positions and the operational conclusion |

The three tiers are enumerated in `docs/frontend/09-caveats-and-volatile-status.md` section 8 and section 9.

### Do not memorize dates - memorize re-check triggers

A model trained on "Safari 26 supports anchor positioning" will confidently apply it in 2029. A model
trained on "check Baseline for CSS features before using them, and re-verify any support claim older
than 6 months" will not.

**Prefer the procedure over the fact** wherever the procedure is stable.

Examples:

| Unstable fact | Stable procedure |
|---|---|
| "Safari 26 supports X" | "Check https://web.dev/baseline or MDN for X's status before use" |
| "INP replaces FID" | "Core Web Vitals are LCP/INP/CLS; confirm thresholds at web.dev" |
| "React 19 deprecated forwardRef" | "Check the React version in the project's package.json before assuming any API" |
| "WCAG 2.2 has 9 new criteria" | "Target the current WCAG version; confirm at w3.org/WAI" |

### Feeding corrections back

If applying this knowledge in a real project reveals that something here is wrong:

1. Fix the doc in place.
2. Add a note to `docs/frontend/09-caveats-and-volatile-status.md` describing the correction.
3. Correct the skill that made the claim.

**Never delete contested guidance** - the reasoning is the most valuable part. This knowledge base
already contains one full example of that: the APCA correction retains both Roselli's position and
the APCA creator's response.

---

## Suggested new skills

Things not yet covered that would be worth writing:

- **`responsive-layout-audit.md`** - checking a layout at boundaries, long content, empty states
- **`motion-review.md`** - auditing animation for compositor-only properties and reduced-motion
- **`component-api-design.md`** - reviewing a component's prop surface for composition smells
- **`dark-mode-verification.md`** - checking that dark mode was designed, not inverted
- **`bundle-budget.md`** - diagnosing client JS growth and deciding what should be a Server Component

---

## Related resources

- `../assets/tokens.css` - start from this rather than writing tokens from scratch
- `../assets/reset.css` - modern reset with zero specificity
- `../assets/patterns.css` - layout, state, focus, and overlay patterns
- `../assets/starter.html` - annotated HTML scaffold