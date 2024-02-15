const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'client')));

// Endpoint pro JSON data studijních programů pro všechny fakulty
app.get('/data/:faculty_studijni_programy.json', (req, res) => {
    const facultyParam = req.params.faculty;
    
    if (!facultyParam) {
        // Pokud facultyParam není definován, odešlete chybu
        return res.status(400).send('Faculty parameter is missing in the request');
    }
    
    const faculty = facultyParam.toUpperCase();
    const filePath = path.join(__dirname, 'server/data', `${faculty}_studijni_programy.json`);
    
    res.sendFile(filePath, function(err) {
        if (err) {
            // Pokud dojde k chybě, jako je soubor nenalezen, odešlete chybu 404
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
