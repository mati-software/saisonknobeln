# Saisonknobeln
Simple jam game written in HTML/JS for the tiltspot.tv platform

## Status

Early version. No interaction yet. Only german.

Saisonknobeln ist aktuell noch kein Spiel, sondern in einem frühen Stadium. Man sieht lediglich alle verbundenen Spieler in einer Liste. Interaktionsmöglichkeiten gibt es noch keine.

## Nötige Tools zum lokalen ausführen

### node.js

Download: https://nodejs.org

### Tiltspot Game Tester

Website: https://dev.tiltspot.tv/

Download: https://dev.tiltspot.tv/getting_started/game_tester

Nach dem Download und dem Entpacken mit node.js in das entpackte Verzeichnis wechseln und dort

`npm install`

ausführen. Anschließend die `config.js` in einem Texteditor anpasse. Bei `Server_IP` die IP-Adresse des eigenen Rechners eingeben, also irgendwas a la `192.168.xxx.xxx`. Den `Server_Port` kann man auf `80` ändern. Bei `Path_To_Game`, `Path_To_Controller` und `Path_To_Assets` den Pfad zu den drei Ordnern von Saisonknobeln angaben. Backslashes müssen doppelt geschrieben werden. Also z. B. sowas wie:

`Path_To_Game: "D:\\tiltspot-games\\Saisonknobeln\\game"`

## Spiel testen

Im Command-Line-Tool von node.js in den Ordner des Tiltspot Game Testers wechseln. Dort dann das Programm starten via:

`node app.js`

Beim ersten Anstarten fragt die Windows-Firewall ggf. nach, ob sie den Zugriff über diesen Port erlauben soll, was man bestätigen muss.

Anschließend im Browser die eigene IP-Adresse aufrufen. Es öffnet sich der Game Tester samt der Hauptansicht von Saisonknobeln. Per Smartphones im lokalen Netz oder per emuliertem Smartphone (Entwicklertools von z. B. Firefox oder Chrome) kann die Controller-Ansicht geöffnet werden. Die Smartphones sind automatisch mit dem Game Tester verbunden. Mit dem Button oben rechts kann man das Spiel starten.

Es ist wichtig, dass man das Spiel erst startet, nachdem die Smartphones bereits verbunden sind. Da Tiltspot noch in Entwicklung ist, funktioniert das spätere Verbinden nicht.
