document.addEventListener('DOMContentLoaded', () => {
  // Event listener pro všechny odkazy fakult v menu
  document.querySelectorAll('[data-faculty]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();  // Zamezíme defaultní akci odkazu
      const faculty = item.getAttribute('data-faculty');
      fetchProgramData(faculty);
    });
  });

  // Počáteční načtení dat pro Přírodovědeckou fakultu
  fetchProgramData('PRF');
});

function fetchProgramData(faculty) {
  console.log('Načítání programů pro fakultu:', faculty);  // Přidání logování
  const fileName = `${faculty}_studijni_programy.json`;
  const filePath = `/data/${fileName}`;
  console.log('Načítání souboru:', filePath);  // Přidání logování

  fetch(filePath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      displayProgramData(data); // Zobrazí data
    })
    .catch(error => {
      console.error('Chyba při načítání dat:', error);
    });
}


function displayProgramData(data) {
  const mainContainer = document.getElementById('study-programs');
  mainContainer.innerHTML = ''; // Vyčistíme stávající obsah

  // Funkce pro vytvoření a přidání sekce pro každý typ programu
  const createSectionForType = (type, programs) => {
    const section = document.createElement('section');
    const header = document.createElement('h3');
    header.textContent = type + ' programy';
    header.classList.add('text-xl', 'font-semibold', 'text-sky-700', 'mb-4');
    section.appendChild(header);

    const programList = document.createElement('ul');
    programList.classList.add('list-disc', 'list-inside', 'p-2');

    for (const programName in programs) {
      const programGroup = programs[programName];
      for (const id in programGroup) {
        const program = programGroup[id];
        const listItem = document.createElement('li');
        listItem.textContent = program.nazevCz || program.nazev;
        listItem.classList.add('bg-blue-100', 'p-2', 'hover:bg-blue-200', 'cursor-pointer');
        programList.appendChild(listItem);
      }
    }
    section.appendChild(programList);
    mainContainer.appendChild(section);
  };

  if (data['bakalářský']) createSectionForType('Bakalářské', data['bakalářský']);
  if (data['navazující']) createSectionForType('Navazující', data['navazující']);
  if (data['doktorský']) createSectionForType('Doktorské', data['doktorský']);
  if (data['rigorózní']) createSectionForType('Rigorózní', data['rigorózní']);
  if (data['celoživotní']) createSectionForType('Celoživotní', data['celoživotní']);
}