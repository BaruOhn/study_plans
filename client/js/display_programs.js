let currentFilter = 'all'; // Proměnná pro filtr programů podle typu programu

document.addEventListener('DOMContentLoaded', () => {
  setupFacultyButtons();
  setupSearchForm();
  setupFilterButtons();
  setupMobileMenu();
  setupMobileMenuItems();
  fetchProgramData('PRF'); // Počáteční načtení dat
});

function setupFacultyButtons() {
  document.querySelectorAll('[data-faculty]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      fetchProgramData(item.getAttribute('data-faculty'));
    });
  });
}

function setupSearchForm() {
  document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const searchQuery = document.querySelector('input[type="search"]').value;
    fetchProgramData('PRF', searchQuery); // Předpokládáme, že vyhledáváme pro PRF
  });
}

function setupFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(innerBtn => {
        innerBtn.classList.remove('font-bold');
      });
      this.classList.add('font-bold');
      currentFilter = this.getAttribute('data-filter');
      fetchProgramData('PRF'); // Znovu načteme data a aplikujeme filtr
    });
  });
}

function setupMobileMenu() {
  // JavaScript pro ovládání mobilního menu
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
    Object.fromEntries(Object.entries(programs).filter(([programName, programGroup]) =>
      programName.toLowerCase().includes(query.toLowerCase()) ||
      Object.values(programGroup).some(program =>
        program.nazevCz.toLowerCase().includes(query.toLowerCase()) ||
        program.nazev.toLowerCase().includes(query.toLowerCase())
      )
    ))
  ]));
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

  if (!hasPrograms) {
    const errorMessage = document.createElement('p');
    errorMessage.textContent = 'Nebyly nalezeny žádné programy odpovídající zadanému výrazu.';
    errorMessage.classList.add('text-gray-700', 'text-lg', 'font-normal', 'text-center', 'mt-4');
    programsContainer.appendChild(errorMessage);
  }
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
  const typeName = typeMapping[type] || type; // Bezpečnostní kontrola, pokud typ není v mapování
  card.innerHTML = `<h3 class="text-xl font-semibold text-gray-800 mb-4">${typeName} programy</h3>`;

  const table = createTableForPrograms(programs, faculty);
  card.appendChild(table);
  container.appendChild(card);
}

function createTableForPrograms(programs, faculty) {
  let table = document.createElement('table');
  table.classList.add('min-w-full', 'leading-normal');
  table.innerHTML = `
    <thead>
      <tr class="text-left">
        <th class="p-2 border-b border-gray-200 text-gray-600 font-bold">Název</th>
        <th class="p-2 border-b border-gray-200 text-gray-600 font-bold">Forma</th>
        <th class="p-2 border-b border-gray-200 text-gray-600 font-bold hidden md:table-cell">Garant</th>
        <th class="p-2 border-b border-gray-200 text-gray-600 font-bold hidden md:table-cell">Jazyk</th>
        <th class="p-2 border-b border-gray-200 text-gray-600 font-bold hidden md:table-cell">Platný od</th>
      </tr>
    </thead>`;
  const tbody = document.createElement('tbody');
  Object.entries(programs).forEach(([programName, programGroup]) => {
    Object.entries(programGroup).forEach(([id, program]) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td class="p-2 border-b border-gray-200 text-gray-700 max-w-xs">${program.nazevCz || program.nazev}</td>
        <td class="p-2 border-b border-gray-200 text-gray-700">${program.forma}</td>
        <td class="p-2 border-b border-gray-200 text-gray-700 hidden md:table-cell">${program.garant || '-'}</td>
        <td class="p-2 border-b border-gray-200 text-gray-700 hidden md:table-cell">${program.jazyk}</td>
        <td class="p-2 border-b border-gray-200 text-gray-700 hidden md:table-cell">${program.platnyOd}</td>`;
      row.classList.add('cursor-pointer', 'hover:bg-gray-100');
      row.addEventListener('click', () => {
        window.location.href = `/program_detail.html?stprIdno=${id}&faculty=${faculty}`;
      });
    });
  });
  table.appendChild(tbody);
  return table;
}
