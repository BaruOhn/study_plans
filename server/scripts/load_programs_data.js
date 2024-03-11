const axios = require('axios');
const fs = require('fs');
const apiUrl = 'https://stagservices.upol.cz/ws/services/rest2/programy/getStudijniProgramy?pouzePlatne=TRUE&outputFormat=JSON&fakulta=PRF';

async function fetchProgramsData() {
  axios.get(apiUrl)
    .then(response => {
      const data = response.data.programInfo;
      const structuredData = {
        bakalářský: {},
        navazující: {},
        doktorský: {},
      };

      data.forEach(program => {
        const key = program.stprIdno;
        const nazev = program.nazev;
        const typ = program.typ.toLowerCase();

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
      fs.writeFile('server/data/PRF/PRF_studijni_programy.json', JSON.stringify(structuredData, null, 2), (err) => {
        if (err) throw err;
        console.log('Data byla úspěšně uložena.');
      });
    })
    .catch(error => {
      console.error('Došlo k chybě při načítání dat:', error);
    });
}

fetchProgramsData();
