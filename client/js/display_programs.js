let currentFilter = 'all'; // Proměnná pro filtr programů podle typu programu

document.addEventListener('DOMContentLoaded', () => {
  setupSearchForm();
  setupFilterTypeButtons();
  setupMobileMenu();
  setupMobileMenuItems();
  fetchProgramData('PRF'); // Počáteční načtení dat
});

function setupSearchForm() {
  document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const searchQuery = document.querySelector('input[type="search"]').value;
    fetchProgramData('PRF', searchQuery); // Předpokládáme, že vyhledáváme pro PRF
  });
}

function setupFilterTypeButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      currentFilter = this.getAttribute('data-filter');
      fetchProgramData('PRF'); // Znovu načteme data a aplikujeme filtr
    });
  });
}

function setupMobileMenu() {
  document.getElementById('menu-btn').addEventListener('click', function () {
    var menu = document.getElementById('mobile-menu');
    if (menu.classList.contains('hidden')) {
      menu.classList.remove('hidden');
    } else {
      menu.classList.add('hidden');
    }
  });
}

function setupMobileMenuItems() {
  document.querySelectorAll('#mobile-menu li').forEach(item => {
    item.addEventListener('click', function() {
      currentFilter = this.getAttribute('data-filter');
      fetchProgramData('PRF'); 
      document.getElementById('mobile-menu').classList.add('hidden');
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

function displayProgramData(data, faculty) {
  const programsContainer = document.getElementById('study-programs');
  programsContainer.innerHTML = '';

  let hasPrograms = false;
  ['bakalářský', 'navazující', 'doktorský'].forEach((programType, index) => {
    const filterMapping = { 'bakalářský': 'bakalarske', 'navazující': 'navazujici', 'doktorský': 'doktorske' };
    if (currentFilter === 'all' || currentFilter === filterMapping[programType]) {
      if (data[programType]) {
        createCardForProgramType(programsContainer, data[programType], programType, faculty);
        hasPrograms = true;
      }
    }
  });
}

function createCardForProgramType(container, programs, type, faculty) {
  // Mapování pro správné české názvy
  const typeMapping = {
    'bakalářský': 'Bakalářské',
    'navazující': 'Navazující',
    'doktorský': 'Doktorské'
  };

  const card = document.createElement('div');
  card.classList.add('bg-white', 'shadow-lg', 'rounded-xl', 'p-6', 'mb-4', 'overflow-hidden', 'animate-pop-in');

  // Použití mapování pro zobrazení správného českého názvu
  const typeName = typeMapping[type] || type;
  card.innerHTML = `<h3 class="text-xl font-semibold text-gray-800 mb-4">${typeName} programy</h3>`;

  const table = createTableForPrograms(programs, faculty);

  // Pokud nejsou nalezeny žádné programy, zobrazíme chybovou zprávu
  if (table.querySelector('tbody tr') !== null) {
    card.appendChild(table);
    container.appendChild(card);
  }
  else {
    card.innerHTML = `<h3 class="text-xl font-semibold text-gray-800 mb-4">${typeName} programy</h3>
                      <p class="text-gray-700 text-lg font-normal text-center mt-4 pb-2">Nebyly nalezeny žádné programy odpovídající zadanému výrazu.</p>`;
    container.appendChild(card);
  }
}


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
