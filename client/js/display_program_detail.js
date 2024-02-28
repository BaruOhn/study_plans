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
    // Create the card container for the study field
    const card = document.createElement('div');
    card.className = 'bg-white border border-solid border-gray-300 shadow-md mb-4 p-4 transition-shadow hover:shadow-lg';

    // Create the card header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'text-gray-700 text-lg p-2 font-bold';
    cardHeader.textContent = obor.nazevCz;

    // Create the card body
    const cardBody = document.createElement('div');
    cardBody.className = 'p-2';
    cardBody.innerHTML = `
        <p class="text-sm text-gray-600">${obor.forma} forma</p>
        <p class="mb-2">${obor.anotaceCz}</p>
    `;

    // Create the link
    const cardLink = document.createElement('a');
    cardLink.className = 'text-blue-700 hover:text-blue-800 no-underline';
    cardLink.setAttribute('href', `study_plan.html?stprIdno=${stprIdno}&oborIdno=${obor.oborIdno}&faculty=${faculty}`);
    cardLink.textContent = 'Studijní plán';

    // Append the header and body to the card
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    card.appendChild(cardLink);

    // Append the card to the list
    oborListUl.appendChild(card);
  });
}


