const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const oboryDir = path.join(__dirname, '..', 'data', 'PRF', 'obory');
const studijniPlanyDir = path.join(__dirname, '..', 'data', 'PRF', 'studijni_plany');
console.log(`oboryDir: ${oboryDir}`);
console.log(`studijniPlanyDir: ${studijniPlanyDir}`);

async function loadAndSaveOborData() {
  try {
    const files = await fs.readdir(oboryDir);

    // Loop through each file
    for (const file of files) {

      const filePath = path.join(oboryDir, file);
      const data = await fs.readFile(filePath);
      const obor = JSON.parse(data);

      // Check if oborInfo is defined and has at least one item
      if (!obor.oborInfo || !obor.oborInfo.length || !obor.oborInfo[0].oborIdno) {
        console.error(`Invalid or missing oborInfo for file: ${file}`);
        continue; // Skip this file and move to the next one
      }

      // Extract the oborIdno and construct the endpoint URL
      const oborIdno = obor.oborInfo[0].oborIdno;
      const url = `https://stagservices.upol.cz/ws/services/rest2/predmety/getPredmetyByObor?oborIdno=${oborIdno}&outputFormat=JSON`;

      // Fetch the data from the endpoint
      const response = await axios.get(url);

      // Construct the file path for saving the data
      const savePath = path.join(studijniPlanyDir, `${oborIdno}_studijni_plan.json`);

      // Save the fetched data to the file
      await fs.writeFile(savePath, JSON.stringify(response.data, null, 2), 'utf8');

      console.log(`Data for oborIdno ${oborIdno} saved to ${savePath}`);

    }
  } catch (error) {
    console.error('Error loading and saving obor data:', error);
  }
}

loadAndSaveOborData();
