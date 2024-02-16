const axios = require('axios');
const fs = require('fs');
const endpoint = 'https://stagservices.upol.cz/ws/services/rest2/programy/getStudijniProgramy?pouzePlatne=TRUE&outputFormat=JSON&fakulta=FTK';

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
      const typ = program.typ.toLowerCase(); // Předpokládá, že typy jsou 'Bakalářský', 'Magisterský', 'Doktorský'

      // Opravená část: Zajištění, že objekt pro typ a název existuje
      if (!structuredData[typ]) {
        structuredData[typ] = {}; // Inicializace objektu pro daný typ, pokud neexistuje
      }
      if (!structuredData[typ][nazev]) {
        structuredData[typ][nazev] = {}; // Inicializace objektu pro daný název, pokud neexistuje
      }

      // Nyní je zaručeno, že cesta structuredData[typ][nazev] existuje
      structuredData[typ][nazev][key] = program;
    });

    // Uložení do souboru
    fs.writeFile('server/data/FTK/FTK_studijni_programy.json', JSON.stringify(structuredData, null, 2), (err) => {
      if (err) throw err;
      console.log('Data byla úspěšně uložena.');
    });
  })
  .catch(error => {
    console.error('Došlo k chybě při načítání dat:', error);
  });


  //Super, dekuji. Uspesne se mi podarilo nacist data programu. Dale bych potrebovala, aby se dynamicky podle toho, jaka je v menu zvolena fakulta nacetly data prislusne fakulty ze souboru, ktery ma vzdy nazev ve tvaru "zkratka_fakulty"_studijni_programy.json, kde "zkratka fakulty je PDF - pedagogicka, PRF- prirodovedecka, FTK - fakulta telesne kultury a FZV - fakulta zdravotnickych ved