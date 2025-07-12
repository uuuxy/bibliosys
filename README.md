# bibliosys-50k
Modernes Bibliothekssystem für 50.000 Bücher
README.md

Deutsch

Projektstatus: Bibliotheksanwendung

Dies ist die aktuelle und definitive Übersicht über den Status unserer Bibliotheksanwendung – was bereits fertig ist und was als Nächstes ansteht.

Teil 1: Fertige und implementierte Funktionen

Ausleihe & Rückgabe:
Intelligente Universal-Suche: Eine zentrale Suchleiste auf der Startseite erkennt Schüler-IDs, Buch-Barcodes und Namen und zeigt sofort die relevanten Informationen an. (Fertig)
Anzeige von überfälligen Büchern: Überfällige Bücher werden in der Detailansicht eines Schülers deutlich rot markiert. (Fertig)
Flexible globale Verlängerung: Eine eigene Verwaltungsseite ermöglicht die gezielte Verlängerung der Leihfrist für ganze Buchsätze (nach Signatur oder Fach). (Fertig)
Stapel-Löschung (Bulk-Delete): Mehrere Bücher können in der Bestandsübersicht gleichzeitig ausgewählt und gelöscht werden. (Fertig)
Schnellrückgabe-Modus: Implementiert. (Fertig)
Letzte Ausleihen bearbeiten (120-Minuten-Regel): Nicht implementiert.
Buch- & Bestandsverwaltung:
Vollständige Buch-Verwaltung (CRUD): Bücher können angelegt, bearbeitet und gelöscht werden. (Fertig)
Visuelle Bestandsübersicht: Eine Ansicht zeigt den Buchbestand mit Cover-Bildern, Filterung nach Fächern und einer Zählung der verfügbaren Exemplare. (Fertig)
Automatische Cover-Suche: Das System kann per Knopfdruck über die ISBN automatisch Buch-Cover aus dem Internet laden und speichern. (Fertig)
Signatur-System: Jedes Buch kann eine Signatur (z.B. "MAT-9") erhalten, die auch mehrfach vergeben werden kann. (Fertig)
Inventurmodus: Implementiert. (Fertig)
Schüler- & Benutzerverwaltung:
Vollständige Schüler-Verwaltung (CRUD): Schüler können manuell angelegt, bearbeitet und gelöscht werden. (Fertig)
Schüler-Import per Excel: Eine Funktion zum Importieren von Schülerlisten aus XLSX-Dateien ist vorhanden. (Fertig)
Professionelle Foto-App: Fotos von Schülern können per Webcam aufgenommen, der Ausschnitt frei gewählt (zoomen/verschieben) und das Bild verzerrungsfrei gespeichert werden. (Fertig)
Vollständige Benutzerverwaltung: Admins können andere App-Benutzer (Bibliothekare) anlegen, deren Rollen und Rechte verwalten und sie aktivieren/deaktivieren. (Fertig)
Bestellwesen:
Anbieterverwaltung: Eine Liste der Lieferanten kann gepflegt werden. (Fertig)
Bestellungen anlegen: Neue Bestellungen mit mehreren Artikeln können angelegt und in der Datenbank gespeichert werden. (Fertig)
Automatische Metadaten-Suche: Bei der Bestellung werden über die ISBN automatisch Titel und Autor aus dem Internet geholt und geprüft, ob das Buch bereits im Bestand ist. (Fertig)
Lieferungen freischalten: Gelieferte Artikel können in einer Bestellung freigeschaltet werden, wodurch die Bücher automatisch im Bestand angelegt werden. (Fertig)
Barcode-Druck für Lieferanten: Eine spezielle Druckansicht erzeugt echte, grafische Barcodes für neue Bücher. Etiketten-Format kann ausgewählt und die Seite als PDF gespeichert werden, um sie an Lieferanten zu schicken. (Fertig)
Zusätzliche Funktionen & Technische Grundlagen:
Ausweis-Designer & Einzeldruck: Eine Ansicht zeigt einen fertigen Schülerausweis mit Foto und Daten an, der gedruckt werden kann. (Fertig)
Gleichzeitige Nutzung auf mehreren PCs: Die Server-Client-Architektur mit zentraler Datenbank unterstützt dies. (Fertig)
Ausweis-Stapeldruck: Nicht implementiert.
Teil 2: Zukünftiger Fahrplan (Was noch fehlt)

Phase 3: Fortgeschrittene Bibliotheks-Logik & Komfort
Berichtsfunktionen: Erstellung von anpassbaren Berichten und Statistiken (z.B. "Welche Bücher wurden am häufigsten ausgeliehen?").
Phase 4: System-Integration
Öffentlicher Katalog: Erstellung einer öffentlichen, teilbaren Ansicht des Bestands für Schüler und Eltern.
Schnittstelle zu Schulverwaltungssystemen: Eine Schnittstelle zum automatischen Import und zur Synchronisation von Schülerdaten.
English

Project Status: Library Application

This is the definitive and current overview of our library application's status – what's already finished and what's next.

Part 1: Completed and Implemented Features

We have created a fully functional, database-driven application with a modern, clean code structure.

Lending & Return:
Smart Universal Search: The homepage features a central search bar that recognizes student IDs, book barcodes, and names, instantly displaying the correct information. (Completed)
Overdue Books Display: In a student's detailed view, overdue books are clearly marked in red. (Completed)
Flexible Global Extension: A dedicated administration page allows for targeted extension of the loan period for entire sets of books (by signature or subject). (Completed)
Bulk Delete: Multiple books can be selected and deleted at once from the inventory overview. (Completed)
Quick Return Mode: Implemented. (Completed)
Edit Recent Loans (120-Minute Rule): Not implemented.
Book & Inventory Management:
Full Book Management (CRUD): You can create, edit, and delete books. (Completed)
Visual Inventory Overview: A dedicated view displays the book inventory with cover images, filtering by subjects, and a count of available copies. (Completed)
Automatic Cover Search: The system can automatically load and save book covers from the internet via ISBN with a single click. (Completed)
Signature System: Each book can receive a signature (e.g., "MAT-9"), which can also be assigned multiple times. (Completed)
Inventory Mode: Implemented. (Completed)
Student & User Management:
Full Student Management (CRUD): You can manually create, edit, and delete students. (Completed)
Student Import via Excel: A function for importing student lists from XLSX files is available. (Completed)
Professional Photo App: You can take photos of students via webcam, freely select the crop (zoom/move), and save the image without distortion. (Completed)
Full User Management: Admins can create other app users (librarians), manage their roles and rights, and activate/deactivate them. (Completed)
Ordering System:
Supplier Management: You can maintain a list of your suppliers. (Completed)
Create Orders: You can create a new order with multiple items and save it to the database. (Completed)
Automatic Metadata Search: When ordering, the system automatically retrieves titles and authors from the internet via ISBN and checks if the book is already in stock. (Completed)
Release Deliveries: You can release delivered items in an order, which automatically adds the books to the inventory. (Completed)
Barcode Printing for Suppliers: A special print view generates actual, graphical barcodes for new books. You can select the label format and save the page as a PDF to send to suppliers. (Completed)
Additional Features & Technical Foundations:
ID Card Designer & Single Print: A view displays a ready-to-print student ID card with photo and data. (Completed)
Simultaneous Use on Multiple PCs: The server-client architecture with a central database supports this. (Completed)
Batch ID Card Printing: Not implemented.
Part 2: Future Roadmap (What's Still Missing)

Phase 3: Advanced Library Logic & Convenience
Reporting Functions: Creation of customizable reports and statistics (e.g., "Which books were borrowed most frequently?").
Phase 4: System Integration
Public Catalog: Creation of a public, shareable view of the inventory for students and parents.
Interface to School Administration Systems: An interface for automatic import and synchronization of student data.
# bibliothek-vue

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
