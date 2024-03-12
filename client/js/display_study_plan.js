let oborTyp = "";

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
        await fetchProgramDetail(faculty, oborIdno, stprIdno);
    } catch (error) {
        console.error('Chyba při načítání studijního plánu:', error);
    }
});

async function fetchProgramDetail(faculty, oborIdno, stprIdno) {
    // Sestavení cest a načtení dat
    const studyProgramPath = `/data/${faculty}/obory/${stprIdno}`;
    const studyPlanPath = `/data/${faculty}/studijni_plany/${oborIdno}`;

    const oborData = await fetchData(studyProgramPath);

    // Převedení oborIdno na číslo (v url string, ale v datech číslo)
    const oborIdnoNum = parseInt(oborIdno, 10);

    // Najděte správný obor podle oborIdno
    const selectedObor = oborData.oborInfo.find(obor => obor.oborIdno === oborIdnoNum);

    // Aktualizujte záhlaví stránky správným oborem
    if (selectedObor) {
        updatePageHeader(selectedObor);
    } else {
        console.error('Obor s daným ID nebyl nalezen.');
    }

    const data = await fetchData(studyPlanPath);
    displayData(data, faculty);
}

async function fetchData(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Chyba při načítání dat');
    return response.json();
}

function updatePageHeader(obor) {
    const headerTitle = document.querySelector('header h2');
    const headerSubtitle = document.querySelector('header span');
    const headerTitle2 = document.querySelector('header h3');


    oborTyp = obor.typ.toLowerCase();

    if (obor && obor.nazev && obor.forma) {
        headerTitle.textContent = `${obor.nazev} - studijní plán`;
        headerSubtitle.textContent = `${oborTyp} program`;
        headerTitle2.textContent = `${obor.forma} forma studia`

    } else {
        headerTitle.textContent = 'Studijní plán - Neznámý obor';
        headerSubtitle.textContent = 'Neznámý typ programu';
        headerTitle2.textContent = 'Neznámá forma studia';
    }
}

// Funkce pro vytvoření HTML sekce pro každý ročník
function createSectionForYear(rocnik) {
    const section = document.createElement('section');
    section.classList.add('m-2');
    section.innerHTML = `
        <h4 class="text-lg font-extrabold text-gray-800/80 mt-4">${rocnik}. ročník</h4>
        <div class="flex flex-wrap justify-center">
            <div id="${rocnik}RocnikZimniSemestr" class="rocnikContainer mr-0.5">
                <h5 class="text-sm text-gray-700 italic -mt-1 mb-3">zimní semestr</h5>
            </div>
            <div id="${rocnik}RocnikLetniSemestr" class="rocnikContainer">
                <h5 class="text-sm text-gray-700 italic -mt-1 mb-3">letní semestr</h5>
            </div>
        </div>
    `;
    return section;
}

function createSectionForHelper() {
    const section = document.createElement('section');
    section.innerHTML = `
        <div class="mx-2 mt-24 mb-12">
            <p class="text-sm text-gray-800 w-4/5">Za celé studium musí studenti získat 180 kreditů. Kromě uvedených předmětů
                si mohou vybírat také z bohaté nabídky předmětů dalších kateder.</p>
            <div class="text-gray-700 italic">
                <div class="flex items-center mt-2">
                    <div class="w-5 h-5 bg-sky-500/50 mr-2"></div>
                    <p class="text-sm">povinné předměty</p>
                </div>
                <div class="flex items-center mt-2">
                    <div class="w-5 h-5 bg-amber-400/50 mr-2"></div>
                    <p class="text-sm">povinně volitelné předměty</p>
                </div>
                <div class="flex items-center mt-2">
                    <div class="w-5 h-5 bg-red-400/50 mr-2"></div>
                    <p class="text-sm">volitelné předměty</p>
                </div>
            </div>
        </div>
    `;
    return section;
}

function displayData(data, faculty) {
    // Najdeme hlavní element pro vložení obsahu 
    const mainElement = document.querySelector('main');

    // Kontrola, zda pole predmetOboru obsahuje nějaké předměty
    if (data.predmetOboru.length === 0) {
        // Zobrazení zprávy, že nejsou dostupné žádné předměty
        const noDataMessage = document.createElement('div');
        noDataMessage.textContent = 'Pro vybraný studijní plán nejsou ve STAGu k dispozici žádné předměty.';
        noDataMessage.classList.add('text-gray-800', 'text-lg', 'font-semibold', 'mt-12', 'text-center', 'w-full', 'mx-auto');
        mainElement.appendChild(noDataMessage);

    } else {
        // Filtrujeme předměty s 0 kredity a odstraníme duplikáty předmětů
        const uniquePredmety = Array.from(new Map(data.predmetOboru.filter(predmet => predmet.kreditu > 0).map(predmet => [predmet.nazev, predmet])).values());

        // Rozdělení předmětů podle statutu
        let predmetyPodleStatutu = {
            "A": [],
            "B": [],
            "C": []
        };
        uniquePredmety.forEach(predmet => {
            predmetyPodleStatutu[predmet.statut].push(predmet);
        });

        // Řazení předmětů v každé skupině podle názvu
        Object.keys(predmetyPodleStatutu).forEach(statut => {
            predmetyPodleStatutu[statut].sort((a, b) => a.nazev.localeCompare(b.nazev));
        });

        // Určení počtu ročníků na základě typu studia
        let pocetRocniku;
        if (oborTyp === 'bakalářský' || oborTyp === 'doktorský') {
            pocetRocniku = 3;
        } else if (oborTyp === 'navazující') {
            pocetRocniku = 2;
        } else {
            pocetRocniku = 3; // Výchozí hodnota pro neznámý typ
        }

        // Vytvoření sekce pro každý ročník
        for (let rocnik = 1; rocnik <= pocetRocniku; rocnik++) {
            const section = createSectionForYear(rocnik);
            mainElement.appendChild(section);
        }

        // Přidání předmětů do odpovídajících sekcí
        Object.values(predmetyPodleStatutu).forEach(skupina => {
            skupina.forEach(predmet => {
                const bgColorClass = predmet.statut === "A" ? 'bg-sky-500/50' : predmet.statut === "B" ? 'bg-amber-400/50' : 'bg-red-400/50';
                const predmetHTML = `
                <a href="subject_detail.html?faculty=${faculty}&department=${predmet.katedra}&acronym=${predmet.zkratka}" class="block ${bgColorClass} my-0.5">
                        <div class="flex items-center h-12 w-[54] justify-between font-sans px-4 py-6">
                            <div class="text-sm font-normal line-clamp-3 leading-tight w-44">${predmet.nazev}</div>
                            <div class="text-sm font-light italic text-gray-700">${predmet.kreditu}</div>
                        </div>
                    </a>`;

                const rocnik = predmet.doporucenyRocnik;
                const semestr = predmet.vyukaZS === 'A' ? 'Zimni' : 'Letni';
                const targetId = `${rocnik}Rocnik${semestr}Semestr`;

                const container = document.getElementById(targetId);
                if (container) {
                    container.innerHTML += predmetHTML;
                }
            });
        });

        const sectionHelp = createSectionForHelper();
        // Přidání sekce s nápovědou
        mainElement.appendChild(sectionHelp)

    }
}
