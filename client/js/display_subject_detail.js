document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const predmetIdno = urlParams.get('predmetIdno');
    const faculty = urlParams.get('faculty');

    if (!predmetIdno || !faculty) {
        return console.error('Chyba: Chybějící parametry v URL.');
    }

    try {
        const detailData = await fetchSubjectDetail(predmetIdno, faculty);
        displaySubjectDetail(detailData);
    } catch (error) {
        console.error('Chyba při načítání detailu předmětu:', error);
    }

    // Zde přidáme kód pro zobrazení modálního okna
    const modal = document.getElementById('subject-detail-modal');

    // Zde přidáme kód pro zobrazení modálního okna po kliknutí na předmět
    const subjectLinks = document.querySelectorAll('.subject-link');
    subjectLinks.forEach(link => {
        link.addEventListener('click', async () => {
            // Načíst a zobrazit detaily předmětu
            const predmetIdno = link.dataset.predmetIdno;
            const faculty = link.dataset.faculty;
            try {
                const detailData = await fetchSubjectDetail(predmetIdno, faculty);
                displaySubjectDetail(detailData);
                modal.classList.remove('hidden');
            } catch (error) {
                console.error('Chyba při načítání detailu předmětu:', error);
            }
        });
    });

    // Zde přidáme kód pro zavření modálního okna
    const closeBtn = document.getElementById('close-modal-btn');
    const closeBtnBottom = document.getElementById('close-modal-btn-bottom');

    closeBtn.addEventListener('click', closeModal);
    closeBtnBottom.addEventListener('click', closeModal);

    function closeModal() {
        modal.classList.add('hidden');
        const refererUrl = document.referrer;
        window.location.href = refererUrl;
    }
});

async function fetchSubjectDetail(predmetIdno, faculty) {
    const path = `/data/${faculty}/predmety/${predmetIdno}`;
    const response = await fetch(path);
    if (!response.ok) throw new Error('Chyba při načítání dat');
    return response.json();
}

function displaySubjectDetail(detailData) {
    document.getElementById('zkratka').textContent = ((detailData.katedra + '/' + detailData.zkratka) || '-');
    document.getElementById('nazev').textContent = (detailData.nazev || '-');
    document.getElementById('kredity').textContent = (detailData.kreditu || '-');
    document.getElementById('rozsah').textContent = `${detailData.jednotekPrednasek}+${detailData.jednotekCviceni}+${detailData.jednotekSeminare}S` || '-';
    document.getElementById('zakonceni').textContent = (detailData.typZkousky || '-'); + (detailData.formaZkousky || '-');;
    document.getElementById('anotace').textContent = (detailData.anotace || '-');
    document.getElementById('obsah').textContent = (detailData.prehledLatky || '-');
}

