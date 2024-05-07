const puppeteer = require('puppeteer-core');
const express = require('express');
const fs = require('fs').promises;
const cron = require('node-cron');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const port = 3000;

let lastUpdateDate = null;
const faculty = 'PRF';

const fetchProgramsData = require('./server/scripts/load_programs_data');
const fetchProgramDetails = require('./server/scripts/load_program_detail_data');
const fetchStudyPlanData = require('./server/scripts/load_study_plans_data');
const fetchSubjectData = require('./server/scripts/load_subjects_data');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Načtení uživatelů při spuštění serveru
let users = [];
fs.readFile('server/data/PRF/users.json', 'utf8')
    .then(data => {
        users = JSON.parse(data);
    })
    .catch(err => {
        console.error('Chyba při načítání souboru uzivatele.json:', err);
    });

// Načtení dat studijních programů v 00:00 každý den
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Stahuji data studijních programů...');
        await fetchProgramsData();
        lastUpdateDate = new Date();
    } catch (error) {
        console.error('Došlo k chybě při stahování dat studijních programů:', error);
    }
}, {
    scheduled: true,
    timezone: 'Europe/Prague'
});

// Načtení detailů studijních programů v 1:00 každý den
cron.schedule('0 1 * * *', async () => {
    try {
        console.log('Stahuji detaily studijních programů...');
        await fetchProgramDetails();
        console.log('Data s detaily studijních programů byla úspěšně stažena.');
    } catch (error) {
        console.error('Došlo k chybě při stahování detailů studijních programů:', error);
    }
}, {
    scheduled: true,
    timezone: 'Europe/Prague'
});

// Načtení dat studijních plánů v 2:00 každý den
cron.schedule('0 2 * * *', async () => {
    try {
        console.log('Stahuji data studijních plánů...');
        await fetchStudyPlanData();
        console.log('Data studijních plánů byla úspěšně stažena.');
    } catch (error) {
        console.error('Došlo k chybě při stahování dat studijních plánů:', error);
    }
}, {
    scheduled: true,
    timezone: 'Europe/Prague'
});

// Načtení dat předmětů v 3:00 každý den
cron.schedule('0 3 * * *', async () => {
    try {
        console.log('Stahuji data předmětů...');
        await fetchSubjectData();
        console.log('Data předmětů byla úspěšně stažena.');
    } catch (error) {
        console.error('Došlo k chybě při stahování dat předmětů:', error);
    }
}, {
    scheduled: true,
    timezone: 'Europe/Prague'
});

// Nastavení cesty pro statické soubory
app.use(express.static(path.join(__dirname, 'client')));

// Nastavení cesty na domovskou stránku
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/index.html'));
});

// Endpoint pro získání data poslední aktualizace dat
app.get('/last-update', (req, res) => {
    res.json({ lastUpdate: lastUpdateDate });
});

// Endpoint pro přihlášení
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Hledání uživatele
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ message: "Neplatné přihlašovací údaje." });
    }

    // Porovnání hesel
    bcrypt.compare(password, user.password, function (err, isMatch) {
        if (err) {
            console.error("Chyba při ověřování hesla:", err);
            return res.status(500).json({ message: "Interní chyba serveru." });
        }
        if (isMatch) {
            const { password, ...userWithoutPassword } = user;
            res.json({ user: userWithoutPassword });
        } else {
            res.status(401).json({ message: "Neplatné přihlašovací údaje." });
        }
    });
});

// Endpoint pro získání dat studijních programů
app.get('/data/:faculty/:faculty_studijni_programy.json', (req, res) => {
    const facultyParam = req.params.faculty_studijni_programy.split('_')[0];

    if (!facultyParam) {
        return res.status(400).send('Chybějící parametr fakulta.');
    }

    const faculty = facultyParam.toUpperCase();
    const filePath = path.join(__dirname, `server/data/${faculty}`, `${faculty}_studijni_programy.json`);

    res.sendFile(filePath, function (err) {
        if (err) {
            return res.status(404).send('Nelze najít soubor: ' + filePath);
        }
    });
});

// Endpoint pro získání detailů studijního programu
app.get('/data/:faculty/programs/:stprIdno', (req, res) => {
    const faculty = req.params.faculty;
    const stprIdno = req.params.stprIdno;
    const filePath = path.join(__dirname, `server/data/${faculty}/programs`, `${stprIdno}_obory.json`);

    res.sendFile(filePath, function (err) {
        if (err) {
            return res.status(404).send('Nelze najít soubor: ' + filePath);
        }
    });
});

// Endpoint pro získání studijního plánu
app.get('/data/:faculty/study_plans/:oborIdno', (req, res) => {
    const faculty = req.params.faculty;
    const oborIdno = req.params.oborIdno;
    const filePath = path.join(__dirname, `server/data/${faculty}/study_plans`, `${oborIdno}_studijni_plan.json`);

    res.sendFile(filePath, function (err) {
        if (err) {
            return res.status(404).send('Nelze najít soubor: ' + filePath);
        }
    });
});

// Endpoint pro zobrazení detailu předmětu
app.get('/data/:faculty/subjects/:department/:acronym', (req, res) => {
    const department = req.params.department;
    const acronym = req.params.acronym;
    const faculty = req.params.faculty;
    const filePath = path.join(__dirname, `server/data/${faculty}/subjects`, `${department}_${acronym}.json`);

    res.sendFile(filePath, function (err) {
        if (err) {
            return res.status(404).send('Nelze najít soubor: ' + filePath);
        }
    });
});

app.get('/generate_pdf', async (req, res) => {
    // Příjem parametrů z query
    const { oborIdno, faculty, stprIdno } = req.query;

    if (!oborIdno || !faculty || !stprIdno) {
        return res.status(400).send('Chybějící parametry v URL.');
    }

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser'
    })
    const page = await browser.newPage();
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

// GET endpoint pro získání preferencí programů
app.get('/get_program_preferences', async (req, res) => {
    const filePath = path.join(__dirname, `server/data/${faculty}`, `program_preferences.json`);

    try {
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error(err);
        res.status(500).send('Chyba při načítání preferencí programů.');
    }
});

// POST endpoint pro uložení preferencí programů
app.post('/save_program_preferences', async (req, res) => {
    const filePath = path.join(__dirname, `server/data/${faculty}`, `program_preferences.json`);
    const newData = req.body;

    try {
        let existingData;
        try {
            const data = await fs.readFile(filePath, 'utf8');
            existingData = JSON.parse(data);
        } catch (readError) {
            existingData = {};
        }

        existingData[newData.stprIdno] = newData.preference;

        await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
        res.json({ message: 'Preference programů byly úspěšně uloženy.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Chyba při ukládání preferencí programů.');
    }
});

app.get('/get_subject_preferences', async (req, res) => {
    const { stprIdno, faculty } = req.query;
    const filePath = path.join(__dirname, `server/data/${faculty}/subject_preferences`, `${stprIdno}_subject_preferences.json`);

    try {
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.json({});
        } else {
            console.error(err);
            res.status(500).send('Chyba při načítání preferencí předmětů pro program ${stprIdno}.');
        }
    }
});

app.post('/save_subject_preferences', async (req, res) => {
    const { department, acronym, preference, stprIdno, faculty } = req.body;
    const filePath = path.join(__dirname, `server/data/${faculty}/subject_preferences`, `${stprIdno}_subject_preferences.json`);
    const subjectId = `${department}_${acronym}`;

    try {
        let existingData;
        try {
            const data = await fs.readFile(filePath, 'utf8');
            existingData = JSON.parse(data);
        } catch (readError) {
            if (readError.code === 'ENOENT') {
                existingData = {};
            } else {
                throw readError;
            }
        }
        existingData[subjectId] = preference;

        await fs.writeFile(filePath, JSON.stringify(existingData, null, 2), 'utf8');
        res.json({ message: 'Preference předmětů byly úspěšně uloženy pro program ${stprIdno}.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Chyba při ukládání preferencí předmětů pro program ${stprIdno}.');
    }
});

// GET endpoint pro získání popisu studijního plánu
app.get('/get_study_plan_description', async (req, res) => {
    const { stprIdno, faculty } = req.query;
    const filePath = path.join(__dirname, `server/data/${faculty}/study_plan_description`, `${stprIdno}_description.json`);

    try {
        let data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        if (err.code === 'ENOENT') {
            const defaultDescription = {};
            await fs.writeFile(filePath, JSON.stringify(defaultDescription), 'utf8');
            res.json(defaultDescription);
        } else {
            console.error(err);
            res.status(500).send('Chyba při načítání popisu studijního plánu.');
        }
    }
});


// POST endpoint pro uložení popisu studijního plánu
app.post('/save_study_plan_description', async (req, res) => {
    const { stprIdno, faculty, description } = req.body;
    const filePath = path.join(__dirname, `server/data/${faculty}/study_plan_description`, `${stprIdno}_description.json`);

    try {
        let existingDescription;
        try {
            const data = await fs.readFile(filePath, 'utf8');
            existingDescription = JSON.parse(data);
        } catch (readError) {
            if (readError.code === 'ENOENT') {
                existingDescription = {};
            } else {
                throw readError;
            }
        }
        existingDescription.description = description;

        await fs.writeFile(filePath, JSON.stringify(existingDescription, null, 2), 'utf8');
        res.json({ message: 'Popis studijního plánu byl úspěšně uložen.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Chyba při ukládání popisu studijního plánu.');
    }
});

// Spuštění serveru
app.listen(port, () => {
    console.log(`Server běží na http://adresa_vašeho_serveru:${port}`);
});
