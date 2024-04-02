const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const programDetailsDirPath = path.join(__dirname, '..', 'data', 'PRF', 'obory');
const plansBlocksDirPath = path.join(__dirname, '..', 'data', 'PRF', 'bloky_planu');

// Načtení a uložení dat bloků plánu
async function fetchPlansBlocksData() {
  try {
    const files = await fs.readdir(programDetailsDirPath);

    for (const file of files) {
      // Extrahování stprIdno z názvu souboru
      const stprIdno = file.split('_')[0];

      const filePath = path.join(programDetailsDirPath, file);
      const data = await fs.readFile(filePath, 'utf8');
      const obor = JSON.parse(data);

      if (!obor.oborInfo || obor.oborInfo.length === 0) {
        console.error(`oborInfo nebylo nalezeno pro obor: ${file}`);
        continue;
      }

      for (const oborItem of obor.oborInfo) {
        if (!oborItem.oborIdno) {
          console.error(`oborIdno nebylo nalezeno pro obor: ${file}`);
          continue;
        }

        // stplIdno je identické se stprIdno
        const apiUrl = `https://stagservices.upol.cz/ws/services/rest2/programy/getBlokyPlanu?stplIdno=${stprIdno}&outputFormat=JSON`;
        const response = await axios.get(apiUrl);

        const savePath = path.join(plansBlocksDirPath, `${stprIdno}_bloky_planu.json`);
        await fs.writeFile(savePath, JSON.stringify(response.data, null, 2), 'utf8');

        console.log(`Data o blocích plánu byla uložena pro obor s ID: ${stprIdno}`);
      }
    }
  } catch (error) {
    console.error(`Chyba při načítání a ukládání dat bloků plánu`, error);
  }
}

module.exports = fetchPlansBlocksData;
