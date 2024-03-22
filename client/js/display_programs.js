let selectedTypeFilters = ["Bakalářský"];
let selectedFormFilters = ["Prezenční"];
let selectedLangFilters = ["Čeština"];

document.addEventListener('DOMContentLoaded', () => {
  // Obnovíme filtry ze sessionStorage
  selectedTypeFilters = JSON.parse(sessionStorage.getItem('selectedTypeFilters')) || ["Bakalářský"];
  selectedFormFilters = JSON.parse(sessionStorage.getItem('selectedFormFilters')) || ["Prezenční"];
  selectedLangFilters = JSON.parse(sessionStorage.getItem('selectedLangFilters')) || ["Čeština"];
  
  // Obnovíme vyhledávací dotaz ze sessionStorage
  const savedSearchQuery = sessionStorage.getItem('searchQuery') || '';
  document.querySelector('#search-input').value = savedSearchQuery;

  // Nastavení funkcí pro vyhledávání a filtry
  setupSearchForm();
  setupSearchIconClick();
  setupFilterButtons('.filter-btn-type', selectedTypeFilters);
  setupFilterButtons('.filter-btn-form', selectedFormFilters);
  setupFilterButtons('.filter-btn-lang', selectedLangFilters);

  // Načteme data s obnovenými filtry a vyhledávacím dotazem
  fetchProgramData('PRF', savedSearchQuery);
  getLastUpdateDate();
});

// Nastavení vyhledávacího formuláře
function setupSearchForm() {
  document.querySelector('#search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const searchQuery = document.querySelector('#search-input').value;
    saveFiltersToSessionStorage(); 
    fetchProgramData('PRF', searchQuery);
  });
}

// Nastavení kliknutí na ikonu vyhledávání (pro mobilní zařízení)
function setupSearchIconClick() {
  document.querySelector('#search-icon').addEventListener('click', () => {
    const searchQuery = document.querySelector('#search-input').value;
    saveFiltersToSessionStorage(); 
    fetchProgramData('PRF', searchQuery);
  });
}

// Nastavení tlačítek filtrů
function setupFilterButtons(selector, selectedFilters) {
  document.querySelectorAll(selector).forEach(btn => {
    const filterValue = btn.getAttribute('data-filter');

    // Aktivace tlačítka, pokud je filtr vybrán
    toggleButtonActiveState(btn, selectedFilters.includes(filterValue));

    btn.addEventListener('click', function () {
      const filterIndex = selectedFilters.indexOf(filterValue);
      if (filterIndex > -1) {
        selectedFilters.splice(filterIndex, 1); // Odebrání filtru
      } else {
        selectedFilters.push(filterValue); // Přidání filtru
      }
      toggleButtonActiveState(this, filterIndex === -1);

      // Znovunačtení dat po změně filtrů (včetně vyhledávacího dotazu)
      const searchQuery = document.querySelector('#search-input').value;
      fetchProgramData('PRF', searchQuery);

      // Uložení filtrů do session storage
      saveFiltersToSessionStorage();
    });
  });
}

// Pomocná funkce pro změnu vzhledu tlačítka
function toggleButtonActiveState(button, isActive) {
  if (isActive) {
    button.classList.remove('bg-white', 'text-sky-700');
    button.classList.add('bg-amber-500', 'text-white');
  } else {
    button.classList.remove('bg-amber-500', 'text-white');
    button.classList.add('bg-white', 'text-sky-700');
  }
}

// Načte data o studijních programech z JSON souboru
function fetchProgramData(faculty, searchQuery = '') {
  const filePath = `/data/${faculty}/${faculty}_studijni_programy.json`;
  fetch(filePath)
    .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! status: ${response.status}`))
    .then(data => displayProgramData(searchQuery ? filterPrograms(data, searchQuery) : data, faculty))
    .catch(error => console.error('Chyba při načítání dat:', error));
}

// Filtruje programy podle zadaného vyhledávacího dotazu
function filterPrograms(data, query) {
  return Object.fromEntries(Object.entries(data).map(([programType, programs]) => [
    programType,
    Object.fromEntries(Object.entries(programs).filter(([programName, programGroup]) => {
      const nameWords = programName.toLowerCase().split(' ');
      const queryWords = query.toLowerCase().split(' ');

      const minDistance = nameWords.reduce((min, nameWord) => {
        const distances = queryWords.map(queryWord =>
          getLevenshteinDistance(queryWord, nameWord)
        );
        return Math.min(min, ...distances);
      }, Infinity);

      const maxDistance = 3;
      return minDistance <= maxDistance;
    }))
  ]));
}

// Pomocná funkce pro výpočet Levenshteinovy vzdálenosti
function getLevenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      dp[i][j] = Math.max(i, j);
    }
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1]));
    }
  }

  return dp[m][n];
}

// Filtruje programy podle zvolených tlačítek filtrů
function filterProgramsByCriteria(allPrograms, selectedFilters, criteriaKey) {
  let programsAfterFiltering = {};

  Object.keys(allPrograms).forEach(programName => {
    // Získání detailů konkrétního programu
    const specificProgramDetails = allPrograms[programName];
    const programsMatchingCriteria = Object.entries(specificProgramDetails).filter(([programId, programDetails]) => {
      return selectedFilters.length === 0 || selectedFilters.includes(programDetails[criteriaKey]);
    }).reduce((filteredPrograms, [programId, programDetails]) => {
      // Vytvoření nového objektu s programy, které prošly filtrem
      filteredPrograms[programId] = programDetails;
      return filteredPrograms;
    }, {});

    // Pokud existují nějaké programy po filtraci, přidají se do výsledného objektu
    if (Object.keys(programsMatchingCriteria).length > 0) {
      programsAfterFiltering[programName] = programsMatchingCriteria;
    }
  });

  return programsAfterFiltering;
}

// Uloží vybrané filtry do session storage
function saveFiltersToSessionStorage() {
  sessionStorage.setItem('selectedTypeFilters', JSON.stringify(selectedTypeFilters));
  sessionStorage.setItem('selectedFormFilters', JSON.stringify(selectedFormFilters));
  sessionStorage.setItem('selectedLangFilters', JSON.stringify(selectedLangFilters));
  sessionStorage.setItem('searchQuery', document.querySelector('#search-input').value);
}

// Vyfiltruje a zobrazí programy podle zadaných filtrů a zavolá funkci pro vytvoření karet
function displayProgramData(data, faculty) {
  const programsContainer = document.getElementById('study-programs');
  programsContainer.innerHTML = '';

  ['Bakalářský', 'Navazující', 'Doktorský'].forEach(programType => {
    if (selectedTypeFilters.includes(programType)) {
      let programData = data[programType] || {};
      let filteredByForm = filterProgramsByCriteria(programData, selectedFormFilters, 'forma');
      let filteredByLanguage = filterProgramsByCriteria(filteredByForm, selectedLangFilters, 'jazyk');

      // Pokud existují nějaké programy po filtraci, zavolá se funkce pro vytvoření karty
      if (Object.keys(filteredByLanguage).length > 0) {
        createCardForProgramType(programsContainer, filteredByLanguage, programType, faculty);
      } else {
        // Jinak se vytvoří prázdná karta s informací o neúspěšném vyhledání
        createCardForProgramType(programsContainer, {}, programType, faculty);
      }
    }
  });
}

// Vytvoří kartu pro daný typ programu
function createCardForProgramType(container, programs, type, faculty) {
  // Mapování pro správné české názvy
  const typeMapping = {
    'Bakalářský': 'Bakalářské',
    'Navazující': 'Navazující',
    'Doktorský': 'Doktorské'
  };

  const card = document.createElement('div');
  card.className = 'bg-white shadow-md rounded-lg overflow-hidden w-full mb-8 animate-pop-in';

  const header = document.createElement('div');
  header.className = 'py-2 px-4';

  const body = document.createElement('div');
  body.className = 'p-4';

  const typeName = typeMapping[type] || type;
  body.innerHTML = `<h3 class="text-xl font-semibold text-gray-800 px-2 py-4">${typeName} programy</h3>`;

  const table = createTableForPrograms(programs, faculty);

  // Kontrola, zda tabulka obsahuje nějaké programy
  if (table.querySelector('tbody tr') !== null) {
    header.className += ' bg-sky-700/90';
    body.appendChild(table);
  } else {
    header.className += ' bg-gray-400';
    const noProgramsMessage = document.createElement('p');
    noProgramsMessage.className = 'text-gray-700 text-lg font-normal text-center mt-4 pb-2';
    noProgramsMessage.textContent = 'Nebyly nalezeny žádné programy odpovídající zadanému výrazu.';
    body.appendChild(noProgramsMessage);
  }

  card.appendChild(header);
  card.appendChild(body);

  container.appendChild(card);
}

// Vytvoří tabulku programů pro daný typ programu
function createTableForPrograms(programs, faculty) {
  let table = document.createElement('table');
  table.classList.add('min-w-full', 'leading-normal');
  table.innerHTML = `
    <thead>
      <tr class="text-left">
        <th class="text-gray-700 border-b font-bold p-3">Název</th>
        <th class="text-gray-700 border-b font-bold p-3">Forma</th>
        <th class="text-gray-700 border-b font-bold p-3 hidden md:table-cell">Garant</th>
        <th class="text-gray-700 border-b font-bold p-3 hidden md:table-cell">Jazyk</th>
        <th class="text-gray-700 border-b font-bold p-3 hidden md:table-cell">Platný od</th>
      </tr>
    </thead>`;
  const tbody = document.createElement('tbody');
  Object.entries(programs).forEach(([programName, programGroup]) => {
    Object.entries(programGroup).forEach(([id, program]) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td class="text-gray-700 border-b border-gray-200 p-3 max-w-40 font-bold">${program.nazevCz || program.nazev}</td>
        <td class="text-gray-600 border-b border-gray-200 p-3 max-w-40">${program.forma}</td>
        <td class="text-gray-600 border-b border-gray-200 p-3 hidden max-w-40 md:table-cell">${program.garant || '-'}</td>
        <td class="text-gray-600 border-b border-gray-200 p-3 hidden max-w-40 md:table-cell">${program.jazyk}</td>
        <td class="text-gray-600 border-b border-gray-200 p-3 hidden max-w-40 md:table-cell">${program.platnyOd}</td>`;
      row.classList.add('cursor-pointer', 'hover:bg-gray-100');
      row.addEventListener('click', () => {
        window.location.href = `/program_detail.html?stprIdno=${id}&faculty=${faculty}`;
      });
    });
  });
  table.appendChild(tbody);
  return table;
}

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

