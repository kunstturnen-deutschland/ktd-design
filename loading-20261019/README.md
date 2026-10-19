# KTD loading correction · 19 October 2026

`view-guard.js` and `view-guard.css` are inlined at the beginning of the shared Webflow site head. They protect home, Stars, all published /turnerin/ pages, and the Rotterdam special page until the current view is ready. Other routes and no-JavaScript native HTML remain usable. A slow load offers reload or explicit access to the native fallback; it never reveals an obsolete layout on a timer.

The shared Webflow footer loads `kartenstory-v2.js` from GitHub Pages instead of the previous Vercel kartenstory-v1.js. This file preserves the complete publicly deployed 19 October shared script; only its final WM loader is changed. It loads the WM enhancement only on home and Rotterdam, once, and on Rotterdam only after wm-page.js has mounted its replacement root. Absolute URLs for existing data and other assets are retained. The separate home and Rotterdam footer copies of wm-gold-release.js and the old Rotterdam 12-second timeout are removed.

**Current source:** maintain this shared script when editing the existing enhancements. Editing only the older Vercel kartenstory-v1.js will no longer affect the KTD site. Runtime WM results still use the existing Vercel wm-gold-release.js and data endpoints.

**Rollback:** remove the ktd-view-guard-20261019 style and following guard script/preload/preconnect from the shared site head, restore the prior shared footer kartenstory-v1.js URL, and restore the prior per-page WM footer loaders and WM head guard, then publish. Preserve all unrelated head/footer content.

Checks: syntax checks and state/ordering tests cover all four routes, WM completion, slow responses, script errors, explicit fallback, unaffected routes, and one WM load after the replacement root mounts. Verify production UI after publishing.
