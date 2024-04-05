let oborTyp = "";
let programName = "";
let hasSubjects = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Zpracování URL parametrů a načtení dat
    const urlParams = new URLSearchParams(window.location.search);
    const oborIdno = urlParams.get('oborIdno');
    const faculty = urlParams.get('faculty');
    const stprIdno = urlParams.get('stprIdno');

    if (!oborIdno || !faculty || !stprIdno) {
        return console.error('Chyba: Chybějící parametry v URL.');
    }

    try {
        await fetchStudyPlanData(faculty, oborIdno, stprIdno);
    } catch (error) {
        console.error('Chyba při načítání studijního plánu:', error);
    }

    // Přidání event listeneru pro tlačítko pro stažení PDF
    document.getElementById('download-pdf').addEventListener('click', () => {
        generatePdf(oborIdno, faculty, stprIdno, programName);
    });
});

function generatePdf(oborIdno, faculty, stprIdno, programName) {
    const downloadIcon = document.getElementById('download-icon');
    const loadingIcon = document.getElementById('loading-icon');

    // Přidání třídy 'hidden' pro ikonu a odebrání u animace
    downloadIcon.classList.add('invisible');
    loadingIcon.classList.remove('hidden');

    const queryParams = new URLSearchParams({ oborIdno, faculty, stprIdno }).toString();
    const url = `/generate_pdf?${queryParams}`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Něco se nepovedlo při generování PDF.');
            return response.blob();
        })
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = `${programName}_studijni_plan.pdf`.replace(/ /g, "_");
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            a.remove();
        })
        .catch(error => {
            console.error('Chyba:', error);
        })
        .finally(() => {
            // Odebrání třídy 'hidden' u animace a přidání u ikony
            loadingIcon.classList.add('hidden');
            downloadIcon.classList.remove('invisible');
        });
}

async function fetchStudyPlanData(faculty, oborIdno, stprIdno) {
    // Sestavení cest a načtení dat
    const studyProgramPath = `/data/${faculty}/obory/${stprIdno}`;
    const studyPlanPath = `/data/${faculty}/studijni_plany/${oborIdno}`;
    const blocksPath = `/data/${faculty}/bloky_planu/${stprIdno}`;

    const oborData = await fetchData(studyProgramPath);
    const oborIdnoNum = parseInt(oborIdno, 10);
    const selectedObor = oborData.oborInfo.find(obor => obor.oborIdno === oborIdnoNum);

    if (selectedObor) {
        oborTyp = selectedObor.typ.toLowerCase();
        updatePageHeadings(selectedObor);
    } else {
        console.error('Obor s daným ID nebyl nalezen.');
    }

    const data = await fetchData(studyPlanPath);
    displayData(data, faculty);

    if (data.predmetOboru && data.predmetOboru.length > 0) {
        hasSubjects = true; // Nastavení hasSubjects na true, pokud jsou k dispozici předměty oboru
        const blockData = await fetchData(blocksPath);
        createHelpSection(blockData, oborTyp);
    }

    // Přesunuto volání updatePageHeadings podle vaší specifikace
    if (selectedObor) {
        updatePageHeadings(selectedObor);
    }
}

async function fetchData(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Chyba při načítání dat');
    return response.json();
}

function updatePageHeadings(obor) {
    console.log("Predmety: ", hasSubjects);
    const headerTitle = document.querySelector('section h2');
    const headerSubtitle = document.querySelector('section span');
    const headerTitle2 = document.querySelector('section h3');

    oborTyp = obor.typ.toLowerCase();

    if (obor && obor.nazev && obor.forma) {
        headerTitle.textContent = `${obor.nazev} - studijní plán`;
        headerSubtitle.textContent = `${oborTyp} program`;

        if (hasSubjects) {
            headerTitle2.textContent = `${obor.forma} forma studia`
        }
        else {
            headerTitle2.textContent = '';
        }

        programName = obor.nazev;

    } else {
        headerTitle.textContent = 'Studijní plán - Neznámý obor';
        headerSubtitle.textContent = 'Neznámý typ programu';

        if (hasSubjects) {
            headerTitle2.textContent = 'Neznámá forma studia';
        }
        else {
            headerTitle2.textContent = '';
        }

        programName = 'Neznámý obor';
    }
}

// Funkce pro vytvoření HTML sekce pro každý ročník
function createSectionForYear(rocnik) {
    const section = document.createElement('section');
    section.classList.add('m-2');
    section.innerHTML = `
        <h4 class="text-lg font-extrabold text-gray-800/80 mt-4 print:text-base">${rocnik}. ročník</h4>
        <div class="flex flex-wrap justify-center">
            <div id="${rocnik}RocnikZimniSemestr" class="rocnikContainer mr-0.5 mb-8">
                <h5 class="text-sm text-gray-700 italic mt-0 mb-1 print:text-xs">zimní semestr</h5>
            </div>
            <div id="${rocnik}RocnikLetniSemestr" class="rocnikContainer mb-8">
                <h5 class="text-sm text-gray-700 italic mt-0 mb-1 print:text-xs">letní semestr</h5>
            </div>
        </div>
    `;
    return section;
}

function createHelpSection(blocksData, oborTyp) {
    const mainContent = document.getElementById('helper-container');
    const helpSection = document.createElement('section');
    helpSection.className = 'mx-8 my-12 text-gray-800/80 text-sm';

    if (oborTyp === 'bakalářský' || oborTyp === 'navazující') {
        const credits = oborTyp === 'bakalářský' ? 180 : 120;
        helpSection.innerHTML = `
            <p class="whitespace-pre-line mb-4">Za celé studium musí studenti získat ${credits} kreditů. Kromě uvedených předmětů 
            si mohou vybírat také z bohaté nabídky předmětů dalších kateder.</p>
        `;
    }

    const colorClasses = ['bg-sky-500/50', 'bg-amber-400/50', 'bg-red-400/50', 'bg-green-500/50'];

    blocksData.blokInfo.forEach((blok) => {
        const name = blok.nazev.toLowerCase();
        // Přiřazení barvy na základě statutu bloku
        const statutToColorIndex = blok.statut === "A" ? 0 : blok.statut === "B" ? 1 : blok.statut === "C" ? 2 : 3;
        const colorClass = colorClasses[statutToColorIndex];

        const blockDiv = document.createElement('div');
        blockDiv.className = 'flex items-center mt-2';

        const kredText = (oborTyp === 'bakalářský' || oborTyp === 'navazující') && (blok.minKred || blok.maxKred)
            ? ` (${blok.minKred && blok.maxKred
                ? `minimálně ${blok.minKred} kreditů, maximálně ${blok.maxKred} kreditů`
                : blok.minKred
                    ? `minimálně ${blok.minKred} kreditů`
                    : `maximálně ${blok.maxKred} kreditů`
            })`
            : '';

        blockDiv.innerHTML = `
            <div class="shrink-0 w-5 h-5 ${colorClass} mr-2"></div>
            <div class="grow">
                <p class="italic">${name}${kredText}</p>
            </div>
        `;

        helpSection.appendChild(blockDiv);
    });

    mainContent.appendChild(helpSection);
}

function createSectionForUnassignedSubjects() {
    const section = document.createElement('section');
    section.classList.add('m-2');
    section.innerHTML = `
        <h4 class="flex justify-center text-lg font-extrabold text-gray-800/80 mt-4 sm:ml-3 mb-6 print:text-sm print:ml-0">Předměty mimo studijní plán</h4>
        <div class="unassigned-subjects-container flex flex-row flex-wrap justify-center space-x-0.5">
            <!-- Zde budou přidány předměty -->
        </div>
    `;
    return section;
}

function displayData(data, faculty) {
    const mainContent = document.getElementById('main-content');
    const unassignedSubjectsSection = createSectionForUnassignedSubjects();
    const unassignedSubjectsContainer = unassignedSubjectsSection.querySelector('.unassigned-subjects-container');
    let hasUnassignedSubjects = false;

    if (data.predmetOboru.length === 0) {
        const noDataMessage = document.createElement('div');
        noDataMessage.textContent = 'Pro vybraný studijní plán nejsou ve STAGu k dispozici žádné předměty.';
        noDataMessage.classList.add('text-gray-700', 'text-lg', 'font-semibold', 'mt-16', 'text-center', 'w-full', 'mx-auto');
        mainContent.appendChild(noDataMessage);
    } else {
        const uniquePredmety = Array.from(new Map(data.predmetOboru.filter(predmet => predmet.kreditu > 0).map(predmet => [predmet.nazev, predmet])).values());

        let predmetyPodleStatutu = { "A": [], "B": [], "C": [] };
        uniquePredmety.forEach(predmet => {
            predmetyPodleStatutu[predmet.statut].push(predmet);
        });

        Object.keys(predmetyPodleStatutu).forEach(statut => {
            predmetyPodleStatutu[statut].sort((a, b) => a.nazev.localeCompare(b.nazev));
        });

        let pocetRocniku = (oborTyp === 'bakalářský' || oborTyp === 'doktorský') ? 3 : 2;

        for (let rocnik = 1; rocnik <= pocetRocniku; rocnik++) {
            // Zkontrolujeme, zda pro daný ročník existují nějaké předměty
            const maZimniSemestrPredmety = uniquePredmety.some(predmet => predmet.doporucenyRocnik === rocnik && predmet.vyukaZS === 'A');
            const maLetniSemestrPredmety = uniquePredmety.some(predmet => predmet.doporucenyRocnik === rocnik && predmet.vyukaZS === 'B');
            if (maZimniSemestrPredmety || maLetniSemestrPredmety) {
                // Pokud pro daný ročník existují předměty, vytvoříme pro něj sekci
                mainContent.appendChild(createSectionForYear(rocnik));
            }
        }

        Object.values(predmetyPodleStatutu).forEach(skupina => {
            skupina.forEach(predmet => {
                const predmetHTML = generatePredmetHTML(predmet, faculty);
                if (predmet.doporucenyRocnik === null || predmet.doporucenySemestr === null) {
                    unassignedSubjectsContainer.innerHTML += predmetHTML;
                    hasUnassignedSubjects = true; // Nastavíme indikátor na true
                } else {
                    const targetId = `${predmet.doporucenyRocnik}Rocnik${predmet.vyukaZS === 'A' ? 'Zimni' : 'Letni'}Semestr`;
                    const container = document.getElementById(targetId);
                    if (container) container.innerHTML += predmetHTML;
                }
            });
        });

        if (hasUnassignedSubjects) {
            mainContent.appendChild(unassignedSubjectsSection);
        }
    }
}

function generatePredmetHTML(predmet, faculty) {
    const statutToColorIndex = predmet.statut === "A" ? 0 : predmet.statut === "B" ? 1 : predmet.statut === "C" ? 2 : 3;
    const colorClasses = ['bg-sky-500/50', 'bg-amber-400/50', 'bg-red-400/50', 'bg-green-500/50'];
    const colorClass = colorClasses[statutToColorIndex];

    return `
        <a href="subject_detail.html?faculty=${faculty}&department=${predmet.katedra}&acronym=${predmet.zkratka}" class="block ${colorClass} mb-0.5">
            <div class="flex items-center h-12 w-[218px] print:w-[118px] print:h-8 justify-between font-sans px-4 py-6 print:px-2 print:py-4">
                <div class="text-sm font-normal line-clamp-3 leading-tight w-44 print:text-[8px] print:w-24">${predmet.nazev}</div>
                <div class="text-sm font-light italic text-gray-700 print:text-[8px]">${predmet.kreditu}</div>
            </div>
        </a>
    `;
}
