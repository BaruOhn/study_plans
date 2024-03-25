document.addEventListener('DOMContentLoaded', async () => {
    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', () => {
        window.history.back();
    });
});