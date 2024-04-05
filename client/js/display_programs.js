let selectedTypeFilters = ["Bakalářský"];
let selectedFormFilters = ["Prezenční"];
let selectedLangFilters = ["Čeština"];
let allPrograms = [];

document.addEventListener('DOMContentLoaded', () => {
  selectedTypeFilters = JSON.parse(sessionStorage.getItem('selectedTypeFilters')) || ["Bakalářský"];
  selectedFormFilters = JSON.parse(sessionStorage.getItem('selectedFormFilters')) || ["Prezenční"];
  selectedLangFilters = JSON.parse(sessionStorage.getItem('selectedLangFilters')) || ["Čeština"];

  setupSearchForm();
  setupSearchIconClick();
  setupFilterButtons('.filter-btn-type', selectedTypeFilters);
  setupFilterButtons('.filter-btn-form', selectedFormFilters);
  setupFilterButtons('.filter-btn-lang', selectedLangFilters);

  const savedSearchQuery = sessionStorage.getItem('searchQuery') || '';
  document.querySelector('#search-input').value = savedSearchQuery;

  fetchProgramData('PRF', savedSearchQuery);
});

// Nastavení vyhledávacího formuláře
function setupSearchForm() {
  const searchInput = document.querySelector('#search-input');

  searchInput.addEventListener('input', () => {
    const inputText = searchInput.value;
    displaySuggestions(inputText); // Zobrazí návrhy na základě textu vstupu
  });

  document.querySelector('#search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const searchQuery = searchInput.value;
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
    toggleButtonActiveState(btn, selectedFilters.includes(filterValue));
    btn.addEventListener('click', function () {
      const filterIndex = selectedFilters.indexOf(filterValue);
      if (filterIndex > -1) {
        selectedFilters.splice(filterIndex, 1);
      } else {
        selectedFilters.push(filterValue);
      }
      toggleButtonActiveState(this, filterIndex === -1);
      const searchQuery = document.querySelector('#search-input').value;
      fetchProgramData('PRF', searchQuery);
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

// Načte data o studijních programech z JSON souboru a uloží je do proměnné allPrograms
function fetchProgramData(faculty, searchQuery = '') {
  const filePath = `/data/${faculty}/${faculty}_studijni_programy.json`;
  fetch(filePath)
    .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! status: ${response.status}`))
    .then(data => {
      allPrograms = data; // Uložení načtených dat do proměnné allPrograms
      displayProgramData(searchQuery ? filterPrograms(data, searchQuery) : data, faculty);
    })
    .catch(error => console.error('Chyba při načítání dat:', error));
}

function displaySuggestions(inputText) {
  const suggestionsContainer = document.querySelector('#search-suggestions');
  suggestionsContainer.innerHTML = '';
  suggestionsContainer.style.display = inputText.length > 0 ? 'block' : 'none';
  let hasSuggestions = false;

  // Změna zaoblení vstupního pole podle toho, zda je zadaný text
  toggleInputStyle(inputText.length > 0);

  if (inputText.length > 0) {
    // Filtruje programy podle typu programu
    let filteredByType = {};
    selectedTypeFilters.forEach(type => {
      if (allPrograms[type]) {
        filteredByType[type] = allPrograms[type];
      }
    });

    let filteredByFormAndLanguage = {};
    Object.keys(filteredByType).forEach(type => {
      filteredByFormAndLanguage[type] = filterProgramsByCriteria(filteredByType[type], selectedFormFilters, 'forma');
      filteredByFormAndLanguage[type] = filterProgramsByCriteria(filteredByFormAndLanguage[type], selectedLangFilters, 'jazyk');
    });

    const finalFilteredPrograms = filterPrograms(filteredByFormAndLanguage, inputText);
    Object.entries(finalFilteredPrograms).forEach(([programType, programs]) => {
      Object.entries(programs).forEach(([programName, programDetails]) => {
        hasSuggestions = true;
        const suggestionElement = document.createElement('div');
        suggestionElement.classList = 'suggestion cursor-pointer hover:bg-gray-100 hover:last:rounded-b-3xl px-6 py-2';
        suggestionElement.innerText = programName;
        suggestionsContainer.appendChild(suggestionElement);

        suggestionElement.addEventListener('click', () => {
          const searchInput = document.querySelector('#search-input');
          searchInput.value = programName;
          suggestionsContainer.style.display = 'none';

          saveFiltersToSessionStorage();
          fetchProgramData('PRF', programName);
          toggleInputStyle(false);
        });
      });
    });
  }
}

function toggleInputStyle(showSuggestions) {
  const searchInput = document.querySelector('#search-input');

  if (showSuggestions) {
    searchInput.classList.remove('rounded-3xl');
    searchInput.classList.add('rounded-t-3xl');
    searchInput.classList.add('border-b-2', 'border-gray-200');
  } else {
    searchInput.classList.remove('rounded-t-3xl');
    searchInput.classList.add('rounded-3xl');
    searchInput.classList.remove('border-b-2', 'border-gray-200');
  }
}

// Filtruje programy podle zadaného vyhledávacího dotazu
function filterPrograms(data, query) {
  return Object.fromEntries(Object.entries(data).map(([programType, programs]) => [
    programType,
    Object.fromEntries(Object.entries(programs).filter(([programName, programGroup]) => {
      const nameWords = programName.toLowerCase().split(' ');
      const queryLowerCase = query.toLowerCase();
      const queryWords = queryLowerCase.split(' ');

      // Pro dotazy o délce 4 znaky a méně použiju jednoduchou přímou shodu
      if (query.length <= 4) {
        return nameWords.some(nameWord => nameWord.includes(queryLowerCase));
      }

      if (queryWords.length > 1) {
        const nameString = nameWords.join(' '); // Sjednotíme slova názvu programu do jednoho řetězce
        return nameString.includes(queryLowerCase); // Kontrolujeme, zda název programu obsahuje celý dotaz
      }

      let isMatch = false;
      nameWords.forEach(nameWord => {
        if (nameWord.startsWith(queryLowerCase)) {
          isMatch = true;
        }
      });

      // Pokud nebyla nalezena přímá shoda, použijte průměrnou Levenshteinovu vzdálenost
      if (!isMatch) {
        let totalDistance = 0;
        nameWords.forEach(nameWord => {
          const distance = getLevenshteinDistance(queryLowerCase, nameWord);
          totalDistance += distance;
        });
        const averageDistance = totalDistance / nameWords.length;
        const maxDistance = query.length > 8 ? 2 : 3;  // Pro delší dotazy použijeme větší maximální vzdálenost
        isMatch = averageDistance <= maxDistance;
      }

      return isMatch;
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
    const specificProgramDetails = allPrograms[programName];
    const programsMatchingCriteria = Object.entries(specificProgramDetails).filter(([programId, programDetails]) => {
      return selectedFilters.length === 0 || selectedFilters.includes(programDetails[criteriaKey]);
    }).reduce((filteredPrograms, [programId, programDetails]) => {
      filteredPrograms[programId] = programDetails;
      return filteredPrograms;
    }, {});

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

      if (Object.keys(filteredByLanguage).length > 0) {
        createCardForProgramType(programsContainer, filteredByLanguage, programType, faculty);
      } else {
        createCardForProgramType(programsContainer, {}, programType, faculty);
      }
    }
  });
}

// Vytvoří kartu pro daný typ programu
function createCardForProgramType(container, programs, type, faculty) {
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
  body.innerHTML = `<h3 class="text-lg xs:text-xl font-semibold text-gray-800 px-2 py-4">${typeName} programy</h3>`;

  const table = createTableForPrograms(programs, faculty);

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
        <th class="text-gray-700 text-xs xs:text-base border-b font-bold px-2 py-3 xs:px-3">Název</th>
        <th class="text-gray-700 text-xs xs:text-base border-b font-bold px-2 py-3 xs:px-3">Forma</th>
        <th class="text-gray-700 text-xs xs:text-base border-b font-bold px-2 py-3 xs:px-3 hidden md:table-cell">Garant</th>
        <th class="text-gray-700 text-xs xs:text-base border-b font-bold px-2 py-3 xs:px-3 hidden md:table-cell">Jazyk</th>
        <th class="text-gray-700 text-xs xs:text-base border-b font-bold px-2 py-3 xs:px-3">Platný od</th>
      </tr>
    </thead>`;
  const tbody = document.createElement('tbody');
  Object.entries(programs).forEach(([programName, programGroup]) => {
    Object.entries(programGroup).forEach(([id, program]) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td class="text-gray-700 text-xs xs:text-base border-b border-gray-200 px-2 py-3 xs:px-3 max-w-40 font-bold">${program.nazevCz || program.nazev}</td>
        <td class="text-gray-600 text-xs xs:text-base border-b border-gray-200 px-2 py-3 xs:px-3 max-w-40">${program.forma}</td>
        <td class="text-gray-600 text-xs xs:text-base border-b border-gray-200 px-2 py-3 xs:px-3 hidden max-w-40 md:table-cell">${program.garant || '-'}</td>
        <td class="text-gray-600 text-xs xs:text-base border-b border-gray-200 px-2 py-3 xs:px-3 hidden max-w-40 md:table-cell">${program.jazyk}</td>
        <td class="text-gray-600 text-xs xs:text-base border-b border-gray-200 px-2 py-3 xs:px-3 max-w-40 text-center xs:text-left">${program.platnyOd}</td>`;
      row.classList.add('cursor-pointer', 'hover:bg-gray-100');
      row.addEventListener('click', () => {
        window.location.href = `/program_detail.html?stprIdno=${id}&faculty=${faculty}`;
      });
    });
  });
  table.appendChild(tbody);
  return table;
}
