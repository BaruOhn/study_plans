document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        if (response.ok) {
            return response.json(); 
        } else {
            return response.json().then(data => { throw new Error(data.message || "Neznámá chyba")});
        }
    })
    .then(data => {
        console.log('Přijatá data od serveru:', data);  // Kontrolní výpis přijatých dat
        if (data.user) {
            sessionStorage.setItem('userData', JSON.stringify(data.user));
            window.location.href = 'index.html';
        }
    })
    .catch(error => {
        alert('Chyba: ' + error.message);
    });
});



