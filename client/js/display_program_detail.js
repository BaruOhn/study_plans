document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const stprIdno = urlParams.get('stprIdno');
  const faculty = urlParams.get('faculty');

  if (stprIdno && faculty) {
    fetchProgramDetail(faculty, stprIdno);
  } else {
    console.error('Chyba: Chybějící parametry v URL.');
  }
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
  const oborListUl = document.getElementById('obor-list-ul');

  data.oborInfo.forEach(obor => {
    // Create the card box
    const card = document.createElement('article');
    card.className = 'items-center border border-t-0 border-solid border-gray-300 rounded-t-none rounded-b mx-4 mb-8 p-3 shadow-md hover:shadow-lg transition-shadow';

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
    cardLink.className = 'bg-amber-500/90 text-white no-underline rounded p-3 m-2 transition-shadow hover:shadow-md hover:bg-amber-500';
    cardLink.setAttribute('href', `study_plan.html?stprIdno=${stprIdno}&oborIdno=${obor.oborIdno}&faculty=${faculty}`);
    cardLink.textContent = 'Studijní plán';

    // Create the border
    const border = document.createElement('div');
    border.className = 'bg-sky-700/90 h-2 mx-4 rounded-t rounded-b-none';

    // Append the header and body to the card
    cardDiv.appendChild(cardHeader);
    cardDiv.appendChild(cardLink); 
    card.appendChild(cardDiv);
    card.appendChild(cardBody);

    // Append the card to the list
    oborListUl.appendChild(border);
    oborListUl.appendChild(card);
  });
}


