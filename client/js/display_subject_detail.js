document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const department = urlParams.get('department');
    const acronym = urlParams.get('acronym');
    const faculty = urlParams.get('faculty');

    if (!department || !acronym || !faculty) {
        return console.error('Chyba: Chybějící parametry v URL.');
    }

    try {
        const detailData = await fetchSubjectDetail(department, acronym, faculty);
        displaySubjectDetail(detailData);
    } catch (error) {
        console.error('Chyba při načítání detailu předmětu:', error);
    }

    // Zde přidáme kód pro zpětné tlačítko
    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', () => {
        window.history.back();
    });

    const closeBtn = document.getElementById('close-btn');
    closeBtn.addEventListener('click', () => {
        window.history.back();
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
});

async function fetchSubjectDetail(department, acronym, faculty) {
    const path = `/data/${faculty}/predmety/${department}/${acronym}`;
    const response = await fetch(path);
    if (!response.ok) throw new Error('Chyba při načítání dat');
    return response.json();
}

function displaySubjectDetail(detailData) {
    document.getElementById('zkratka').textContent = ((detailData.katedra + '/' + detailData.zkratka) || '-');
    document.getElementById('nazev').textContent = (detailData.nazev || '-');
    document.getElementById('kredity').textContent = (detailData.kreditu || '-');
    document.getElementById('rozsah').textContent = `${detailData.jednotekPrednasek}+${detailData.jednotekCviceni}+${detailData.jednotekSeminare}S` || '-';
    document.getElementById('zakonceni').textContent = (detailData.typZkousky || '-');
    document.getElementById('anotace').textContent = (detailData.anotace || '-');

    // Zobrazení obsahu a formátování textu 
    const formattedText = (detailData.prehledLatky || '-')
        .replace(/\r\n/g, '<div></div>') // Nahrazení \r\n
        .replace(/\n/g, '<div></div>'); // Nahrazení \n
    document.getElementById('obsah').innerHTML = formattedText;
}

function logout() {
    sessionStorage.removeItem('userData'); // Smazání dat uživatele
    window.location.href = 'index.html'; // Přesměrování na domovskou stránku
}