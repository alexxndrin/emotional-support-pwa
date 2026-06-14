const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
    res.status(404).send('<h1>Ошибка 404: Страница не найдена</h1>');
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
