document.addEventListener('DOMContentLoaded', async () => {
    // Vizualizace tlačítka pro přihlášení/odhlášení
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

function logout() {
    sessionStorage.removeItem('userData'); // Smazání dat uživatele
    window.location.href = 'index.html'; // Přesměrování na domovskou stránku
}