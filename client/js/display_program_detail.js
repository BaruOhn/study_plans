document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const stprIdno = urlParams.get('stprIdno');
  const faculty = urlParams.get('faculty');

  if (stprIdno && faculty) {
    fetchProgramDetail(faculty, stprIdno);
  } else {
    console.error('Chyba: Chybějící parametry v URL.');
  }

  // Zde přidáme kód pro zpětné tlačítko
    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', () => {
        window.history.back();
    });
});

function fetchProgramDetail(faculty, stprIdno) {
  const filePath = `/data/${faculty}/obory/${stprIdno}`;

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
    const card = document.createElement('a'); // Změna na <a> element
    card.href = `study_plan.html?stprIdno=${stprIdno}&oborIdno=${obor.oborIdno}&faculty=${faculty}`; // Přidání odkazu na celou kartu
    card.className = 'items-center border border-t-0 border-solid border-gray-300 rounded-t-none rounded-b mb-8 p-3 w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl shadow-md hover:shadow-lg transition-shadow';
    card.addEventListener('mouseenter', () => { card.classList.add('shadow-lg') });
    card.addEventListener('mouseleave', () => { card.classList.remove('shadow-lg') });

    const cardDiv = document.createElement('div');
    cardDiv.className = 'flex flex-wrap justify-between items-center';

    // Create the card header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'text-gray-700 text-lg m-2 font-bold';
    cardHeader.innerHTML = `
        <h4 class="text-lg font-bold">${obor.nazevCz}</h4>
        <span class="text-sm text-gray-600">${obor.forma} forma</span>
    `;

    // Create the card body
    const cardBody = document.createElement('p');
    cardBody.className = 'p-2 hidden sm:block';
    cardBody.textContent = `${obor.anotaceCz}`;

    // Create the link
    const cardLink = document.createElement('a');
    cardLink.className = 'bg-amber-500/90 text-white no-underline rounded-full p-3 m-2 transition-shadow hover:shadow-md hover:bg-amber-500';
    cardLink.setAttribute('href', `study_plan.html?stprIdno=${stprIdno}&oborIdno=${obor.oborIdno}&faculty=${faculty}`);
    cardLink.textContent = 'Studijní plán';

    const border = document.createElement('div');
    border.className = 'bg-sky-700/90 h-2 w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl rounded-t rounded-b-none mx-auto';

    // Append the header, link and body to the card
    cardDiv.appendChild(cardHeader);
    cardDiv.appendChild(cardLink);
    card.appendChild(cardDiv);
    card.appendChild(cardBody);

    // Append the card to the list
    oborListUl.appendChild(border);
    oborListUl.appendChild(card);
  });
}

