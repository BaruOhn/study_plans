const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
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
app.get('/data/:faculty/predmety/:department/:acronym', (req, res) => {
    const department = req.params.department;
    const acronym = req.params.acronym;
    const faculty = req.params.faculty;
    const filePath = path.join(__dirname, `server/data/${faculty}/predmety`, `${department}_${acronym}.json`);
    
    res.sendFile(filePath, function(err) {
        if (err) {
            return res.status(404).send('Nelze najít soubor: ' + filePath);
        }
    });
});

app.get('/generate_pdf', async (req, res) => {
    // Příjem parametrů z query
    const { oborIdno, faculty, stprIdno } = req.query;
    
    if (!oborIdno || !faculty || !stprIdno) {
        return res.status(400).send('Chybějící parametry.');
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Sestavení URL s potřebnými parametry
    const url = `http://localhost:3000/study_plan.html?oborIdno=${oborIdno}&faculty=${faculty}&stprIdno=${stprIdno}`;

    try {
        await page.goto(url, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=study_plan.pdf');
        res.send(pdf);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Chyba při generování PDF.');
    } finally {
        await browser.close();
    }
});


// Spuštění serveru
app.listen(port, () => {
    console.log(`Server běží na http://localhost:${port}`);
});
