const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Разрешаем вашему Google Сайту делать запросы без блокировок
app.use(cors({ origin: '*' }));
app.use(express.json());

async function getUserId(username) {
    try {
        const response = await axios.post('https://roblox.com', {
    usernames: [username],
    excludeBannedUsers: false
});
        if (response.data && response.data.data && response.data.data.length > 0) {
            return response.data.data[0].id; // Берем ID самого первого найденного игрока
        }
        return null;
    } catch (e) { 
        return null; 
    }
}

// Главный роут для проверки статуса присутствия в Roblox
app.get('/status/:username', async (req, res) => {
    const username = req.params.username;
    const userId = await getUserId(username);
    
    if (!userId) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    try {
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

// Экспортируем сервер для корректной работы Vercel
module.exports = app;
