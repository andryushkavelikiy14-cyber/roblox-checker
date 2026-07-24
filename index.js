const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

async function getUserId(username) {
    try {
        // Делаем запрос без жесткого фильтра, чтобы Roblox сам нашел правильного игрока
        const response = await axios.post('https://roblox.com', {
            keyword: username,
            limit: 1
        });
        if (response.data && response.data.data && response.data.data.length > 0) {
            return response.data.data[0].id; // Берем ID самого первого найденного игрока
        }
        return null;
    } catch (e) { 
        return null; 
    }
}

app.get('/status/:username', async (req, res) => {
    const username = req.params.username;
    const userId = await getUserId(username);
    if (!userId) return res.status(404).json({ error: 'Не найден' });
    try {
        const presenceResponse = await axios.post('https://roblox.com', {
            userIds: [userId]
        });
        const data = presenceResponse.data.userPresences[0];
        let statusText = 'В сети';
        if (data.userPresenceType === 0) statusText = 'Не в сети';
        if (data.userPresenceType === 2) statusText = 'В игре';
        if (data.userPresenceType === 3) statusText = 'В Roblox Studio';
        res.json({
            userId: userId,
            presenceType: data.userPresenceType,
            status: statusText,
            gameId: data.rootPlaceId || null
        });
    } catch (e) { res.status(500).json({ error: 'Ошибка API' }); }
});

app.listen(process.env.PORT || 3000, () => console.log('Сервер запущен'));
