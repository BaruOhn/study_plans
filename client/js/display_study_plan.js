// Tento kód předpokládá, že URL pro načtení dat je ve správném formátu
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const oborIdno = urlParams.get('oborIdno');
    const faculty = urlParams.get('faculty');

    if (oborIdno && faculty) {
        fetchProgramDetail(faculty, oborIdno);
    } else {
        console.error('Chyba: Chybějící parametry v URL.');
    }
});

function fetchProgramDetail(faculty, oborIdno) {
    const filePath = `/data/PRF/studijni_plany/${oborIdno}`;

    fetch(filePath)
        .then(response => response.json())
        .then(data => {
            displayData(data);
        })
        .catch(error => {
            console.error('Chyba při načítání dat:', error);
        });
}

function displayData(data) {
    const mainElement = document.querySelector('main');
    
    // Odstranění duplikátů
    const uniquePredmety = Array.from(new Map(data.predmetOboru.map(predmet => [predmet.nazev, predmet])).values());

    // Vytvoření sekce pro každý ročník
    for (let rocnik = 1; rocnik <= 3; rocnik++) {
        const section = document.createElement('section');
        section.classList.add('m-2');
        section.innerHTML = `
            <h3 class="text-lg font-semibold mt-4">${rocnik}. ročník</h3>
            <div class="flex flex-wrap">
                <div id="${rocnik}RocnikZimniSemestr" class="rocnikContainer mr-1">
                    <h4 class="text-sm text-gray-700 italic">zimní semestr</h4>
                </div>
                <div id="${rocnik}RocnikLetniSemestr" class="rocnikContainer">
                    <h4 class="text-sm text-gray-700 italic">letní semestr</h4>
                </div>
            </div>
        `;
        mainElement.appendChild(section);
    }

    // Přidání předmětů do odpovídajících sekcí
    uniquePredmety.forEach(predmet => {
        const predmetHTML = `
            <div class="h-[45px] w-[220px] bg-blue-400/50 mt-1 mb-1">
                <div class="flex justify-between items-center p-3">
                    <div class="text-xs font-semibold">${predmet.nazev}</div>
                    <div class="text-xs font-light italic text-gray-700">${predmet.kreditu} kreditů</div>
                </div>
            </div>`;

        // Určení ID kontejneru na základě doporučeného ročníku a semestru
        const rocnik = predmet.doporucenyRocnik; // Například 1, 2, 3
        const semestr = predmet.vyukaZS === 'A' ? 'Zimni' : 'Letni';
        const targetId = `${rocnik}Rocnik${semestr}Semestr`;

        // Najdeme odpovídající kontejner pro předmět
        const container = document.getElementById(targetId);

        // Přidání HTML předmětu do správného kontejneru
        if (container) {
            container.innerHTML += predmetHTML;
        }
    });
}
