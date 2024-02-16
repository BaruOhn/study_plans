const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'client')));

// Endpoint pro JSON data studijních programů pro všechny fakulty
app.get('/data/:faculty_studijni_programy.json', (req, res) => {
    const facultyParam = req.params.faculty_studijni_programy.split('_')[0];
    
    if (!facultyParam) {
        return res.status(400).send('Faculty parameter is missing in the request');
    }
    
    const faculty = facultyParam.toUpperCase();
    const filePath = path.join(__dirname, 'server/data', `${faculty}_studijni_programy.json`);
    
    res.sendFile(filePath, function(err) {
        if (err) {
            return res.status(404).send('Nelze najít soubor: ' + filePath);
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/index.html'));
});

app.listen(port, () => {
    console.log(`Server běží na http://localhost:${port}`);
});
