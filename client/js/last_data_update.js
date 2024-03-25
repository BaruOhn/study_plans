document.addEventListener('DOMContentLoaded', async () => {
    getLastUpdateDate();
});

// Získá datum poslední aktualizace dat a zobrazí ho na stránce
function getLastUpdateDate() {
    fetch('/last-update')
        .then(response => response.json())
        .then(data => {
            const updateDate = new Date(data.lastUpdate);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const lastUpdateDateStr = updateDate.toLocaleDateString('cs-CZ', options);

            document.getElementById('last-update').textContent += lastUpdateDateStr;
        })
        .catch(error => {
            console.error('Chyba při získávání data poslední aktualizace:', error);
        });
}