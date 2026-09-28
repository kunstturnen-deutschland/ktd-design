# ktd-design

Zentrale Gestaltung und Bausteine von Kunstturnen Deutschland.

## Dateien

- `ktd.css` – Tokens (Farben, Schriften, Größen) und Bausteine: Sektionen, Überschriften, Knöpfe, Pillen, Bentos, Bilder mit Bildunterschrift, Turnerinnen-Karten, Sticker, Karten-Stapel
- `ktd.js` – Karten umdrehen, Einblenden wie auf der Landingpage, Karten-Stapel mit Abdunkeln
- `seiten/wettkaempfe.css` und `seiten/wettkaempfe.js` – Stil und Verhalten der Seite Wettkämpfe (Zeitleiste, WM-Block, Favoritinnen-Register, Kalender). Die Daten stehen als JSON-Blöcke auf der Seite.

## Einbindung in Webflow (Site-Kopf)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kunstturnen-deutschland/ktd-design@main/ktd.css">
<script src="https://cdn.jsdelivr.net/gh/kunstturnen-deutschland/ktd-design@main/ktd.js" defer></script>
```

## Regeln

1. Die Dateien setzen keine globalen Stile. Alles wirkt nur über Klassen mit dem Präfix `ktd-`.
2. Neue Gestaltung entsteht zuerst auf einer einzelnen Seite. Nach Freigabe wandert sie hierher und gilt dann überall.
3. In dieses Repository kommen niemals Passwörter, API-Schlüssel oder Zugangsdaten.

## Farbregeln

- Violett `#2D0060` und Tiefviolett `#1C0040` sind die einzigen Violetttöne.
- Knallgelb `#DCFF00` nur für Status: Runterzählen, Läuft gerade.
- Gold `#E3B341` für Top-Events (WM, EM, Olympia) und Medaillen.
- Knöpfe: auf Violett pink, auf farbigem Grund violett. Keine Schatten, keine Verläufe.
