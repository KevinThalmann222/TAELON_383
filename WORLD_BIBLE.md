# TAELON 383 — Nachtfahrt / World Bible

## Experience contract

**World sentence:** Eine Fahrt durch die Nacht führt vom erkennbaren Fahrer-Cockpit in das integrierte Autoradio, durch den 30-Sekunden-Ausschnitt von „LOW LOW“ bis zum Albumcover „OHNE ANSAGE“ und schließlich zu TAELON 383 auf Instagram.

**Interaction sentence:** Nativer Seitenscroll fährt eine zusammenhängende Three.js-Welt vor und zurück. Ein sichtbarer Klick startet den Audioausschnitt; die Musik läuft unabhängig vom Scrollen und lässt sich jederzeit pausieren oder stoppen.

## Confirmed facts and creative proposal

- Confirmed: TAELON 383 is a rap newcomer; the upcoming rap album is titled **OHNE ANSAGE**; the Instagram destination is `@taelon_383`.
- Confirmed project assets: `assets/images/icon-low-low.png` is the user-supplied square LOW LOW image used as a small radio thumbnail; `assets/images/low-low-cover.png` is retained but not shown in the radio; `assets/ohne-ansage-cover.png` is the existing album cover.
- Confirmed audio use for this local draft: the opening of the approved Reel excerpt, from 00:43 for 30 seconds, is copied as `assets/audio/low-low-30s.wav`.
- No release date, official listening link, further track title, or biography is stated.
- The car, city, lights, and camera journey are stylized generated geometry. They are an authored music experience, not documentary footage or a claim about a real drive.

## Art direction studies

1. **Amber passenger film:** warm street lamps, near-black leather, rain reflections, quiet camera motion. Intimate, but too close to the existing gold album look for the LOW LOW moment.
2. **Red city pulse:** saturated red light, hard contrast, fast cuts and graphic pulses. A clear match to the LOW LOW cover, but too aggressive for the album transition and long-form mobile scroll.
3. **Selected — nocturnal cinema:** deep neutral blacks, warm amber practical lights on the road, a controlled red accent around the radio, then gold at the album. One continuous camera move, restrained film grain, wet-road streaks, and deliberate pauses. It combines the existing visual assets without copying a specific reel edit.

## Visual system

| Role | Value | Use |
| --- | --- | --- |
| Night field | `#08090D` | sky, scene background, negative space |
| Cabin leather | `#121317` | dashboard and cockpit silhouettes |
| Road midtone | `#202126` | asphalt and distant city structure |
| Practical amber | `#E8AA6C` | street lights and glass reflections |
| LOW LOW red | `#ED303A` | radio emphasis |
| Wave highlight | `#F2BD79` | audio-reactive waveform inside the radio display |
| Album gold | `#E7BB78` | OHNE ANSAGE scene and confirmed status |
| Readable ivory | `#F3EEE5` | headings, controls, story copy |

- Scene proportions: relative units, not a claim of manufacturer dimensions. The steering wheel's outer diameter is 1.24 units; the active display spans 0.96 units (about 77% of the wheel diameter), with a low-profile dark graphite housing integrated into the dashboard.
- The generic center tunnel tapers toward the armrest and carries a padded stitched rest, two recessed metal-edged cupholders, a low electronic selector with a small gear indicator, and a flush touch surface. These authored shapes stay unbranded and are scaled against the wheel and dashboard.
- Lens: perspective camera with a mobile-authored portrait composition; narrow phones widen the vertical field to preserve the display's horizontal framing, with no artificial camera roll.
- Materials: dark rough leather and road; restrained satin trim; lightly tinted windshield glass; flush black-glass media display, lamps, and a fine audio-reactive waveform. The center display has no separate backing plate, chrome bezel, knobs, or grille bars. The console screen is crisp canvas artwork with the user-supplied LOW LOW thumbnail and only the confirmed artist, track, and album labels; it contains no streaming-service marks.
- Motion grammar: slow forward glide, gradual camera dive, short radio hold, warm reveal of the album, quiet CTA landing.
- No photorealistic people, random music-video scenes, excessive particles, external fonts, or unverified campaign claims.

## Chapter ledger

| Progress | Beat | World landmark | DOM story |
| --- | --- | --- | --- |
| 0–18% | Enter the night | Driver/passenger cockpit, windshield, distant road | TAELON 383; visible “Radio einschalten” control |
| 18–34% | Approach | Moving road marks, city blocks, amber lights | “Die Stadt zieht vorbei.” |
| 34–62% | Radio | The integrated center stack resolves into a clear radio close-up; a small square artwork thumbnail sits beside “TAELON 383”, “LOW LOW”, and “OHNE ANSAGE”, with a gold audio-reactive waveform below | Track identity and free pause/stop controls |
| 62–87% | Album | Camera leaves the dashboard for the OHNE ANSAGE cover landmark | Confirmed album description and “Veröffentlichung folgt” |
| 87–100% | Arrival | Warm light falls away to a quiet closing frame | Artist fact and one Instagram CTA |

The radio and music timeline are intentionally independent: rapid scrolling never scrubs the song. Scroll remains native and reversible.

## Interaction matrix

| Control | Input | Result | Accessibility |
| --- | --- | --- | --- |
| Radio einschalten / LOW LOW abspielen | Button click or keyboard activation | Starts or resumes the 30-second local audio excerpt | Real button, live status, visible focus |
| Pause | Audio dock button | Pauses at the current time | `aria-pressed` and changing accessible label |
| Stop | Audio dock button | Pauses and returns to the beginning | Named button; scroll state is unchanged |
| Chapter navigation | Native anchor | Moves to Radio or Album chapter | Keyboard-accessible links and normal browser history |
| Scroll | Wheel, touch, scrollbar, keyboard | Moves the camera through the world | No wheel hijacking; reduced-motion snaps camera state to scroll |

## Asset and loading ledger

| Asset | Source / role | Loading |
| --- | --- | --- |
| `vendor/three.module.js`, `vendor/three.core.js` | Three.js 0.186.1, local ES modules, MIT | Initial renderer |
| `assets/audio/low-low-30s.wav` | 00:43–01:13 from project `Low, Low.wav`; PCM 16-bit stereo, 48 kHz | `preload="none"`; only requested after user activation |
| `assets/images/icon-low-low.png` | User-supplied 893×944 LOW LOW artwork, shown as a rounded thumbnail inside the radio display | Loaded with the 3D experience; kept at its source resolution and drawn into a higher-resolution canvas when the device supports it; no platform logos are present |
| `assets/images/low-low-cover.png` | Earlier user-provided cover variant, preserved as a project asset | Not displayed in the radio |
| `assets/ohne-ansage-cover.png` | Existing album cover | Requested near the album chapter |
| `assets/nachtfahrt.png` | Existing generated night-car mood image | Only used if WebGL cannot start |

### Starting performance budget

- Critical code target: 2.4 MB uncompressed; the renderer and semantic shell load before any large art asset.
- Mobile DPR cap: 2; desktop cap: 1.8. The quality governor reduces render scale and particles when more than a quarter of frames exceed about 28 ms across a 3.5-second window.
- No post-processing or real-time shadows; emissive materials and small glow sprites carry the night lighting.
- Particle count: 112 on phone, 220 on larger screens, reduced to 56% or 24% at lower quality tiers.
- Target: responsive 60 fps on recent phones; reduce continuous motion under `prefers-reduced-motion` and pause rendering when the tab is hidden.
- Local artwork and music are copied into this site so a standalone GitHub Pages deployment does not depend on the parent producer workspace.

## QA status — 22 October 2026

- Playwright Chromium with software WebGL rendered at 320×844, 390×844, 768×1024, 1024×800, and 1440×900. Each document's scroll width matched its viewport; WebGL initialized, the supplied thumbnail returned HTTP 200, and there were no JavaScript errors or failed local requests.
- The revised radio was visually reviewed at 320×844, 390×844, and 1440×900. At the close-up beat, the 0.96-unit display is about 77% of the 1.24-unit steering-wheel diameter, sits in the dashboard without the former backing slab, and stays fully framed on narrow phones. The gauges remain left of the center display.
- A final Playwright pass at 320×844, 390×844, 768×1024, 1024×800, and 1440×900 found no horizontal overflow, browser errors, failed local requests, or WebGL fallback. The radio chapter focused correctly, its copy faded away, and the supplied thumbnail returned HTTP 200.
- The WAV header contains 5,760,000 bytes at 192,000 bytes per second, an exact 30-second PCM excerpt. Chromium plays it to 29.994667 seconds; the visible and accessible player display rounds the completed excerpt to `00:30 / 00:30`. Playback continued during scroll, and pause and stop both worked.
- The latest audio regression check confirmed playback continues during scrolling and pause/stop both work. Earlier full-duration verification reached 29.994667 seconds and displayed `00:30 / 00:30`. A playing-state screenshot confirmed the waveform animates with the audio. Album artwork loaded at 1254×1254. Reduced-motion emulation rendered without errors; the first keyboard Tab reaches the skip link.
- The latest cockpit review used software-WebGL Chromium at 390×844 and 1440×900. The canvas initialized with no page or console errors, failed local requests, or horizontal overflow. At 390×844, the integrated display remained unoccluded; the 893×944 artwork and radio text stayed sharp, and both cupholders and the selector were visible in the same cockpit shot. The tested browser reported an 8192-pixel maximum texture size; the display texture scales up only when the device limit supports it.
- Commit `2fc6f2071341d1610158f2c02c6d4fb4271d3770` deployed successfully through GitHub Pages Actions (`build`, `report-build-status`, and `deploy` all succeeded). The public URL returned HTTP 200 and served `experience.js?v=20261022-11` with the revised console and display code.
- With WebGL disabled, the readable HTML story remained available, the canvas hid, and the narrow view had no horizontal overflow.
- These checks ran in desktop Chromium with software WebGL. A real phone, mobile-browser frame rate, 200% browser zoom, and iOS/Android rendering still need device testing; the 3D scene is authored stylized geometry rather than a manufacturer-accurate model.
