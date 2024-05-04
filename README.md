# study_plans
Tento soubor obsahuje návod ke spuštění aplikace Přehled nabídky studia, která vznikla v rámci bakalářské práce a slouží k vizualizaci studijních programů a jejich studijních plánů realizovaných na Přírodovědecké fakultě Univerzity Palackého v Olomouci.

## Předpoklady
Pro vývoj a testování byly použity následující verze Node.js a npm:
- Node.js (v20.5.0) 
- npm (9.8.0)

## Spuštění aplikace
Před spuštěním aplikace se ujistěte, že máte na svém systému nainstalováno Node.js a npm. 

### Instalace závislostí
Přejděte do adresáře projektu study_plans a nainstalujte požadované balíčky npm pomocí následujícího příkazu:

` npm install`

### Lokálně
Pro spuštění aplikace lokálně použijte následující příkaz:

` npm start `

Aplikace bude dostupná na adrese http://localhost:3000.

### Vzdálený server
Pro nasazení na vzdálený server postupujte následovně:

1. Zkopírujte zdrojový kód na váš server.
2. Nainstalujte Node.js a npm na serveru.
3. Přejděte do adresáře projektu.
4. Nainstalujte závislosti pomocí npm install.
5. Spusťte server pomocí npm start.
6. Aplikace bude přístupná na adrese http://adresa_vašeho_serveru:3000.

Pokud dojde k chybě při spuštění serveru, přejděte do adresáře projektu a přeinstalujte knihovnu bcrypt pomocí:
` npm uninstall bcrypt `
` npm install bcrypt ` 

#### Závislosti pro Puppeteer (Ubuntu)

Pokud nasazujete na Ubuntu server, budou potřeba další závislosti pro knihovnu Puppeteer (např. Chromium). Nainstalujte je pomocí:

` sudo apt-get install -y chromium-browser `

## Dostupné skripty
V adresáři projektu můžete spustit následující skripty:

Sestavení CSS: Kompiluje Tailwind CSS pro produkční použití.

` npm run build:css `

Sledování CSS: Nepřetržitě kompiluje Tailwind CSS během vývoje.

` npm run watch:css `

## Testovací verze
Pro testování je aplikace dostupná na následující adrese:

http://158.194.92.101:3000/

### Přihlašovací údaje testovacího uživatele
Pro účely testování lze použít následující přihlašovací údaje:

- E-mail: test@upol.cz
- Heslo: heslo

## Další informace
Tato aplikace využívá následující klíčové knihovny:

- Express: Webový framework pro Node.js.
- Axios: HTTP klient pro provádění API požadavků.
- bcrypt: Knihovna pro hashování hesel.
- node-cron: Plánování úloh v Node.js.
- Puppeteer: Generování PDF dokumentů.
  
Podrobnější informace o závislostech a skriptech jsou dostupné v souboru package.json.





