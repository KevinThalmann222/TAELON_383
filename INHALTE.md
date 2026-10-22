# Bestätigte Inhalte pflegen

Die Künstlerseite ist jetzt eine einzelne Scroll-Story. `index.html` enthält alle sichtbaren Inhalte; die alten Album-, Musik-, Künstler-, Aktuelles- und Kontaktadressen leiten auf den passenden Story-Abschnitt um.

## Aktuell bestätigte Fakten

- TAELON 383 ist Rap-Newcomer.
- Das kommende Rap-Album heißt **OHNE ANSAGE**.
- Ein Veröffentlichungstermin, eine Trackliste und offizielle Hörlinks sind noch nicht bestätigt.
- Bestätigte externe Adresse: [Instagram @taelon_383](https://www.instagram.com/taelon_383/).
- Der kurze „LOW LOW“-Ausschnitt stammt aus `ALBUM_OHNE_ANSAGE/Low, Low.wav`; die Website verwendet dafür die lokale 30-Sekunden-Datei in `assets/audio/`.

## Website-Motive

- `assets/images/low-low-cover.png` ist das vom Nutzer angegebene „LOW LOW“-Cover und bleibt als Projektasset erhalten. Im Autoradio wird es nicht angezeigt; dort stehen TAELON 383, LOW LOW und OHNE ANSAGE mit einer Audio-Wave.
- `assets/ohne-ansage-cover.png` ist das vorhandene Albumcover.
- `assets/nachtfahrt.png` ist ein generiertes Nachtfahrt-Motiv mit dem vorhandenen Porträt als Identitätsreferenz. Es dokumentiert keine reale Fahrt und erscheint nur, wenn WebGL nicht verfügbar ist.
- Die Cockpit-, Straßen- und Radio-Geometrie wird live aus Three.js aufgebaut; sie ist eine szenische Interpretation.

Neue Fakten erst nach Bestätigung in `index.html` und `WORLD_BIBLE.md` aufnehmen. Originalmedien bleiben erhalten; neue Bearbeitungen bekommen eindeutige Dateinamen.
