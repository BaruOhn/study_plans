let selectedTypeFilters = ["Bakalářský"]; // Pole pro filtr programů podle typu programu

document.addEventListener('DOMContentLoaded', () => {
  setupSearchForm();
  setupFilterButtons();
  setupSearchIconClick(); // Přidání obsluhy kliknutí na ikonu lupy
  fetchProgramData('PRF'); // Počáteční načtení dat
});

function setupSearchForm() {
  document.querySelector('#search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const searchQuery = document.querySelector('#search-input').value;
    fetchProgramData('PRF', searchQuery); // Předpokládáme, že vyhledáváme pro PRF
  });
}

function setupSearchIconClick() {
  document.querySelector('#search-icon').addEventListener('click', () => {
    const searchQuery = document.querySelector('#search-input').value;
    fetchProgramData('PRF', searchQuery);
  });
}

function setupFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const filterValue = btn.getAttribute('data-filter');

    // Pokud je filtr vybrán, nastavíme tlačítko jako aktivní
    if (selectedTypeFilters.includes(filterValue)) {
      btn.classList.remove('bg-white', 'text-sky-700');
      btn.classList.add('bg-amber-500', 'text-white');
    }

    btn.addEventListener('click', function () {
      if (selectedTypeFilters.includes(filterValue)) {
        // Odebrání filtru
        selectedTypeFilters = selectedTypeFilters.filter(f => f !== filterValue);
        this.classList.remove('bg-amber-500', 'text-white');
        this.classList.add('bg-white', 'text-sky-700');
      } else {
        // Přidání filtru
        selectedTypeFilters.push(filterValue);
        this.classList.remove('bg-white', 'text-sky-700');
        this.classList.add('bg-amber-500', 'text-white');
      }
      fetchProgramData('PRF'); // Znovu načteme data s aktualizovanými filtry
    });
  });
}


function fetchProgramData(faculty, searchQuery = '') {
  const filePath = `/data/${faculty}/${faculty}_studijni_programy.json`;
  fetch(filePath)
    .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! status: ${response.status}`))
    .then(data => displayProgramData(searchQuery ? filterPrograms(data, searchQuery) : data, faculty))
    .catch(error => console.error('Chyba při načítání dat:', error));
}

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

      // Pokud je vzdálenost menší nebo rovna 5, program se zobrazí
      const maxDistance = 3;

      return minDistance <= maxDistance;
    }))
  ]));
}

function getLevenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = [];

  // Inicializace DP tabulky
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      dp[i][j] = Math.max(i, j);
    }
  }

  // Výpočet vzdálenosti
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1]));
    }
  }

  // Výsledek (vzdálenost) je v pravém dolním rohu tabulky 
  return dp[m][n];
}

// Vytvoří kartu pro zvolené typy programů a vyfiltruje ostatní
function displayProgramData(data, faculty) {
  const programsContainer = document.getElementById('study-programs');
  programsContainer.innerHTML = '';

  ['Bakalářský', 'Navazující', 'Doktorský'].forEach((programType) => {
    if (selectedTypeFilters.includes(programType)) {
      if (data[programType]) {
        createCardForProgramType(programsContainer, data[programType], programType, faculty);
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
  header.className = 'bg-sky-700/90 py-2 px-4';

  const body = document.createElement('div');
  body.className = 'p-4';

  // Použití mapování pro zobrazení správného českého názvu
  const typeName = typeMapping[type] || type;
  body.innerHTML = `<h3 class="text-xl font-semibold text-gray-800 px-2 py-4">${typeName} programy</h3>`;

  const table = createTableForPrograms(programs, faculty);

  // Pokud nejsou nalezeny žádné programy, zobrazíme chybovou zprávu
  if (table.querySelector('tbody tr') !== null) {
    body.appendChild(table);
  }
  else {
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
