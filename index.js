const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Прямой маршрут без лишних префиксов
app.get('/:username', async (req, res) => {
    const username = req.params.username;
    
    try {
        // Тщательный запрос к официальному API Roblox по поиску точного имени
        const response = await axios.post('https://roblox.com', {
            usernames: [username],
            excludeBannedUsers: false
        });
        
        // Проверяем, вернул ли Roblox хоть одного пользователя
        if (!response.data || !response.data.data || response.data.data.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const userId = response.data.data[0].id;

        // Второй запрос для получения статуса (В сети / В игре)
        const presenceResponse = await axios.post('https://roblox.com', {
            userIds: [userId]
        });

        const data = presenceResponse.data.userPresences[0];
        
        let statusText = 'Не в сети';
        if (data.userPresenceType === 1) statusText = 'В сети';
        if (data.userPresenceType === 2) statusText = 'В игре';
        if (data.userPresenceType === 3) statusText = 'В Roblox Studio';

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
