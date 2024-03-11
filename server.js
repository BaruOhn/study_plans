const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Nastavení cesty pro statické soubory
app.use(express.static(path.join(__dirname, 'client')));

// Nastavení cesty na domovskou stránku
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/index.html'));
});

// Endpoint pro získání dat studijních programů
app.get('/data/:faculty/:faculty_studijni_programy.json', (req, res) => {
    const facultyParam = req.params.faculty_studijni_programy.split('_')[0];
    
    if (!facultyParam) {
        return res.status(400).send('Faculty parameter is missing in the request');
    }
    
    const faculty = facultyParam.toUpperCase();
    const filePath = path.join(__dirname, `server/data/${faculty}`, `${faculty}_studijni_programy.json`);
    
    res.sendFile(filePath, function(err) {
        if (err) {
            return res.status(404).send('Nelze najít soubor: ' + filePath);
        }
    });
});

// Endpoint pro získání detailů studijního programu
app.get('/data/:faculty/obory/:stprIdno', (req, res) => {
    const faculty = req.params.faculty;
    const stprIdno = req.params.stprIdno;
    const filePath = path.join(__dirname, `server/data/${faculty}/obory`, `${stprIdno}_obory.json`);
    
    res.sendFile(filePath, function(err) {
        if (err) {
            return res.status(404).send('Nelze najít soubor: ' + filePath);
        }
    });
});

// Endpoint pro získání studijního plánu
app.get('/data/:faculty/studijni_plany/:oborIdno', (req, res) => {
    const faculty = req.params.faculty;
    const oborIdno = req.params.oborIdno;
    const filePath = path.join(__dirname, `server/data/${faculty}/studijni_plany`, `${oborIdno}_studijni_plan.json`);
    
    res.sendFile(filePath, function(err) {
        if (err) {
            return res.status(404).send('Nelze najít soubor: ' + filePath);
        }
    });
});

// Endpoint pro zobrazení detailu předmětu
app.get('/data/:faculty/predmety/:predmetIdno', (req, res) => {
    const faculty = req.params.faculty;
    const predmetIdno = req.params.predmetIdno;
    const filePath = path.join(__dirname, `server/data/${faculty}/predmety`, `${predmetIdno}.json`);
    
    res.sendFile(filePath, function(err) {
        if (err) {
            return res.status(404).send('Nelze najít soubor: ' + filePath);
        }
    });
});

// Spuštění serveru
app.listen(port, () => {
    console.log(`Server běží na http://localhost:${port}`);
});
