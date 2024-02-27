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
  const programDetailDiv = document.getElementById('program-detail');
  const oborListUl = document.getElementById('obor-list-ul');

  data.oborInfo.forEach(obor => {
    const oborDetail = document.createElement('p');
    oborDetail.classList.add('mt-5');
    oborDetail.innerHTML = `
          <p>${obor.anotaceCz}</p>
    `;

    programDetailDiv.appendChild(oborDetail);
    const oborItem = document.createElement('li');
    oborItem.classList.add('mb-2');
    oborItem.innerHTML = `
          <p class="font-semibold">${obor.nazevCz}</p>
          <p class="text-sm text-gray-600 my-2">Typ - ${obor.typ}</p>
          <a href="study_plan.html?stprIdno=${stprIdno}&oborIdno=${obor.oborIdno}&faculty=${faculty}">Studijní plán</a>
      `;
    oborListUl.appendChild(oborItem);
  });
}

