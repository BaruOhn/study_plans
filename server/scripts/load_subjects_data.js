const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const subjectsDirPath = path.join(__dirname, '..', 'data', 'PRF', 'subjects');
const studyPlansDirPath = path.join(__dirname, '..', 'data', 'PRF', 'study_plans');

// Načte a uloží data předmětů
async function fetchSubjectData() {
  try {
    const studyPlansFiles = await fs.readdir(studyPlansDirPath);

    for (const file of studyPlansFiles) {
      const filePath = path.join(studyPlansDirPath, file);
      const data = await fs.readFile(filePath, 'utf8');
      const studyPlan = JSON.parse(data);

      for (const subject of studyPlan.predmetOboru) {
        if (!subject.katedra || !subject.zkratka) {
          console.error(`Katedra nebo zkratka nebyla nalezena pro předmět: ${subject}`);
          continue;
        }

        const { katedra, zkratka } = subject;
        const apiUrl = `https://stagservices.upol.cz/ws/services/rest2/predmety/getPredmetInfo?katedra=${katedra}&zkratka=${zkratka}&outputFormat=JSON`;
        const response = await axios.get(apiUrl);
        const subjectData = response.data;
        const subjectFilePath = path.join(subjectsDirPath, `${katedra}_${zkratka}.json`);

        await fs.writeFile(subjectFilePath, JSON.stringify(subjectData, null, 2), 'utf8');

        console.log(`Data pro předmět ${katedra}/${zkratka} byla uložena.`);
      }
    }
  } catch (error) {
    console.error('Chyba při načítání dat předmětů:', error);
  }
}

module.exports = fetchSubjectData;
