let selectedTypeFilters = ["Bakalářský"];
let selectedFormFilters = ["Prezenční"];
let selectedLangFilters = ["Čeština"];
let allPrograms = [];
let programPreferences = {};

document.addEventListener('DOMContentLoaded', () => {
  selectedTypeFilters = JSON.parse(sessionStorage.getItem('selectedTypeFilters')) || ["Bakalářský"];
  selectedFormFilters = JSON.parse(sessionStorage.getItem('selectedFormFilters')) || ["Prezenční"];
  selectedLangFilters = JSON.parse(sessionStorage.getItem('selectedLangFilters')) || ["Čeština"];

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

  setupSearchForm();
  setupSearchIconClick();
  setupFilterButtons('.filter-btn-type', selectedTypeFilters);
  setupFilterButtons('.filter-btn-form', selectedFormFilters);
  setupFilterButtons('.filter-btn-lang', selectedLangFilters);

  loadPreferences();

  const savedSearchQuery = sessionStorage.getItem('searchQuery') || '';
  document.querySelector('#search-input').value = savedSearchQuery;
});

// Nastavení vyhledávacího formuláře
function setupSearchForm() {
  const searchInput = document.querySelector('#search-input');

  searchInput.addEventListener('input', () => {
    const inputText = searchInput.value;
    displaySuggestions(inputText); // Zobrazí návrhy na základě inputu
  });

  document.querySelector('#search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const searchQuery = searchInput.value;
    saveFiltersToSessionStorage();
    fetchProgramData('PRF', searchQuery); // Načte data programů na základě zadaného dotazu
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

  loadPreferences();
}

// Načte data o studijních programech a uloží je do proměnné allPrograms
function fetchProgramData(faculty, searchQuery = '') {
  const filePath = `/data/${faculty}/${faculty}_studijni_programy.json`;
  fetch(filePath)
    .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! status: ${response.status}`))
    .then(data => {
      allPrograms = data;
      displayProgramData(searchQuery ? filterPrograms(data, searchQuery) : data, faculty);
    })
    .catch(error => console.error('Chyba při načítání dat:', error));
}

// Zobrazí návrhy na základě zadaného textu
function displaySuggestions(inputText) {
  const suggestionsContainer = document.querySelector('#search-suggestions');
  suggestionsContainer.innerHTML = '';
  suggestionsContainer.style.display = inputText.length > 0 ? 'block' : 'none';
  let hasSuggestions = false;

  // Změna zaoblení vstupního pole podle toho, zda je zadaný text
  toggleInputStyle(inputText.length > 0);

  if (inputText.length > 0) {
    // Zobrazí pouze návrhy podle zvolených filtrů
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

    // Zobrazí pouze návrhy odpovídající zadanému textu
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
    toggleInputStyle(hasSuggestions);

    // Pokud nebyly nalezeny žádné návrhy, zavřeme kontejner s návrhy
    if (!hasSuggestions) {
      suggestionsContainer.style.display = 'none';
    }
  }
}

// Změní vzhled vstupního pole podle toho, zda se zobrazují návrhy
function toggleInputStyle(showSuggestions) {
  const searchInput = document.querySelector('#search-input');

  if (showSuggestions) {
    searchInput.classList.remove('rounded-3xl');
    searchInput.classList.add('rounded-t-3xl', 'border-b-2', 'border-gray-200');
  } else {
    searchInput.classList.remove('rounded-t-3xl', 'border-b-2', 'border-gray-200');
    searchInput.classList.add('rounded-3xl');
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

      // Pro dotazy o délce 4 znaky a méně použijeme jednoduchou přímou shodu
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
      // Pokud nejsou vybrány žádné filtry, zobrazíme všechny programy
      return selectedFilters.length === 0 || selectedFilters.includes(programDetails[criteriaKey]);
    }).reduce((filteredPrograms, [programId, programDetails]) => {
      // Přidání programu do filtrovaného seznamu
      filteredPrograms[programId] = programDetails;
      return filteredPrograms;
    }, {});

    // Pokud byly nalezeny programy odpovídající zvoleným filtrům, přidáme je do seznamu
    if (Object.keys(programsMatchingCriteria).length > 0) {
      programsAfterFiltering[programName] = programsMatchingCriteria;
    }
  });

  return programsAfterFiltering;
}

// Filtruje programy podle přihlášeného garanta
function filterProgramsByGuarantor(allPrograms, guarantorFullName) {
  let filteredPrograms = {};
  const guarantorName = guarantorFullName.trim();
  Object.keys(allPrograms).forEach(programType => {
    filteredPrograms[programType] = {};

    Object.keys(allPrograms[programType]).forEach(programName => {
      Object.keys(allPrograms[programType][programName]).forEach(programId => {
        let programDetails = allPrograms[programType][programName][programId];
        if (programDetails.garant && programDetails.garant.trim() === guarantorName) {
          if (!filteredPrograms[programType][programName]) {
            filteredPrograms[programType][programName] = {};
          }

          filteredPrograms[programType][programName][programId] = programDetails;
        }
      });
    });
  });
  return filteredPrograms;
}

// Filtruje programy podle zvolených preferencí pro nepřihlášené uživatele
function filterProgramsForPublic(allPrograms) {
  let publicPrograms = {};

  Object.keys(allPrograms).forEach(programType => {
    publicPrograms[programType] = {};

    Object.keys(allPrograms[programType]).forEach(programName => {
      Object.keys(allPrograms[programType][programName]).forEach(programId => {
        let programDetails = allPrograms[programType][programName][programId];

        // Kontrola, jestli je program povolen v preferences, nebo jestli preference pro program nejsou definovány
        if (programPreferences[programId] || programPreferences[programId] === undefined) {
          // Pokud program nemá uvedenu preferenci, inicializujeme ji na true
          if (!publicPrograms[programType][programName]) {
            publicPrograms[programType][programName] = {};
          }

          publicPrograms[programType][programName][programId] = programDetails;
        }
      });
    });
  });

  return publicPrograms;
}

// Vyfiltruje a zobrazí programy podle zadaných filtrů a zavolá funkci pro vytvoření karet s programy
function displayProgramData(data, faculty) {
  const userData = JSON.parse(sessionStorage.getItem('userData'));
  let filteredData;

  const programsContainer = document.getElementById('study-programs');
  programsContainer.innerHTML = '';

  if (userData && userData.role === 'garant') {
    filteredData = filterProgramsByGuarantor(data, userData.jmeno);
  } else if (userData && userData.role === 'admin') {
    filteredData = data;
  } else {
    filteredData = filterProgramsForPublic(data);
  }

  const atLeastOneFilterSelected = selectedTypeFilters.length > 0;

  ['Bakalářský', 'Navazující', 'Doktorský'].forEach(programType => {
    if (selectedTypeFilters.includes(programType)) {
      let programData = filteredData[programType] || {}; 
      let filteredByForm = filterProgramsByCriteria(programData, selectedFormFilters, 'forma');
      let filteredByLanguage = filterProgramsByCriteria(filteredByForm, selectedLangFilters, 'jazyk');

      if (Object.keys(filteredByLanguage).length > 0) {
        createCardForProgramType(programsContainer, filteredByLanguage, programType, faculty);
      } else {
        createCardForProgramType(programsContainer, {}, programType, faculty);
      }
    }
    // Pokud nebyl zvolen žádný typ programu, zobrazíme prázdnou kartu
    else if (!atLeastOneFilterSelected) {
      createCardForProgramType(programsContainer, {}, programType, faculty);
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
    noProgramsMessage.textContent = 'Nebyly nalezeny žádné programy odpovídající zvoleným filtrům.';
    body.appendChild(noProgramsMessage);
  }

  card.appendChild(header);
  card.appendChild(body);
  container.appendChild(card);
}

// Vytvoří tabulku programů pro daný typ programu
function createTableForPrograms(programs, faculty) {
  const userData = JSON.parse(sessionStorage.getItem('userData'));
  let table = document.createElement('table');
  table.classList.add('min-w-full', 'leading-normal');
  table.innerHTML = `
    <thead>
      <tr class="text-left">
        <th class="text-gray-700 text-xs xs:text-base border-b font-bold px-2 py-3 sm:px-3">Název</th>
        <th class="text-gray-700 text-xs xs:text-base border-b font-bold px-2 py-3 sm:px-3">Forma</th>
        <th class="text-gray-700 text-xs xs:text-base border-b font-bold px-2 py-3 sm:px-3 hidden md:table-cell">Garant</th>
        <th class="text-gray-700 text-xs xs:text-base border-b font-bold px-2 py-3 sm:px-3 hidden md:table-cell text-center">Jazyk</th>
        <th class="text-gray-700 text-xs xs:text-base border-b font-bold px-2 py-3 sm:px-3 max-w-20 text-right">Platný od</th>
        ${userData ? '<th class="text-gray-700 text-xs sm:text-base border-b font-bold px-2 py-3 sm:px-3 max-w-20">Zobrazeno</th>' : ''}
      </tr>
    </thead>`;
  const tbody = document.createElement('tbody');
  Object.entries(programs).forEach(([programName, programGroup]) => {
    Object.entries(programGroup).forEach(([id, program]) => {
      const row = tbody.insertRow();
      row.classList.add('text-xs', 'xs:text-base', 'border-b', 'border-gray-200', 'last:border-b-0');
      row.innerHTML = `
        <td class="text-gray-700 px-2 py-3 sm:px-3 max-w-40 font-bold">${program.nazevCz || program.nazev}</td>
        <td class="text-gray-600 px-2 py-3 sm:px-3 max-w-40">${program.forma}</td>
        <td class="text-gray-600 px-2 py-3 sm:px-3 hidden max-w-40 md:table-cell">${program.garant || '-'}</td>
        <td class="text-gray-600 px-2 py-3 sm:px-3 hidden max-w-40 md:table-cell text-center">${program.jazyk}</td>
        <td class="text-gray-600 px-2 py-3 sm:px-3 max-w-40 text-end">${program.platnyOd}</td>

        ${userData ? `
        <td class="text-gray-600 text-xs xs:text-base border-b border-gray-200 last:border-b-0 px-2 py-3 xs:px-3 max-w-20 text-center whitespace-nowrap font-medium">
          <div class="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input type="checkbox" name="toggle" id="toggle-${id}" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" checked />
            <label for="toggle-${id}" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
          </div>
        </td>` : ''}
        `;
      row.classList.add('hover:bg-gray-100', 'cursor-pointer');

      // Přidání události kliknutí pouze na buňky mimo toggle, aby se zabránilo dvojímu přesměrování
      row.querySelectorAll('td:not(:last-child)').forEach(cell => {
        cell.addEventListener('click', () => {
          window.location.href = `/program_detail.html?stprIdno=${id}&faculty=${faculty}`;
        });
      });

      if (userData) {
        const toggle = row.querySelector('.toggle-checkbox');
        if (programPreferences && programPreferences[id] !== undefined) {
          toggle.checked = programPreferences[id]; // Nastavení stavu tlačítka podle uložené preference
        }
        updateToggleStyle(toggle);
        updateRowStyle(toggle);

        toggle.addEventListener('change', () => {
          updateToggleStyle(toggle);            // Aktualizace vizuálního stavu tlačítka
          updateRowStyle(toggle);               // Aktualizace vizuálního stavu řádku tabulky
          savePreference(id, toggle.checked);   // Uložení preference na server
        });
      }
    });
  });
  table.appendChild(tbody);
  return table;
}

// Aktualizuje styl toggle tlačítka
function updateToggleStyle(toggle) {
  if (toggle.checked) {
    // Změna vzhledu toggle tlačítka
    toggle.classList.add('bg-amber-500', 'translate-x-4');
    toggle.classList.remove('translate-x-0', 'bg-white');
  } else {
    toggle.classList.remove('bg-amber-500', 'translate-x-4');
    toggle.classList.add('translate-x-0', 'bg-white');
  }
}

// Funkce pro aktualizaci vizuálního stylu řádku tabulky
function updateRowStyle(toggle) {
  const row = toggle.closest('tr'); // Najde nejbližšího rodiče řádku tabulky

  if (toggle.checked) {
    row.classList.remove('bg-gray-100', 'opacity-50');
  } else {
    row.classList.add('bg-gray-100', 'opacity-50');
  }
}

// Uloží vybrané filtry do session storage
function saveFiltersToSessionStorage() {
  sessionStorage.setItem('selectedTypeFilters', JSON.stringify(selectedTypeFilters));
  sessionStorage.setItem('selectedFormFilters', JSON.stringify(selectedFormFilters));
  sessionStorage.setItem('selectedLangFilters', JSON.stringify(selectedLangFilters));
  sessionStorage.setItem('searchQuery', document.querySelector('#search-input').value);
}

// Funkce pro odeslání preference na server
function savePreference(programId, preference) {
  const data = {
    stprIdno: programId,
    preference: preference
  };

  fetch('/save_program_preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(data => {
      console.log('Preference byla úspěšně uložena:', data);
    })
    .catch((error) => {
      console.error('Došlo k chybě při ukládání preference:', error);
    });
}

// Funkce pro načtení preferencí
function loadPreferences() {
  fetch('/get_program_preferences')
    .then(response => response.json())
    .then(data => {
      programPreferences = data;

      // Načtení dat programů po načtení preferencí
      const savedSearchQuery = sessionStorage.getItem('searchQuery') || '';
      fetchProgramData('PRF', savedSearchQuery);
    })
    .catch((error) => {
      console.error('Nepodařilo se načíst preference:', error);
    });
}

function logout() {
  sessionStorage.removeItem('userData'); // Smazání dat uživatele
  window.location.href = 'index.html'; // Přesměrování na domovskou stránku
}