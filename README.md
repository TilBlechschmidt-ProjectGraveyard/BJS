# RunItEasy

![RunItEasy Logo](https://raw.githubusercontent.com/TheMegaTB/BJS/master/meteor/public/icons/Logo512.png)

## API Dokumentation
Die Dokumentation der programminternen API ist unter der folgenden Adresse verfügbar:
[https://themegatb.github.io/BJS/index.html](https://themegatb.github.io/BJS/index.html)

# Entwicklung

## Aufsetzen der Projektumgebung
### Entwicklungstools
Es ist von größter Erforderniss, dass Sie [Meteor](https://www.meteor.com/install) und [Git](https://git-scm.com/downloads) installieren, bevor sie mit den nachfolgenden Schritten
fortfahren.

### Herunterladen
```
git clone https://github.com/TheMegaTB/BJS.git
cd BJS
```

### Abhängigkeiten installieren und Server ausführen
```
## Linux, macOS
./setupProject.sh

## Windows
cd meteor
meteor reset
meteor npm install
meteor
```

## Ordnerstruktur

## Konzepte

## Unit testing
### Executing tests
Um die Tests auszuführen starten sie die folgenden Programme und stellen sie sicher, dass kein anderer Server läuft.
* Server only (CLI):    `meteor test --driver-package dispatch:mocha`
* Both (WebUI):         `meteor test --driver-package practicalmeteor:mocha` -> `http://localhost:3000`