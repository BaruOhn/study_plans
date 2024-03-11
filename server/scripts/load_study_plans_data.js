const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const oboryDir = path.join(__dirname, '..', 'data', 'PRF', 'obory');
const studijniPlanyDir = path.join(__dirname, '..', 'data', 'PRF', 'studijni_plany');

async function loadAndSaveOborData() {
  try {
    const files = await fs.readdir(oboryDir);

    for (const file of files) {
      const filePath = path.join(oboryDir, file);
      const data = await fs.readFile(filePath);
      const obor = JSON.parse(data);

      if (!obor.oborInfo || obor.oborInfo.length === 0) {
        console.error(`Invalid or missing oborInfo for file: ${file}`);
        continue; // Skip this file and move to the next one
      }

      // Process each oborIdno in the oborInfo array
      for (const oborItem of obor.oborInfo) {
        if (!oborItem.oborIdno) {
          console.error(`Missing oborIdno in file: ${file}`);
          continue; // Skip to the next oborItem
        }

        const oborIdno = oborItem.oborIdno;
        const apiUrl = `https://stagservices.upol.cz/ws/services/rest2/predmety/getPredmetyByObor?oborIdno=${oborIdno}&outputFormat=JSON`;

        // Fetch the data from the endpoint
        const response = await axios.get(apiUrl);

        // Construct the file path for saving the data
        const savePath = path.join(studijniPlanyDir, `${oborIdno}_studijni_plan.json`);

        // Save the fetched data to the file
        await fs.writeFile(savePath, JSON.stringify(response.data, null, 2), 'utf8');

        console.log(`Data for oborIdno ${oborIdno} saved to ${savePath}`);
      }
    }
  } catch (error) {
    console.error('Error loading and saving obor data:', error);
  }
}

loadAndSaveOborData();
