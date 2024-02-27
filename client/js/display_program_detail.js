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
    // Vytvoření elementu li pro obor
    const oborItem = document.createElement('li');
    oborItem.classList.add('mb-2');

    // Vložení názvu oboru, anotace a odkazu na studijní plán do elementu li
    oborItem.innerHTML = `
        <p class="font-semibold">${obor.nazevCz}</p>
        <p>${obor.anotaceCz}</p>
        <p class="text-sm text-gray-600 my-2">Typ - ${obor.typ}</p>
        <a href="study_plan.html?stprIdno=${stprIdno}&oborIdno=${obor.oborIdno}&faculty=${faculty}">Studijní plán</a>
    `;

    // Přidání elementu li do ul
    oborListUl.appendChild(oborItem);
  });
}


