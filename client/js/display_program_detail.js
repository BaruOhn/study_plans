document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const stprIdno = urlParams.get('stprIdno');
  const faculty = urlParams.get('faculty');

  if (stprIdno && faculty) {
    fetchProgramDetail(faculty, stprIdno);
  } else {
    console.error('Chybějící parametry v URL.');
  }

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

function fetchProgramDetail(faculty, stprIdno) {
  const filePath = `/data/${faculty}/programs/${stprIdno}`;

  fetch(filePath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      displayData(data, faculty, stprIdno);
    })
    .catch(error => {
      console.error('Chyba při načítání detailů programu:', error);
    });
}

function displayData(data, faculty, stprIdno) {
  const oborListUl = document.getElementById('obor-seznam');

  data.oborInfo.forEach(obor => {
    const card = document.createElement('a');
    card.href = `study_plan.html?stprIdno=${stprIdno}&oborIdno=${obor.oborIdno}&faculty=${faculty}`; 
    card.className = 'border border-t-0 border-solid border-gray-300 rounded-t-none rounded-b mx-4 mb-8 p-4 sm:p-6 w-full max-w-xs xs:max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl shadow-md hover:shadow-lg transition-shadow';
    card.addEventListener('mouseenter', () => { card.classList.add('shadow-lg') });
    card.addEventListener('mouseleave', () => { card.classList.remove('shadow-lg') });

    const cardHeader = document.createElement('div');
    cardHeader.className = 'text-gray-700 text-lg m-2 font-bold text-center sm:text-left';
    cardHeader.innerHTML = `
        <h4 class="text-lg font-bold">${obor.nazevCz}</h4>
        <span class="text-sm text-gray-600">${obor.forma} forma</span>
    `;

    const cardBody = document.createElement('div');
    cardBody.className = 'm-2 text-center sm:text-left';
    cardBody.innerHTML = `
        <p class="hidden sm:block">${obor.anotaceCz ? obor.anotaceCz : 'Anotace není k dispozici.'}</p>
        <button class="bg-amber-500/90 text-white no-underline rounded-full p-3 -ml-2 mt-4 transition-shadow hover:shadow-md hover:bg-amber-500"><a href="study_plan.html?stprIdno=${stprIdno}&oborIdno=${obor.oborIdno}&faculty=${faculty}"></a>Studijní plán</button>
    `;

    const border = document.createElement('div');
    border.className = 'bg-sky-700/90 h-2 w-full max-w-xs xs:max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl rounded-t rounded-b-none';

    card.appendChild(cardHeader);
    card.appendChild(cardBody);

    oborListUl.appendChild(border);
    oborListUl.appendChild(card);
  });
}

function logout() {
  sessionStorage.removeItem('userData'); // Smazání dat uživatele
  window.location.href = 'index.html'; // Přesměrování na domovskou stránku
}
