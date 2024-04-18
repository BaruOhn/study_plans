let oborTyp = "";
let programName = "";
let hasSubjects = false;
let defaultDescription = "";

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

    document.querySelectorAll('.icon-toggle').forEach(icon => {
        icon.addEventListener('click', function (event) {
            event.preventDefault();
            const department = this.dataset.department;
            const acronym = this.dataset.acronym;
            const subjectElement = this.closest('.subject-container');

            // Determine the current preference by checking for 'xmark'
            const currentPreference = this.classList.contains('xmark');

            // Clear classes for reset
            this.classList.remove('fa-check', 'fa-times', 'xmark', 'opacity-50');
            subjectElement.classList.remove('opacity-50');

            // Set the classes based on the toggled preference
            if (currentPreference) {
                // If it was true (xmark), now set to false (check)
                this.classList.add('fa-check', 'opacity-50');
                subjectElement.classList.add('opacity-50');
            } else {
                // If it was false (check), now set to true (xmark)
                this.classList.add('fa-times', 'xmark');
            }

            // Save the new preference
            savePreferences(department, acronym, !currentPreference);
        });
    });

    const userData = JSON.parse(sessionStorage.getItem('userData'));
    const authButton = document.getElementById('auth-button');
    const authButtonMobile = document.getElementById('auth-button-mobile');
    if (userData) {
        // Nastavení pro odhlášení
        authButton.innerHTML = '<a class="flex items-center"><i class="fas fa-sign-out-alt text-white mr-2"></i>Odhlásit se</a>';
        authButtonMobile.innerHTML = '<a><i class="fas fa-sign-out-alt text-white text-xl"></i></a>';
        authButton.onclick = logout;
        authButtonMobile.onclick = logout;
    } else {
        // Nastavení pro přihlášení
        authButton.innerHTML = '<a href="login.html" class="flex items-center"><i class="fas fa-user text-white mr-2"></i>Přihlásit se</a>';
        authButtonMobile.innerHTML = '<a href="login.html"><i class="fas fa-user text-white text-xl"></i></a>';
    }

    fetchPreferences();
    fetchDescription();
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
    const studyProgramPath = `/data/${faculty}/obory/${stprIdno}`;
    const studyPlanPath = `/data/${faculty}/studijni_plany/${oborIdno}`;

    const oborData = await fetchData(studyProgramPath);
    const oborIdnoNum = parseInt(oborIdno, 10);
    const selectedObor = oborData.oborInfo.find(obor => obor.oborIdno === oborIdnoNum);

    if (selectedObor) {
        oborTyp = selectedObor.typ.toLowerCase();
        defaultDescription = getDefaultDescription(oborTyp);
    } else {
        console.error('Obor s daným ID nebyl nalezen.');
        return;
    }

    const planData = await fetchData(studyPlanPath);
    displayData(planData, faculty);

    // Nastavení hasSubjects podle obsahu předmětů ve studijním plánu
    if (planData.predmetOboru && planData.predmetOboru.length > 0) {
        hasSubjects = true;
    } else {
        hasSubjects = false;
    }

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
    console.log("Ma predmety: ", hasSubjects);
    const headerTitle = document.querySelector('section h2');
    const headerSubtitle = document.querySelector('section span');
    const headerTitle2 = document.querySelector('section h3');
    const pdfButton = document.getElementById('download-pdf');
    const descriptionText = document.getElementById('description-text');
    const descriptionButton = document.getElementById('description-button');

    oborTyp = obor.typ.toLowerCase();

    if (obor && obor.nazev && obor.forma) {
        headerTitle.textContent = `${obor.nazev} - studijní plán`;
        headerSubtitle.textContent = `${oborTyp} program`;

        if (hasSubjects) {
            headerTitle2.textContent = `${obor.forma} forma studia`
            pdfButton.classList.remove('hidden');
            descriptionText.classList.remove('hidden');
            descriptionButton.classList.remove('hidden');
        }
        else {
            headerTitle2.textContent = '';
            pdfButton.classList.add('hidden');
            descriptionText.classList.add('hidden');
            descriptionButton.classList.add('hidden');
        }

        programName = obor.nazev;

    } else {
        headerTitle.textContent = 'Studijní plán - Neznámý obor';
        headerSubtitle.textContent = 'Neznámý typ programu';

        if (hasSubjects) {
            headerTitle2.textContent = 'Neznámá forma studia';
            pdfButton.classList.remove('hidden');
            descriptionText.classList.remove('hidden');
            descriptionButton.classList.remove('hidden');
        }
        else {
            headerTitle2.textContent = '';
            pdfButton.classList.add('hidden');
            descriptionText.classList.add('hidden');
            descriptionButton.classList.add('hidden');
        }

        programName = 'Neznámý obor';
    }
}

function createSectionForYear(rocnik) {
    const section = document.createElement('section');
    if (oborTyp === 'navazující') {
        section.classList.add('col-span-12', 'lg:col-span-6', 'print:col-span-6');
    }
    else {
        section.classList.add('col-span-12', 'lg:col-span-6', 'xl:col-span-4', 'print:col-span-4');
    }
    section.innerHTML = `
        <h4 class="text-lg font-extrabold text-gray-800/80 mt-4 print:text-base">${rocnik}. ročník</h4>
        <div class="flex flex-col sm:grid sm:grid-cols-12 lg:flex lg:flex-row xl:flex xl:flex-row gap-0.5">
            <div id="${rocnik}RocnikZimniSemestr" class="flex-1 sm:col-span-6 lg:mb-8"> 
                <h5 class="text-sm text-gray-700 italic mt-0 mb-1 print:text-xs">zimní semestr</h5>
            </div>
            <div id="${rocnik}RocnikLetniSemestr" class="flex-1 sm:col-span-6 lg:mb-8"> 
                <h5 class="text-sm text-gray-700 italic mt-0 mb-1 print:text-xs">letní semestr</h5>
            </div>
        </div>
    `;
    return section;
}

function createSectionForUnassignedSubjects() {
    const section = document.createElement('section');
    section.classList.add('col-span-12');
    section.style.pageBreakBefore = 'always';

    let gridClass = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 print:grid-cols-6';
    if (oborTyp === 'navazující') {
        gridClass = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 print:grid-cols-4';
    }

    section.innerHTML = `
        <h4 class="text-lg font-extrabold text-gray-800/80 mt-4 mb-6 text-center print:text-sm">Předměty bez určeného ročníku nebo semestru</h4>
        <div class="unassigned-subjects-container ${gridClass} gap-x-0.5 mb-0.5">
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
        noDataMessage.classList.add('text-gray-700', 'text-lg', 'font-semibold', 'mt-16', 'text-center', 'col-span-12');
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
            fetchPreferences();
        }
    }
}

function generatePredmetHTML(predmet, faculty) {
    const statutToColorIndex = predmet.statut === "A" ? 0 : predmet.statut === "B" ? 1 : predmet.statut === "C" ? 2 : 3;
    const colorClasses = ['bg-sky-500/50', 'bg-amber-400/50', 'bg-red-400/50', 'bg-green-500/50'];
    const colorClass = colorClasses[statutToColorIndex];

    if(oborTyp === 'navazující') {
        subjectWidth = 'w-full';
    }
    else {
        subjectWidth = 'w-[121px]';
    }

    return `
        <a href="subject_detail.html?faculty=${faculty}&department=${predmet.katedra}&acronym=${predmet.zkratka}" class="block ${colorClass} mb-0.5 ml-0.5 w-full print:w-[${subjectWidth}] subject-container">
            <div class="flex items-center h-[52px] justify-between font-sans px-4 py-6 print:px-2 print:py-4 print:h-8">
                <div class="text-sm font-normal line-clamp-3 leading-tight flex-grow print:text-[8px]">${predmet.nazev}</div>
                <i class="icon-toggle fas fa-times xmark text-gray-700/90 text-base p-2" data-department="${predmet.katedra}" data-acronym="${predmet.zkratka}"></i>
            </div>
        </a>
    `;
}

function fetchPreferences() {
    const urlParams = new URLSearchParams(window.location.search);
    const stprIdno = urlParams.get('stprIdno');
    const faculty = urlParams.get('faculty');
    const url = `/get_subject_preferences?faculty=${faculty}&stprIdno=${stprIdno}`;

    fetch(url)
        .then(response => response.json())
        .then(preferences => {
            applyPreferences(preferences);
        })
        .catch((error) => {
            console.error('Nepodařilo se načíst preference předmětů:', error);
        });
}


function applyPreferences(preferences) {
    Object.entries(preferences).forEach(([subjectId, prefValue]) => {
        const [department, acronym] = subjectId.split('_');
        const icon = document.querySelector(`.icon-toggle[data-department="${department}"][data-acronym="${acronym}"]`);
        const subjectElement = icon ? icon.closest('.subject-container') : null;
        if (icon && subjectElement) {
            icon.classList.remove('fa-check', 'fa-times', 'xmark', 'opacity-50');

            if (prefValue) {
                icon.classList.add('fa-times', 'xmark');
            } else {
                icon.classList.add('fa-check', 'opacity-50');
                subjectElement.classList.add('opacity-50');
            }
        }
    });
}

function savePreferences(department, acronym, preference) {
    const urlParams = new URLSearchParams(window.location.search);
    const stprIdno = urlParams.get('stprIdno');
    const faculty = urlParams.get('faculty');
    const data = {
        department,
        acronym,
        preference,
        stprIdno,
        faculty
    };

    fetch('/save_subject_preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            fetchPreferences();
        })
        .catch((error) => {
            console.error('Nepodařilo se uložit preference předmětů:', error);
        });
}

// Pomocná funkce pro vytvoření defeaultní HTML sekce s nápovědou
function getDefaultDescription(oborTyp) {
    if (oborTyp === 'bakalářský' || oborTyp === 'navazující') {
        const credits = oborTyp === 'bakalářský' ? 180 : 120;
        return `Za celé studium musí studenti získat ${credits} kreditů. Kromě uvedených předmětů si mohou vybírat také z bohaté nabídky předmětů dalších kateder.`;
    }
    return "";
}

// Funkce pro načtení popisu studijního plánu
// Funkce pro načtení popisu studijního plánu
async function fetchDescription() {
    const urlParams = new URLSearchParams(window.location.search);
    const stprIdno = urlParams.get('stprIdno');
    const faculty = urlParams.get('faculty');
    
    // Místo tvrdého zakódování oborTypu získáme oborTyp z funkce fetchStudyPlanData, která by měla být volána před fetchDescription
    const response = await fetch(`/get_study_plan_description?faculty=${faculty}&stprIdno=${stprIdno}`);
    const descriptionText = document.getElementById('description-text');
    const descriptionView = document.getElementById('description-view');
    const editButton = document.getElementById('description-button');

    // Získání výchozího popisu na základě oboru, oborTyp by měl být správně nastaven v fetchStudyPlanData
    const defaultDescription = getDefaultDescription(oborTyp);

    if (response.ok) {
        const data = await response.json();
        const description = data.description || defaultDescription;
        
        if (sessionStorage.userData && JSON.parse(sessionStorage.userData).role === "garant") {
            descriptionText.value = description;
            descriptionText.style.display = 'block'; // Zobrazení textarea a tlačítka pro garanta
            editButton.style.display = 'block';
            descriptionView.style.display = 'none'; // Skrytí paragrafu pro nepřihlášené uživatele
        } else {
            descriptionView.textContent = description;
            descriptionView.style.display = 'block'; // Zobrazení paragrafu pro nepřihlášené uživatele
            descriptionText.style.display = 'none'; // Skrytí textarea a tlačítka
            editButton.style.display = 'none';
        }
    } else if (response.status === 404) {
        console.log('No existing description. Using default.');
        descriptionText.value = defaultDescription;
        descriptionText.style.display = 'block'; // Zobrazení textarea a tlačítka pro garanta
        editButton.style.display = 'block';
        descriptionView.style.display = 'none'; // Skrytí paragrafu pro nepřihlášené uživatele
    } else {
        console.error('Failed to fetch description due to server error');
        descriptionText.value = defaultDescription;
    }
}

async function saveDescription() {
    const descriptionText = document.getElementById('description-text').value;
    const urlParams = new URLSearchParams(window.location.search);
    const stprIdno = urlParams.get('stprIdno');
    const faculty = urlParams.get('faculty');

    const response = await fetch('/save_study_plan_description', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            stprIdno: stprIdno,
            faculty: faculty,
            description: descriptionText
        })
    });

    const messageElement = document.getElementById('saveMessage');
    if (response.ok) {
        messageElement.textContent = 'Popis programu byl úspěšně uložen';
        messageElement.classList.remove('opacity-0');
        setTimeout(() => {
            messageElement.style.transition = 'opacity 1s ease-out';
            messageElement.classList.add('opacity-0'); 
        }, 3000); 
    } else {
        messageElement.textContent = 'Nepodařilo se uložit popis programu.';
        messageElement.classList.remove('opacity-0');
        setTimeout(() => {
            messageElement.style.transition = 'opacity 1s ease-out';
            messageElement.classList.add('opacity-0');
        }, 3000);
    }
}

function logout() {
    sessionStorage.removeItem('userData'); // Smazání dat uživatele
    window.location.href = 'index.html'; // Přesměrování na domovskou stránku
}

{/* <div class="text-sm font-light italic text-gray-700 print:text-[8px]">${predmet.kreditu}</div> */ }
