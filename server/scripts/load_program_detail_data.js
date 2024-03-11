const fs = require('fs').promises;
const axios = require('axios');
const path = require('path');

// Funkce pro načtení oborů studijních programů
async function fetchProgramDetails(faculty) {
    const facultyDataPath = path.join(__dirname, '..', 'data', faculty, `${faculty}_studijni_programy.json`);
    try {
        // Načtení dat studijních programů
        const data = JSON.parse(await fs.readFile(facultyDataPath, 'utf8'));
        for (const type in data) {
            for (const programName in data[type]) {
              const program = data[type][programName];
              for (const programId in program) {
                const stprIdno = program[programId].stprIdno;
                if (stprIdno) {
                  await saveProgramDetails(faculty, stprIdno);
                } else {
                  console.error(`stprIdno nebylo nalezeno pro program: ${programName}`);
                }
              }
            }
          }
          
    } catch (error) {
        console.error('Chyba při načítání nebo zpracování dat fakulty:', error);
    }
}

// Funkce pro uložení seznamu oborů studijních programů
async function saveProgramDetails(faculty, stprIdno) {
    const apiUrl = `https://stagservices.upol.cz/ws/services/rest2/programy/getOboryStudijnihoProgramu?outputFormat=JSON&stprIdno=${stprIdno}`;
    try {
        const response = await axios.get(apiUrl);
        const details = response.data;
        const detailsPath = path.join(__dirname, '..', 'data', faculty, 'obory', `${stprIdno}_obory.json`);
        await fs.writeFile(detailsPath, JSON.stringify(details, null, 2));
        console.log(`Data byla uložena pro program s ID: ${stprIdno}`);
    } catch (error) {
        console.error(`Chyba při získávání nebo ukládání detailů pro stprIdno ${stprIdno}:`, error);
    }
}

fetchProgramDetails('PRF'); 
