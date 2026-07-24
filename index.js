const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Главный роут для поиска игрока прямо через косую черту
app.get('/:username', async (req, res) => {
    const username = req.query.username || req.params.username;
    try {
        // 1. Находим ID игрока по его имени
        const response = await axios.post('https://roblox.com', {
            usernames: [username],
            excludeBannedUsers: false
        });
        
        if (!response.data || !response.data.data || response.data.data.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        // Достаем ID первого игрока из списка
        const userId = response.data.data[0].id;

        // 2. Делаем запрос к API присутствия в Roblox
        const presenceResponse = await axios.post('https://roblox.com', {
            userIds: [userId]
        });

        if (!presenceResponse.data || !presenceResponse.data.userPresences || presenceResponse.data.userPresences.length === 0) {
            return res.status(404).json({ error: 'Статус не найден' });
        }

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

// Запуск прослушивания порта (Без этого Render выдает ошибку Failed!)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер работает на порту ${PORT}`));
