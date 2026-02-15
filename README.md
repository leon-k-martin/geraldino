# Geraldino Website

Einfache statische Website – kein Build-Schritt nötig.

## Struktur

```
index.html          ← Die Website
style.css           ← Styling
script.js           ← Lädt Inhalte & Termine
content/            ← Texte (Markdown)
  hallo.md          ← Startseite / Begrüßung
  musik.md          ← Musik-Sektion
  bio.md            ← Über mich
dates/              ← Termine (JSON)
  manifest.json     ← Liste aller Termin-Dateien
  2026-04-12-nuernberg.json
  ...
static/img/         ← Bilder
```

## Inhalte bearbeiten

### Texte ändern
Öffne die Markdown-Dateien im `content/` Ordner direkt auf GitHub:
1. Gehe zu dem Repository auf GitHub
2. Navigiere zu `content/hallo.md` (oder `bio.md`, `musik.md`)
3. Klicke auf das Stift-Symbol (✏️) zum Bearbeiten
4. Schreibe deinen Text mit einfacher Formatierung:
   - `# Überschrift` für große Überschriften
   - `## Unterüberschrift` für kleinere
   - `**fett**` für **fetten Text**
   - `*kursiv*` für *kursiven Text*
   - `[Linktext](https://url.de)` für Links
   - `![Beschreibung](static/img/foto.jpg)` für Bilder
5. Klicke "Commit changes" → fertig!

### Neuen Termin hinzufügen
1. Erstelle eine neue Datei im `dates/` Ordner, z.B. `2026-09-15-berlin.json`
2. Inhalt:
```json
{
  "date": "2026-09-15",
  "city": "Berlin",
  "venue": "Kulturzentrum",
  "note": "Familienkonzert um 15 Uhr",
  "link": "https://tickets.example.com"
}
```
3. Öffne `dates/manifest.json` und füge den Dateinamen hinzu:
```json
[
  "2026-04-12-nuernberg.json",
  "2026-09-15-berlin.json"
]
```
4. Commit → fertig! Vergangene Termine werden automatisch ausgegraut.

### Termin entfernen
1. Lösche die JSON-Datei aus `dates/`
2. Entferne den Dateinamen aus `dates/manifest.json`

### Bilder hinzufügen
1. Lade das Bild in `static/img/` hoch
2. Verwende es im Markdown: `![Beschreibung](static/img/mein-bild.jpg)`

## Lokal testen
```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Admin-Bereich (CMS)

Unter `/admin/` gibt es eine einfache Oberfläche zum Bearbeiten der Website — direkt im Browser, kein technisches Wissen nötig.

### Login
1. Gehe zu `deine-domain.de/admin/`
2. Melde dich mit einem **GitHub Personal Access Token** an:
   - [Token erstellen](https://github.com/settings/tokens/new) → Berechtigung "repo" aktivieren
   - Token wird lokal im Browser gespeichert
3. Du siehst das Dashboard mit zwei Tabs: **Texte** und **Termine**

### Texte bearbeiten
- Klicke auf einen Text (Hallo, Musik, Über mich)
- Bearbeite den Markdown-Text im Editor
- Live-Vorschau unterhalb
- Klicke "Speichern" → Änderung wird direkt committet

### Termine verwalten
- Klicke "+ Neuer Termin" und fülle das Formular aus
- Bestehende Termine können bearbeitet (✏️) oder gelöscht (🗑️) werden
- Vergangene Termine werden automatisch ausgegraut

## Deployment
Die Seite läuft auf GitHub Pages. Jeder Push auf `main` aktualisiert die Website automatisch.