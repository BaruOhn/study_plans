const fs = require('fs');
const axios = require('axios');
const path = require('path');

const subjectsDirPath = path.join (__dirname, '..', 'data', 'PRF', 'predmety');
const studyPlansDirPath = path.join (__dirname, '..', 'data', 'PRF', 'studijni_plany');

// Načte data pro všechny předměty z jednotlivých studijních plánů a uloží je do souborů
async function loadSubjectData() {
  try {
    const studyPlansFiles = fs.readdirSync(studyPlansDirPath);
    for (const file of studyPlansFiles) {
      const filePath = path.join(studyPlansDirPath, file);
      const studyPlan = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      for (const subject of studyPlan.predmetOboru) {
        const { katedra, zkratka } = subject;
        const apiUrl = `https://stagservices.upol.cz/ws/services/rest2/predmety/getPredmetInfo?katedra=${katedra}&zkratka=${zkratka}&outputFormat=JSON`;
        const response = await axios.get(apiUrl);
        const subjectData = response.data;
        const subjectFilePath = path.join(subjectsDirPath, `${zkratka}.json`);
        fs.writeFileSync(subjectFilePath, JSON.stringify(subjectData, null, 2));
        console.log(`Data pro předmět ${zkratka} byla uložena.`);
      }
    }
  } catch (error) {
    console.error('Chyba při načítání dat:', error);
  }
}

loadSubjectData();
