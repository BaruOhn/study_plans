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
        displayData(data);
      })
      .catch(error => {
        console.error('Chyba při načítání detailů programu:', error);
      });
  }
  
  function displayData(data) {
    const programDetailDiv = document.getElementById('program-detail');
    // Zde doplňte kód pro zobrazení informací o programu a seznamu oborů
    // Například můžete vytvořit HTML elementy a přidat je do programDetailDiv
  }
  
  