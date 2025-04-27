document.getElementById('analyze-tab').addEventListener('click', () => {
    document.getElementById('analyze-section').classList.remove('hidden');
    document.getElementById('generate-section').classList.add('hidden');
    document.getElementById('analyze-tab').classList.add('active');
    document.getElementById('generate-tab').classList.remove('active');
});

document.getElementById('generate-tab').addEventListener('click', () => {
    document.getElementById('generate-section').classList.remove('hidden');
    document.getElementById('analyze-section').classList.add('hidden');
    document.getElementById('generate-tab').classList.add('active');
    document.getElementById('analyze-tab').classList.remove('active');
});
