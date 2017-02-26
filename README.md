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
 Hier werden alle Funktionen definiert, die vom Client aufgerufen werden können. Alle Daten werden verschlüsselt übertragen.
 Deshalb gibt es zwei Wrapper: runServerFunction für normale Aufrufe und runAsync für asyncrone Aufrufe. Sie übernehmen das Entschlüsseln
 der empfangenen Daten sowie das Verschlüsseln der zu versendenen Daten. Um neue server funcions hinzuzufügen muss man sich daher
   nicht um eine sichere Verbindung kümmern.

### Client

Im meteor/client Ordner befinden sich alle Daten, die nur der Client braucht. Dazu gehört das Design der Website sowie die
damit verbundenen Verarbeitung von Eingaben und die Vorbereitung der Ausgabe.

Der allgemeine Aufbau einer Seite ist in head.html und body.html definiert. 
Allgemeine styles sind im styles Ordner zusammengefasst

Alle Popups, die von verschiedenen Seiten aus geöffnet werden sollen, sind
im popups Ordner definiert.

Im lib Ordner sind alle notwendigen Bibliotheken gespeichert, die nicht mit npm installiert werden
konnten.

Der eigentliche Inhalt der Seite liegt im components Order. Hier gibt es für jeden Unterbereich (Login, Configuration, Eingabe Ausgabe) der Seite
  einen eigenen Ordner.
  
### Imports

Einer der wichtigsten Ordner ist der imports Ordner. Hier liegt die ganze Logic, die für die Auswertung, Berechnung und Verschlüsselung zuständig ist.
  
Im api Ordner gibt es verschiedenen Module. Diese sind
   
#### AccountManagement
Ein Modul, das es einfach macht angemeldete User zu verwalten. Wird momentan nur clientseitig benutzt.
  Kann aber auch serverseitig verwendet werden.
#### Crypto
Hier sind alle Functionen definiert, die für die Verschlüsselung notwendig sind.
#### Database
 Die Datenbank ist so aufgebaut, dass für jeden Wettkampf eine Datenbank erstellt wird. Jede Datenbank enthällt die collections
 "accounts" und "athletes". Jeweils repräsentiert durch eine Datei in database/collections. Um wettkampfspezifische Collections zu erstellen gibt es die Funktion
  ContestCollection in collections/collections.js 
  
 Für allgemeine Daten gibt es die generic und die contests collection. Für wettkapfunabhängige Collections gibt es die Funktion Collection in collections/collections.js
  
 Um mit der Datenbank zu interagieren gibt es sowohl auf dem client als auch auf dem server das globale object Meteor.COLLECTIONS.
 
 Ein Client verbindet sich beim Laden der Seite automatisch mit allen wettkapfunabhängige Collections und mit der aktuellen
  wettkampfspezifische Collections. Das heißt der Client kann auf alle Informationen aus dem aktuellen Wettkampf nicht
   aber auf Informationen anderer Wettkämpfe zugreifen. Die Collections Objekte haben ein handle member, über den die
   Collection erreicht werden kann.
  
 Der Server verbindet sich mit allen Collections. Es gibt aber auch für die wettkampfspezifische Collections jeweils
  nur ein Collection Objekte. Intern wird aber eine Liste mit allen handels verwaltet. Mit der member fuction switch
   kann man dann den aktuellen handle wechseln, so dass anschließend alle Datenbankzugriffe auf die neue Collection zugreifen.
   Um alle wettkampfspezifische Collections gleichzeitig zu wechseln kann Meteor.COLLECTIONS.switch verwendet werden.

### Logic

im api/logic order befindet sich alles, um Athleten zu verwalten und ihre Punkte zu berechnen. Um die verschiedenen Wettbewerbstypen
abzudecken wird eine Pluginstruktur verwendet. Jede Wettkampfart ist in logic/contestTypes in Form einer Datei vorhanden.
Alle Plugins müssen in logic/contestType.js registriert werden. Daten wie Punktetabellen werden im imports/data Ordner gespeichert.


## Unit testing
### Executing tests
Um die Tests auszuführen starten sie die folgenden Programme und stellen sie sicher, dass kein anderer Server läuft.
* Server only (CLI):    `meteor test --driver-package dispatch:mocha`
* Both (WebUI):         `meteor test --driver-package practicalmeteor:mocha` -> `http://localhost:3000`
