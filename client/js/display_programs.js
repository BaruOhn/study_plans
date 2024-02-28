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
  const fileName = `${faculty}_studijni_programy.json`;
  const filePath = `/data/${faculty}/${fileName}`;

  fetch(filePath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      displayProgramData(data, faculty); // Zobrazí data
    })
    .catch(error => {
      console.error('Chyba při načítání dat:', error);
    });
}

function displayProgramData(data, faculty) {
  const mainContainer = document.getElementById('study-programs');
  mainContainer.innerHTML = ''; // Vyčistíme stávající obsah

  const createSectionForType = (type, programs) => {
    const section = document.createElement('section');
    const header = document.createElement('h3');
    header.textContent = type + ' programy';
    header.classList.add('text-xl', 'font-semibold', 'text-sky-700', 'mb-4', 'ml-4');
    section.appendChild(header);

    const programList = document.createElement('ul');
    programList.classList.add('list-none', 'list-inside', 'p-2', 'ml-2');

    for (const programName in programs) {
      const programGroup = programs[programName];
      for (const id in programGroup) {
        const program = programGroup[id];
        const listItem = document.createElement('li');
        listItem.textContent = program.nazevCz || program.nazev;
        listItem.setAttribute('data-stprIdno', id); // Přidání ID programu jako data atribut
        listItem.classList.add('p-2', 'hover:bg-blue-200', 'cursor-pointer');
        programList.appendChild(listItem);

        // Přidání event listeneru pro kliknutí na program
        listItem.addEventListener('click', () => {
          window.location.href = `/program_detail.html?stprIdno=${id}&faculty=${faculty}`;
        });
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
