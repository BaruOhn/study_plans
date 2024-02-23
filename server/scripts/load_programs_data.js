const axios = require('axios');
const fs = require('fs');
const endpoint = 'https://stagservices.upol.cz/ws/services/rest2/programy/getStudijniProgramy?pouzePlatne=TRUE&outputFormat=JSON&fakulta=PRF';

axios.get(endpoint)
  .then(response => {
    const data = response.data.programInfo;
    const structuredData = {
      bakalářský: {},
      navazující: {},
      doktorský: {},
      rigorózní: {},
      celoživotní: {}
    };

    data.forEach(program => {
      const key = program.stprIdno;
      const nazev = program.nazev;
      const typ = program.typ.toLowerCase();

      if (!structuredData[typ]) {
        structuredData[typ] = {}; // Inicializace objektu pro daný typ, pokud neexistuje
      }
      if (!structuredData[typ][nazev]) {
        structuredData[typ][nazev] = {}; // Inicializace objektu pro daný název, pokud neexistuje
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