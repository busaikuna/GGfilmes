const tabs = document.querySelectorAll('.tab-btn');
const forms = document.querySelectorAll('form');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.target;
        forms.forEach(f => f.id === target ? f.classList.add('active') : f.classList.remove('active'));
    });
});

function switchTab(tabId) {
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    document.querySelector(`.tab-btn[data-target="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}