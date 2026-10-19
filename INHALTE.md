# Inhalte pflegen

Die Website besteht aus sechs eigenständigen HTML-Seiten und einer gemeinsamen `styles.css`. Jede Seite ist auch ohne JavaScript nutzbar. Das erleichtert die Veröffentlichung über GitHub Pages.

## Sobald das Album veröffentlicht wird

1. Auf `index.html`, `album.html`, `musik.html`, `aktuelles.html` und in den Fußzeilen „bald“/„folgt“ durch bestätigte Angaben ersetzen.
2. Auf `album.html` die Platzhalterbox `.track-state` durch eine geordnete Liste mit **freigegebenen** Tracktiteln ersetzen. Nummerierte Listen können mit der vorbereiteten Klasse `.track-list` gestaltet werden.
3. Im Abschnitt `.stream-section` auf `album.html` die Plattformnamen erst dann verlinken, wenn die offiziellen Zieladressen vorliegen. Auch den Link im Albumabschnitt der Startseite anpassen.
4. Hintergrundinformationen und bestätigte Mitwirkende im Abschnitt `.story-section` auf `album.html` ergänzen.

## Neue Musik und Neuigkeiten

- Für eine neue Veröffentlichung auf `musik.html` eine weitere `.release-card` anlegen. Das Bild in `assets/` speichern und im `<img>` die echten Bildabmessungen eintragen.
- Für eine neue Meldung auf `aktuelles.html` eine weitere `.news-card` anlegen. Nur ein bestätigtes Datum anzeigen; die vorhandene Meldung ist bewusst undatiert.
- Bei ausreichend Material können weitere Seiten für Videos, Live-Termine oder Presse ergänzt werden. Erst dann passende Navigationslinks in allen sechs Kopfbereichen aufnehmen.
- Presse- und Buchungskontakte auf `kontakt.html` ergänzen, sobald echte Angaben vorliegen. Es gibt derzeit keine erfundene E-Mail-Adresse oder ein funktionsloses Formular.

## Bilder

- `ohne-ansage-cover.png` ist das vorhandene Albumcover mit Originalschriftzug.
- `ohne-ansage-teaser.jpg` ist der freigegebene Instagram-Teaser.
- `taelon-portrait.jpg` ist das vorhandene Profilbild und Favicon.
- `nachtfahrt.png` und `stiller-moment.png` sind neu generierte, **szenische** Motive mit dem Profilbild als Identitätsreferenz. `clubnacht.png` zeigt eine generierte Clubatmosphäre ohne TAELON 383. Sie illustrieren Stimmungen und dokumentieren keine realen Auftritte oder Ereignisse.

Bildproportionen bleiben mit `height: auto` erhalten. Wo ein Bild einen vorgegebenen Ausschnitt füllt, verwendet die Website `object-fit: cover`, damit es beschnitten statt verzerrt wird.
