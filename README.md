# Huter Haustechnik – Website

Statische Website (reines HTML/CSS/JS, **kein Build-Step, kein Framework**).
Gehostet über **Cloudflare Pages**, DNS über A1. Domain: huter.co.at

## Deployment
Cloudflare Pages ist mit diesem Repo verbunden – jeder Push auf `main` wird automatisch veröffentlicht.

- **Build command:** *(leer lassen)*
- **Build output directory:** `/`

## Struktur
```
index.html, haustechnik.html, bad-sanitaer.html, ueber-uns.html,
referenzen.html, al-immobilien.html, kontakt.html, impressum.html, datenschutz.html
assets/css/    Stylesheet
assets/js/     Skripte (inkl. vendor/three.module.js – lokal, kein CDN)
assets/fonts/  Schriften lokal (Inter + Fraunces, woff2)
assets/img/    Bilder
assets/logo/   Logos
favicon.ico
_headers       Sicherheits-Header für Cloudflare Pages
```

## Bilder austauschen
Bild in `assets/img/` mit **gleichem Dateinamen** überschreiben → committen → pushen → live.
(Visuelle Übersicht welches Bild wo sitzt: `bild-verzeichnis.html`, liegt lokal / nicht im Repo.)

## Kontaktformular
`kontakt.html` versendet über Formspree (Endpoint `https://formspree.io/f/mgogvboe`).

## Keine externen Laufzeit-Abhängigkeiten
Schriften und three.js sind lokal eingebettet. Einzige externe Einbindungen:
OpenStreetMap-Karte (Kontaktseite) und Formspree (nur beim Absenden).
