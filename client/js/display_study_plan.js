let oborTyp = "";
let programName = "";
let hasSubjects = false;
let defaultDescription = "";
let hasUnassignedSubjectsA = false;
let hasUnassignedSubjectsB = false;
let hasUnassignedSubjectsC = false;

document.addEventListener('DOMContentLoaded', async () => {
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

    try {
        document.getElementById('download-pdf').addEventListener('click', () => {
            generatePdf(oborIdno, faculty, stprIdno, programName);
        });
    } catch (error) {
        console.error('Chyba při nastavování event listeneru pro tlačítko pro stažení PDF:', error);
    }

    document.querySelectorAll('.icon-toggle').forEach(icon => {
        icon.addEventListener('click', function (event) {
            event.preventDefault();
            const department = this.dataset.department;
            const acronym = this.dataset.acronym;
            const subjectElement = this.closest('.subject-container');
            const currentPreference = this.classList.contains('xmark');

            this.classList.remove('fa-check', 'fa-times', 'xmark');
            subjectElement.classList.remove('opacity-50');

            if (currentPreference) {
                // Pokud bylo true (xmark), nastavíme na false (check)
                this.classList.add('fa-check');
                subjectElement.classList.add('opacity-50');
            } else {
                // Pokud bylo false (check), nastavíme na true (xmark)
                this.classList.add('fa-times', 'xmark');
            }

            // Aktualizace preference v souboru
            savePreferences(department, acronym, !currentPreference);
        });
    });

    const userData = JSON.parse(sessionStorage.getItem('userData'));
    updateAuthenticationState(userData);

    if (userData) {
        const preferences = await fetchPreferences(); // Načtení preferencí po přihlášení
        applyPreferences(preferences); // Vizualizace podle preferencí
    }

    // Vytvoří odkaz na STAG pro daný studijní plán
    const stagLink = document.getElementById('stag-link');
    const stagUrl = `https://stag.upol.cz/StagPortletsJSR168/CleanUrl?urlid=prohlizeni-browser-vizualizace&browserFakulta=${faculty}&browserRok=2024&browserProgram${stprIdno}&browserObor=${oborIdno}`;
    stagLink.href = stagUrl;
    stagLink.style.display = 'inline-block';

    fetchDescription(); // Načtení popisu studijního plánu
});

// Vizualizace tlačítka pro přihlášení/odhlášení
function updateAuthenticationState(userData) {
    const authButton = document.getElementById('auth-button');
    const authButtonMobile = document.getElementById('auth-button-mobile');
    if (userData) {
        authButton.innerHTML = '<a class="flex items-center"><i class="fas fa-sign-out-alt text-white mr-2"></i>Odhlásit se</a>';
        authButtonMobile.innerHTML = '<a><i class="fas fa-sign-out-alt text-white text-xl"></i></a>';
        authButton.onclick = logout;
        authButtonMobile.onclick = logout;
    } else {
        authButton.innerHTML = '<a href="login.html" class="flex items-center"><i class="fas fa-user text-white mr-2"></i>Přihlásit se</a>';
        authButtonMobile.innerHTML = '<a href="login.html"><i class="fas fa-user text-white text-xl"></i></a>';
    }
}

// Funkce pro generování PDF souboru 
function generatePdf(oborIdno, faculty, stprIdno, programName) {
    const downloadIcon = document.getElementById('download-icon');
    const loadingIcon = document.getElementById('loading-icon');

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
            loadingIcon.classList.add('hidden');
            downloadIcon.classList.remove('invisible');
        });
}

// Funkce pro načtení dat studijního plánu 
async function fetchStudyPlanData(faculty, oborIdno, stprIdno) {
    const studyProgramPath = `/data/${faculty}/programs/${stprIdno}`;
    const studyPlanPath = `/data/${faculty}/study_plans/${oborIdno}`;

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

    // Aktualizace nadpisů stránky
    if (selectedObor) {
        updatePageHeadings(selectedObor);
    }
}

// Funkce pro načtení dat ze zadaného souboru
async function fetchData(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Chyba při načítání dat');
    return response.json();
}

// Funkce pro aktualizaci nadpisů stránky
function updatePageHeadings(obor) {
    programName = document.getElementById('program-name');
    const programType = document.getElementById('program-type');
    const programForm = document.getElementById('program-form');
    const pdfButton = document.getElementById('download-pdf');
    const descriptionText = document.getElementById('description-text');
    const descriptionButton = document.getElementById('description-button');

    oborTyp = obor.typ.toLowerCase();

    if (obor && obor.nazev && obor.forma) {
        programName.textContent = `${obor.nazev} - studijní plán`;
        programType.textContent = `${oborTyp} program`;

        programForm.textContent = hasSubjects ? `${obor.forma} forma studia` : '';
        hasSubjects ? pdfButton.classList.remove('hidden') : pdfButton.classList.add('hidden');
        hasSubjects ? descriptionText.classList.remove('hidden') : descriptionText.classList.add('hidden');
        hasSubjects ? descriptionButton.classList.remove('hidden') : descriptionButton.classList.add('hidden');

        programName = obor.nazev;

    } else {
        programName.textContent = 'Studijní plán - Neznámý obor';
        programType.textContent = 'Neznámý typ programu';

        programForm.textContent = hasSubjects ? 'Neznámá forma studia' : '';
        hasSubjects ? pdfButton.classList.remove('hidden') : pdfButton.classList.add('hidden');
        hasSubjects ? descriptionText.classList.remove('hidden') : descriptionText.classList.add('hidden');
        hasSubjects ? descriptionButton.classList.remove('hidden') : descriptionButton.classList.add('hidden');

        programName = 'Neznámý obor';
    }
}

// Funkce pro vytvoření sekce pro daný ročník
function createSectionForYear(rocnik) {
    const section = document.createElement('section');
    if (oborTyp === 'navazující') {
        section.classList.add('col-span-12', 'lg:col-span-6', 'print:col-span-6');
    }
    else {
        section.classList.add('col-span-12', 'lg:col-span-6', 'xl:col-span-4', 'print:col-span-4');
    }
    section.innerHTML = `
        <h4 class="text-lg font-extrabold text-gray-800/80 mt-4 ml-0.5 print:text-base">${rocnik}. ročník</h4>
        <div class="flex flex-col sm:grid sm:grid-cols-12 lg:flex lg:flex-row xl:flex xl:flex-row gap-0.5">
            <div id="${rocnik}RocnikZimniSemestr" class="flex-1 sm:col-span-6 lg:mb-8"> 
                <h5 class="text-sm text-gray-700 italic mt-0 mb-1 ml-0.5 print:text-xs">zimní semestr</h5>
            </div>
            <div id="${rocnik}RocnikLetniSemestr" class="flex-1 sm:col-span-6 lg:mb-8"> 
                <h5 class="text-sm text-gray-700 italic mt-0 mb-1 ml-0.5 print:text-xs">letní semestr</h5>
            </div>
        </div>
    `;
    return section;
}

// Funkce pro vytvoření sekce pro předměty bez určeného ročníku nebo semestru
function createSectionForUnassignedSubjects() {
    const section = document.createElement('section');
    section.classList.add('col-span-12');

    let gridClass = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 print:grid-cols-6';
    if (oborTyp === 'navazující') {
        gridClass = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 print:grid-cols-4';
    }

    section.innerHTML = `
        <h4 class="text-lg font-extrabold text-gray-800/80 mt-4 text-left print:text-sm ml-0.5 mb-2">Předměty bez určeného ročníku nebo semestru</h4>
        <div class="unassigned-subjects-container-A ${gridClass} gap-x-0.5">
            <!-- Zde budou přidány předměty se statutem A-->
        </div>
        <div class="unassigned-subjects-container-B ${gridClass} gap-x-0.5">
            <!-- Zde budou přidány předměty se statutem B-->
        </div>
        <div class="unassigned-subjects-container-C ${gridClass} gap-x-0.5">
            <!-- Zde budou přidány předměty se statutem C-->
        </div>
    `;
    return section;
}

// Funkce pro zobrazení dat studijního plánu
async function displayData(data, faculty) {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    const isLoggedIn = userData != null;
    const mainContent = document.getElementById('main-content');

    // Kontejnery pro předměty bez určeného ročníku nebo semestru podle statutu
    const unassignedSubjectsSection = createSectionForUnassignedSubjects();
    const unassignedSubjectsContainerA = unassignedSubjectsSection.querySelector('.unassigned-subjects-container-A');
    const unassignedSubjectsContainerB = unassignedSubjectsSection.querySelector('.unassigned-subjects-container-B');
    const unassignedSubjectsContainerC = unassignedSubjectsSection.querySelector('.unassigned-subjects-container-C');
    const preferences = isLoggedIn ? {} : await fetchPreferences();

    // Zobrazení chybové hlášky pokud nejsou k dispozici žádné předměty
    if (data.predmetOboru.length === 0) {
        displayNoDataMessage(mainContent);
    } else {
        const uniqueSubjects = removeDuplicateSubjects(data.predmetOboru);
        let subjectsByStatus = groupSubjectsByStatus(uniqueSubjects, preferences, isLoggedIn);
        subjectsByStatus = sortSubjects(subjectsByStatus);

        // Nastavení počtu ročníků podle typu oboru
        let numberOfYears = (oborTyp === 'bakalářský' || oborTyp === 'doktorský') ? 3 : 2;

        for (let year = 1; year <= numberOfYears; year++) {
            // Zkontrolujeme, zda pro semestry existují předměty
            const maZimniSemestrPredmety = uniqueSubjects.some(predmet => predmet.doporucenyRocnik === year && predmet.vyukaZS === 'A');
            const maLetniSemestrPredmety = uniqueSubjects.some(predmet => predmet.doporucenyRocnik === year && predmet.vyukaLS === 'A');
            if (maZimniSemestrPredmety || maLetniSemestrPredmety) {
                // Pokud pro daný ročník existují předměty, vytvoříme pro něj sekci
                mainContent.appendChild(createSectionForYear(year));
            }
        }

        // Přidání předmětů do jednotlivých sekcí
        Object.values(subjectsByStatus).forEach(skupina => {
            skupina.forEach(predmet => {
                const subjectHTML = generateSubjectHTML(predmet, faculty);
                if (predmet.doporucenyRocnik === null && predmet.doporucenySemestr === null) {
                    if (predmet.statut === 'A') {
                        unassignedSubjectsContainerA.innerHTML += subjectHTML;
                        hasUnassignedSubjectsA = true;
                    }
                    else if (predmet.statut === 'B') {
                        unassignedSubjectsContainerB.innerHTML += subjectHTML;
                        hasUnassignedSubjectsB = true;
                    }
                    else if (predmet.statut === 'C') {
                        unassignedSubjectsContainerC.innerHTML += subjectHTML;
                        hasUnassignedSubjectsC = true;
                    }
                } else {
                    const targetId = `${predmet.doporucenyRocnik}Rocnik${predmet.vyukaZS === 'A' ? 'Zimni' : 'Letni'}Semestr`;
                    const container = document.getElementById(targetId);
                    if (container) container.innerHTML += subjectHTML;
                }
            });
        });

        updateUnassignedSubjectsContainers(unassignedSubjectsContainerA, unassignedSubjectsContainerB, unassignedSubjectsContainerC);

        // Přidání sekce pro předměty bez určeného ročníku nebo semestru pokud existují
        if (hasUnassignedSubjectsA || hasUnassignedSubjectsB || hasUnassignedSubjectsC) {
            mainContent.appendChild(unassignedSubjectsSection);
            fetchPreferences();
        }
    }
}

// Funkce pro zobrazení chybové hlášky pokud nejsou k dispozici žádné předměty
function displayNoDataMessage(mainContent) {
    const noDataMessage = document.createElement('div');
    noDataMessage.textContent = 'Pro vybraný studijní plán nejsou ve STAGu k dispozici žádné předměty.';
    noDataMessage.classList.add('text-gray-700', 'text-lg', 'font-semibold', 'mt-16', 'text-center', 'col-span-12');
    mainContent.appendChild(noDataMessage);
}

// Funkce pro rozdělení předmětů podle statutu a filtrování podle preferencí garanta
function groupSubjectsByStatus(uniqueSubjects, preferences, isLoggedIn) {
    let subjectsByStatus = { "A": [], "B": [], "C": [] };
    uniqueSubjects.forEach(predmet => {
        const subjectId = `${predmet.katedra}_${predmet.zkratka}`;
        const showSubject = preferences[subjectId] !== false;
        if (isLoggedIn || showSubject) {
            subjectsByStatus[predmet.statut].push(predmet);
        }
    });

    return subjectsByStatus;
}

// Pomocná funkce pro odstranění duplicitních předmětů
function removeDuplicateSubjects(subjects) {
    return Array.from(new Map(subjects.filter(predmet => predmet.kreditu > 0).map(predmet => [predmet.nazev, predmet])).values());
}

// Pomocná funkce pro seřazení předmětů podle názvu abecedně
function sortSubjects(predmetyPodleStatutu) {
    Object.keys(predmetyPodleStatutu).forEach(statut => {
        predmetyPodleStatutu[statut].sort((a, b) => a.nazev.localeCompare(b.nazev));
    });

    return predmetyPodleStatutu;
}

// Funkce pro aktualizaci vzhledu kontejnerů pro předměty bez určeného ročníku nebo semestru
function updateUnassignedSubjectsContainers(unassignedSubjectsContainerA, unassignedSubjectsContainerB, unassignedSubjectsContainerC) {
    if (hasUnassignedSubjectsA) { unassignedSubjectsContainerA.classList.add('mb-4'); }
    if (hasUnassignedSubjectsB) { unassignedSubjectsContainerB.classList.add('mb-4'); }
    if (hasUnassignedSubjectsC) { unassignedSubjectsContainerC.classList.add('mb-4'); }
}

// Funkce pro generování HTML pro předmět
function generateSubjectHTML(predmet, faculty) {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    const isLoggedIn = userData != null;

    const statutToColorIndex = predmet.statut === "A" ? 0 : predmet.statut === "B" ? 1 : predmet.statut === "C" ? 2 : 3;
    const colorClasses = ['bg-sky-500/50', 'bg-amber-400/50', 'bg-red-400/50', 'bg-green-500/50'];
    const colorClass = colorClasses[statutToColorIndex];

    if (oborTyp === 'navazující') {
        subjectWidth = 'w-full';
    }
    else {
        subjectWidth = 'w-[121px]';
    }

    // Přidání nezlomitelných mezer do názvu předmětu
    const programNameWithNbsp = predmet.nazev.replace(/(\s)(?=\d)|(?<=\s)([avskz])\s/g, (match, space, avskz) => {
        return avskz ? avskz + '&nbsp;' : '&nbsp;';
    });

    // Vytvoření odkazu na detail předmětu
    const subjectLinkHTML = `
        <a href="subject_detail.html?faculty=${faculty}&department=${predmet.katedra}&acronym=${predmet.zkratka}" class="text-sm font-normal line-clamp-3 leading-4 print:leading-tight flex-grow print:text-[8px] mr-4">
            ${programNameWithNbsp}
        </a>`;

    // Vytvoření ikony pro toggle preference předmětu
    const iconHTML = isLoggedIn ?
        `<i class="icon-toggle fas fa-times xmark text-gray-700/90 text-base p-2" data-department="${predmet.katedra}" data-acronym="${predmet.zkratka}" style="cursor:pointer;"></i>` :
        `<div class="text-sm font-light italic text-gray-700 print:text-[9px]">${predmet.kreditu}</div>`;

    // Vytvoření HTML pro předmět
    return `
        <div class="block ${colorClass} mb-0.5 ml-0.5 w-full print:w-[${subjectWidth}] subject-container flex items-center h-[52px] justify-between font-sans px-4 py-6 print:px-2 print:py-4 print:h-[36px]">
            ${subjectLinkHTML}
            ${iconHTML}
        </div>
    `;
}

// Pomocná funkce pro přidání nezlomitelných mezer pro předložky, spojky a čísla v názvu předmětu
function addNonBreakingSpaces(text) {
    return text.replace(/\b(?![A-Za-z]\s)\d+|\b([a|v|k|z])\b/gi, function (match, group1) {
        if (group1) {
            return '&nbsp;' + group1;
        } else {
            return match;
        }
    });
}

// Funkce pro načtení preferencí předmětů
async function fetchPreferences() {
    const urlParams = new URLSearchParams(window.location.search);
    const stprIdno = urlParams.get('stprIdno');
    const faculty = urlParams.get('faculty');
    const url = `/get_subject_preferences?faculty=${faculty}&stprIdno=${stprIdno}`;

    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Nepodařilo se načíst preference předmětů:', error);
        return {};
    }
}

// Funkce pro aplikaci preferencí na zobrazené předměty
function applyPreferences(preferences) {
    Object.entries(preferences).forEach(([subjectId, prefValue]) => {
        const [department, acronym] = subjectId.split('_');
        const icon = document.querySelector(`.icon-toggle[data-department="${department}"][data-acronym="${acronym}"]`);
        const subjectElement = icon ? icon.closest('.subject-container') : null;
        if (icon && subjectElement) {
            icon.classList.remove('fa-check', 'fa-times', 'xmark');

            if (prefValue) {
                icon.classList.add('fa-times', 'xmark');
            } else {
                icon.classList.add('fa-check');
                subjectElement.classList.add('opacity-50');
            }
        }
    });
}

// Funkce pro uložení preferencí předmětů
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
async function fetchDescription() {
    const urlParams = new URLSearchParams(window.location.search);
    const stprIdno = urlParams.get('stprIdno');
    const faculty = urlParams.get('faculty');
    const response = await fetch(`/get_study_plan_description?faculty=${faculty}&stprIdno=${stprIdno}`);

    const descriptionHeading = document.getElementById('description-heading');
    const descriptionText = document.getElementById('description-text');
    const descriptionView = document.getElementById('description-view');
    const editButton = document.getElementById('description-button');
    const stagLink = document.getElementById('stag-link-container');

    if (response.ok) {
        const data = await response.json();
        const description = data.description || defaultDescription;
        sessionStorage.userData ? descriptionHeading.style.display = 'block' : descriptionHeading.style.display = 'none';
        sessionStorage.userData ? descriptionText.style.display = 'block' : descriptionText.style.display = 'none';
        sessionStorage.userData ? editButton.style.display = 'block' : editButton.style.display = 'none';
        sessionStorage.userData ? stagLink.style.display = 'none' : hasSubjects ? stagLink.style.display = 'inline-block' : stagLink.style.display = 'none';

        if (sessionStorage.userData) {
            descriptionText.value = description;
        } else {
            descriptionView.textContent = description;
            descriptionView.style.display = hasSubjects ? 'block' : 'none';
        }
    } else if (response.status === 404) {
        console.error('Nepodařilo se načíst popis studijního plánu.');
        descriptionText.value = defaultDescription;
        if (JSON.parse(sessionStorage.userData).role === "garant") {
            descriptionText.style.display = 'block';
            editButton.style.display = 'block';
        }
    } else {
        console.error('Nepodařilo se načíst popis studijního plánu.');
        descriptionText.value = defaultDescription;
    }
}

// Funkce pro uložení popisu studijního plánu
async function saveDescription() {
    try {
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

        showMessage(response.ok);
    } catch (error) {
        console.error('Nepodařilo se uložit popis studijního plánu:', error);
        showMessage(false); // Zobrazíme chybovou zprávu
    }
}

// Funkce pro zobrazení zprávy o uložení popisu studijního plánu
function showMessage(isSuccess) {
    const messageElement = document.getElementById('save-message');
    messageElement.textContent = isSuccess ? 'Popis programu byl úspěšně uložen.' : 'Nepodařilo se uložit popis programu.';
    if (isSuccess) {
        messageElement.classList.add('text-green-500');
    }
    else {
        messageElement.classList.add('text-red-500');
    }
    messageElement.classList.remove('opacity-0');
    setTimeout(() => {
        messageElement.style.transition = 'opacity 1s ease-out';
        messageElement.classList.add('opacity-0');
    }, 3000);
}


function logout() {
    sessionStorage.removeItem('userData'); // Smazání dat uživatele
    window.location.href = 'index.html'; // Přesměrování na domovskou stránku
}

