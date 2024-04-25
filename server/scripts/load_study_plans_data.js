const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const programDetailsDirPath = path.join(__dirname, '..', 'data', 'PRF', 'programs');
const studyPlansDirPath = path.join(__dirname, '..', 'data', 'PRF', 'study_plans');

// Načte a uloží data studijních plánů
async function fetchStudyPlanData() {
  try {
    const files = await fs.readdir(programDetailsDirPath);

    for (const file of files) {
      const filePath = path.join(programDetailsDirPath, file);
      const data = await fs.readFile(filePath);
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

        const oborIdno = oborItem.oborIdno;
        const apiUrl = `https://stagservices.upol.cz/ws/services/rest2/predmety/getPredmetyByObor?oborIdno=${oborIdno}&outputFormat=JSON`;
        const response = await axios.get(apiUrl);
        const savePath = path.join(studyPlansDirPath, `${oborIdno}_studijni_plan.json`);

        await fs.writeFile(savePath, JSON.stringify(response.data, null, 2), 'utf8');

        console.log(`Data byla uložena pro obor s ID: ${oborIdno}`);
      }
    }
  } catch (error) {
    console.error('Chyba při ukládání detailu programu:', error);
  }
}

module.exports = fetchStudyPlanData;