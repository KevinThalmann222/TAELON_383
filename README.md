# TAELON 383 — Nachtfahrt

Mobil-first, einseitige Scroll-Website für TAELON 383. Eine fortlaufende Three.js-Welt führt vom nächtlichen Cockpit ins Radio, zur Musikszene „LOW LOW“, zum kommenden Album **OHNE ANSAGE** und schließlich zum bestätigten Instagram-Profil.

## Lokal ansehen

Die Seite benötigt einen lokalen HTTP-Server, weil Three.js als ES-Modul und die Medien nicht zuverlässig über `file://` funktionieren. Im Projektordner z. B. `npx serve .` starten und die ausgegebene lokale Adresse öffnen. Three.js 0.186.1 liegt samt Core-Modul lokal in `vendor/`; für den Laufzeitcode wird kein CDN benötigt.

## Inhalte und Medien

- `index.html` enthält die gesamte Scroll-Story. Die alten Seiten bleiben als kurze Weiterleitungen auf passende Abschnitte erhalten.
- `WORLD_BIBLE.md` hält Szenen, Kamera, Stil, Interaktion, Medien und Prüfpunkte fest.
- Die Website enthält keine erfundenen Erscheinungstermine, Streaming-Links, Tracklisten oder biografischen Aussagen.
- `assets/audio/low-low-30s.wav` ist der 30-Sekunden-Ausschnitt ab 00:43 aus der Projektdatei `Low, Low.wav`. Der Player lädt ihn erst nach Aktivierung.
- Die Nachtfahrt im Cockpit und der Stadtraum sind stilisierte 3D-Geometrie. `assets/nachtfahrt.png` ist ein generiertes Stimmungsbild und wird nur bei fehlendem WebGL gezeigt.
- Die Originalbilder und die vollständige WAV-Datei außerhalb dieses Ordners bleiben unangetastet.

## GitHub Pages

Die statische Website liegt direkt im Repository-Stamm: `index.html`, `js/`, `styles.css`, `assets/` und `.nojekyll`. Die bestehende GitHub-Pages-Seite verwendet den Branch `master`; ein erfolgreicher Pages-Deploy wird in **Actions** unter **GitHub Pages** sichtbar. Die Live-Seite ist [kevinthalmann222.github.io/TAELON_383](https://kevinthalmann222.github.io/TAELON_383/).

Nach Änderungen an `master` den letzten Pages-Deploy abwarten und die veröffentlichte Live-Seite prüfen. Für eine erneute Einrichtung lautet die Quelle **Deploy from a branch → master → /(root)**. Die Datei `.nojekyll` verhindert eine Jekyll-Verarbeitung. Bis offizielle Hörlinks vorliegen, verweist der einzige externe Handlungsaufruf auf das bestätigte Instagram-Profil.
