const axios = require('axios');
const fs = require('fs').promises;
const apiUrl = 'https://stagservices.upol.cz/ws/services/rest2/programy/getStudijniProgramy?pouzePlatne=TRUE&outputFormat=JSON&fakulta=PRF';

// Načte a uloží data o studijních programech
async function fetchProgramsData() {
  try {
    const response = await axios.get(apiUrl);
    const data = response.data.programInfo;
    const structuredData = {
      Bakalářský: {},
      Navazující: {},
      Doktorský: {},
    };

    data.forEach(program => {
      const key = program.stprIdno;
      const nazev = program.nazev;
      const typ = program.typ;

      // Inicializace objektu pro daný typ programu, pokud neexistuje
      if (!structuredData[typ]) {
        structuredData[typ] = {};
      }

      // Inicializace objektu pro daný název programu, pokud neexistuje
      if (!structuredData[typ][nazev]) {
        structuredData[typ][nazev] = {};
      }
      structuredData[typ][nazev][key] = program;
    });

    // Uložení do souboru
    await fs.writeFile('server/data/PRF/PRF_studijni_programy.json', JSON.stringify(structuredData, null, 2));
    console.log('Data byla úspěšně uložena pro fakultu PRF.');
  } catch (error) {
    console.error('Chyba při načítání nebo ukládání dat programu pro fakultu PRF:', error);
  }
}

module.exports = fetchProgramsData;