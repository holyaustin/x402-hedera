# Manual test plan — UI Mode & CLI Mode

Automated tests (`npm test`, in `tests/`) cover component logic in isolation
with a mocked `/api/pay`. This plan covers everything that needs a real
browser and a real payment round-trip against the running resource server —
things automated tests intentionally don't touch.

Prerequisites: `server` running on port 4021, `web` running on port 3000,
buyer account funded with testnet HBAR and testnet USDC (see main README).

## UI Mode

| # | Steps | Expected result |
|---|-------|------------------|
| 1 | Load the app | Header, hero, mode toggle (UI selected by default), three product cards, footer all render. No layout shift/flash. |
| 2 | Open the symbol dropdown | All 12 symbols listed plus "Custom symbol…", each Buy button label updates to "Buy for `<symbol>`" |
| 3 | Select "Custom symbol…" | A text input appears; all three Buy buttons are disabled until you type something |
| 4 | Type a custom symbol, e.g. `SHOP` | Buy buttons re-enable and show "Buy for SHOP" |
| 5 | Click Buy on **Spot Price** (HBAR) | Button shows "Paying…", then returns JSON data + a "View transaction on HashScan ↗" link |
| 6 | Click the HashScan link | Opens a new tab showing a real, settled Hedera testnet transaction |
| 7 | Click Buy on **Bid / Ask Quote** (USDC) | Same as #5/#6, confirms USDC path independently of HBAR path |
| 8 | Stop the resource server, click any Buy button | An error message renders in the card (not a crash), e.g. a connection error |
| 9 | Tab through the page with keyboard only | Visible focus ring on dropdown, buttons, and footer links in a sensible order |

## CLI Mode

| # | Steps | Expected result |
|---|-------|------------------|
| 1 | Switch to CLI Mode | Terminal renders with welcome line and a row of quick-insert symbol chips |
| 2 | Type `help`, press Enter | Command list prints below the typed line |
| 3 | Type `catalog` | All three products with price + settlement asset print |
| 4 | Type `symbols` | All 12 symbols with labels print |
| 5 | Type `buy spot-price AAPL` | Prints "402 → signed → paid", the JSON body, and a HashScan link |
| 6 | Type `buy quote AAPL` | Same, confirming the USDC path from CLI Mode too |
| 7 | Type `nonsense` | Prints `command not found: nonsense (try 'help')` in red |
| 8 | Type `clear` | Screen empties completely |
| 9 | Click a symbol chip (e.g. TSLA) while the input is empty | Input fills with `buy spot-price TSLA ` |
| 10 | Click a different chip after typing `buy ai-insight` | Third token gets replaced/appended with the new symbol |
| 11 | Submit a `buy` command, then immediately try to submit another | Input is disabled while the first request is in flight (`busy` state) |

## Responsive / cross-device

| # | Steps | Expected result |
|---|-------|------------------|
| 1 | Resize to a 375px-wide viewport (or a real phone) | Header nav collapses to logo + HashScan link only; hero text stays readable; cards stack to one column |
| 2 | Same width, CLI Mode | Symbol chips wrap to multiple lines; terminal shrinks to a shorter fixed height but stays usable |
| 3 | Rotate device / resize to tablet width (~768px) | Product cards form a 2-column grid; footer collapses from 3 columns to 1 |
| 4 | Check favicon/tab icon on any device | Blue hex mark visible in the browser tab |

## Accessibility spot checks

- All interactive elements (dropdown, buttons, terminal input, footer links) are reachable via Tab and show a visible focus ring.
- `prefers-reduced-motion: reduce` (OS setting or DevTools emulation) stops the header's animated pulse dot.
- Screen reader announces the mode toggle as tabs (`role="tab"`, `aria-selected`).
