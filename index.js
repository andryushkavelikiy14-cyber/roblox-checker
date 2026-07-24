const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Главный маршрут для проверки статуса игрока
app.get('/:username', async (req, res) => {
    const username = req.params.username;
    
    try {
        // 1. Ищем ID пользователя по его точной строке никнейма
        const response = await axios.post('https://roblox.com', {
            usernames: [username],
            excludeBannedUsers: false
        });
        
        // Проверяем, вернул ли Roblox массив данных и есть ли там хотя бы один игрок
        if (!response.data || !response.data.data || response.data.data.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        // Забираем ID первого найденного игрока из массива
        const userId = response.data.data[0].id;

        // 2. Делаем запрос к API присутствия для получения статуса (В сети / В игре)
        const presenceResponse = await axios.post('https://roblox.com', {
            userIds: [userId]
        });

        // Проверяем, вернулись ли данные о статусе присутствия
        if (!presenceResponse.data || !presenceResponse.data.userPresences || presenceResponse.data.userPresences.length === 0) {
            return res.status(404).json({ error: 'Статус не найден' });
        }

        const data = presenceResponse.data.userPresences[0];
        
        let statusText = 'Не в сети';
        if (data.userPresenceType === 1) statusText = 'В сети';
        if (data.userPresenceType === 2) statusText = 'В игре';
        if (data.userPresenceType === 3) statusText = 'В Roblox Studio';

        // Отправляем красивый готовый ответ обратно на ваш Google Сайт
        res.json({
            userId: userId,
            presenceType: data.userPresenceType,
            status: statusText,
            gameId: data.rootPlaceId || null
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Ошибка API' });
    }
});

module.exports = app;
