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
Siehe [ProjectStructure.md](https://github.com/TheMegaTB/BJS/blob/master/ProjectStructure.md)

## Konzepte

RunItEasy besteht aus verschiedenen Komponenten, die sich alle in der oben beschriebenen Ordnerstruktur wiederfinden.

### Server

Zunächst befinden sich alle serverseitigen Funktionen im meteor/server Ordner. Besonders zu beachten ist meteorCalls.js.
 Hier werden alle Funktionen definiert, die vom client aufgerufen werden können. Alle Daten werden verschlüsselt übertragen.
 Deshalb gibt es zwei wrapper: runServerFunction für normale Aufrufe und runAsync für asyncrone Aufrufe. Sie übernehmen das entschlüsseln
 der empfangenen Daten sowie das verschlüsseln der zu versendenen Daten.  

### Client

Im meteor/client Ordner befinden sich alle Daten, die nur der Client braucht. Dazu gehört das design der Website sowie die
damit verbundenen Verarbeitung von Eingaben.

Der allgemeine Aufbau einer Seite ist in head.html und body.html definiert. 
Allgemeine styles sind im styles Ordner zusammengefasst

Alle Popups, die von verschiedenen Seiten aus geöffnet werden sollen sind
im popups Ordner definiert.

Im lib Ordner sind alle notwendigen Bibliotheken gespeichert, die nicht mit npm installiert werden
konnten.

Der eigentliche Inhalt der Seite liegt im components Order. Hier gibt es für jeden Unterbereich (Login, Configuration, Eingabe Ausgabe) der Seite
  einen eigenen Ordner.
  
### Imports

Einer der wichtigsten Ordner ist der imports Ordner. Hier liegt die ganze logic, die für die Ausertung, Berechnung, Verschlüsselung zuständig ist.
  
Im api Ordner gibt es verschiedenen Module. Diese sind
   
#### accountManagement
Ein Modul, das es einfach macht angemeldete User zu verwalten. Wird momentan nur Clientseitig benutzt.
  Kann aber auch serverseitig verwendet werden.
#### crypto
Hier sind alle functionen definiert, die für die verschlüsselung notwendig sind.
#### database
 Die Datenbank ist so aufgebaut, dass für jeden Wettkampf eine Datenbank erstellt wird. Jede Datenbank enthällt die collections
 accounts und athletes. Jeweils repräsentiert duch eine datei in database/collections. Um Wettkampfspezifische Collections zu erstellen gibt es die Funktion
  ContestCollection in collections/collections.js 
  
 Für allgemeine Daten gibt es die generic und die contests collection. Für Wettkapfunabhängige Collections gibt es die funktion Collection in collections/collections.js
  
 
 Um mit der Datenbank zu interagieren gibt es sowohl auf dem client als auch auf dem server das globale object Meteor.COLLECTIONS.

### logic

im api/logic order befindet sich alles, um athleten zu verwalten und ihre punkte zu berechnen. Um die verschiedenen Wettbewerbstype zu 
  
Im data Ordner befinden sich 


## Unit testing
### Executing tests
Um die Tests auszuführen starten sie die folgenden Programme und stellen sie sicher, dass kein anderer Server läuft.
* Server only (CLI):    `meteor test --driver-package dispatch:mocha`
* Both (WebUI):         `meteor test --driver-package practicalmeteor:mocha` -> `http://localhost:3000`
