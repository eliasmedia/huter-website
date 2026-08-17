# Huter Haustechnik – Website

Statische Website (reines HTML/CSS/JS, **kein Build-Step, kein Framework**).
Gehostet über **Cloudflare Pages**, DNS über A1. Domain: huter.co.at

## Deployment
Cloudflare Pages ist mit diesem Repo verbunden – jeder Push auf `main` wird automatisch veröffentlicht.

- **Build command:** *(leer lassen)*
- **Build output directory:** `/`

## Noch im Cloudflare-Dashboard zu erledigen
Diese drei Punkte lassen sich nicht im Repo lösen:

1. **apex → www weiterleiten.** `_redirects` kann nur Pfade, keine Hostnamen.
   Beide Domains als Custom Domain hinzufügen, dann unter *Rules → Redirect Rules*
   `huter.co.at/*` → `https://www.huter.co.at/$1` (301). Alle `<link rel="canonical">`
   zeigen auf die `www`-Variante.
2. **Web Analytics aktivieren.** *Web Analytics → Add a site* bzw. beim Pages-Projekt
   der Analytics-Schalter. Cloudflare injiziert das Skript serverseitig – **kein Code
   im Repo nötig**. Cookiefrei, damit kein Cookie-Banner erforderlich wird.
   Die CSP in `_headers` gibt `cloudflareinsights.com` bereits frei.
3. **HSTS ausbauen.** `_headers` setzt `max-age=31536000` ohne `includeSubDomains`.
   Erst wenn sicher ist, dass *alle* Subdomains (Mail, Webmail …) sauber über HTTPS
   laufen, kann `; includeSubDomains` ergänzt werden. `preload` nur mit Bedacht –
   das lässt sich nur schwer rückgängig machen.

## Struktur
```
index.html, haustechnik.html, bad-sanitaer.html, ueber-uns.html,
referenzen.html, al-immobilien.html, kontakt.html, impressum.html, datenschutz.html
danke.html     Danke-Seite nach Formularversand (noindex)
404.html       Eigene Fehlerseite (Cloudflare Pages nutzt sie automatisch)
assets/css/    Stylesheet
assets/js/     Skripte (inkl. vendor/three.module.js – lokal, kein CDN)
assets/fonts/  Schriften lokal (Inter + Fraunces, woff2)
assets/img/    Bilder (WebP; og-huter.jpg als Social-Vorschaubild)
assets/logo/   Logos (WebP + SVG)
favicon.ico
robots.txt     Crawler-Regeln, verweist auf die Sitemap
sitemap.xml    7 indexierbare Seiten – bei neuen Seiten ergänzen!
_headers       Sicherheits-Header für Cloudflare Pages
_redirects     Weiterleitungen der alten Django-URL-Struktur
```

## Bilder austauschen
Alle Fotos liegen als **WebP** vor (max. 1400 px lange Kante, Qualität 78).
Neues Bild vorbereiten und mit **gleichem Dateinamen** überschreiben:

```bash
cwebp -q 78 -m 6 -resize 1400 0 neu.jpg -o assets/img/<name>.webp   # Querformat
cwebp -q 78 -m 6 -resize 0 1400 neu.jpg -o assets/img/<name>.webp   # Hochformat
```

Danach in der HTML-Datei die `width`/`height`-Attribute des `<img>` auf die neuen
Pixelmaße anpassen (verhindert Layout-Sprünge beim Laden).
(Visuelle Übersicht welches Bild wo sitzt: `bild-verzeichnis.html`, liegt lokal / nicht im Repo.)

**Ausnahme:** `assets/img/og-huter.jpg` bleibt bewusst JPEG (1200×630) – es ist das
Vorschaubild für WhatsApp/Facebook/LinkedIn, und nicht jeder Social-Scraper kann WebP.

## Strukturierte Daten (JSON-LD)
`index.html` und `kontakt.html` enthalten einen `LocalBusiness`-Block (Typ
`Plumber` + `HVACBusiness`) mit Adresse, Geokoordinaten, Telefon, Leistungen und
Gründungsjahr. **Bei Änderungen an Adresse oder Telefonnummer beide Seiten anpassen.**

Noch offen: `openingHoursSpecification`. Sobald die Öffnungszeiten feststehen, in
beiden Blöcken ergänzen (und am besten auch sichtbar auf `/kontakt` anzeigen):

```json
"openingHoursSpecification": [
  { "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday"],
    "opens": "07:30", "closes": "17:00" },
  { "@type": "OpeningHoursSpecification",
    "dayOfWeek": "Friday", "opens": "07:30", "closes": "12:00" }
]
```
(Zeiten sind ein **Beispiel** – durch die echten ersetzen.)

## Hero-Animation
`assets/js/hero.js` zeichnet das Partikelfeld mit **Canvas 2D** und eigener
Perspektivprojektion (6 KB). Vorher lief das über three.js (1,24 MB) – die
Bibliothek ist entfernt. Bei `prefers-reduced-motion` bleibt das Canvas leer und
der statische Gradient/das Hintergrundbild übernimmt.

## Asset-Versionierung
CSS/JS werden über `?v=N` im `<link>`/`<script>` versioniert.
**Nach jeder Änderung an `style.css`, `main.js` oder `hero.js` die Zahl in allen
HTML-Dateien hochzählen**, sonst bekommen wiederkehrende Besucher die alte Datei:

```bash
for f in *.html; do perl -pi -e 's/\?v=5/?v=6/g' "$f"; done
```

## Kontaktformular
`kontakt.html` versendet über Formspree (Endpoint `https://formspree.io/f/mgogvboe`).

- `_next` leitet nach dem Absenden auf `/danke` weiter (eigene Danke-Seite statt formspree.io).
  **Achtung:** Der Wert ist die absolute Live-URL `https://www.huter.co.at/danke` – lokal
  landet man nach dem Absenden daher auf der Live-Domain, das ist erwartet.
- `_subject` setzt den Betreff der Benachrichtigungs-Mail.
- `_gotcha` ist ein Honeypot-Feld (per CSS `.hp` ausgeblendet). Formspree verwirft
  Einsendungen, bei denen es ausgefüllt ist. **Nicht sichtbar machen.**

## Keine externen Laufzeit-Abhängigkeiten
Schriften und three.js sind lokal eingebettet. Einzige externe Einbindungen:
OpenStreetMap-Karte (Kontaktseite) und Formspree (nur beim Absenden).
