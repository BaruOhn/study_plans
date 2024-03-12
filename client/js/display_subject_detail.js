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
