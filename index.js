const express = require('express');
const app = express();
app.use(express.json());

// ВАШ КРИПТОКОШЕЛЕК (куда будут приходить платежи)
// Замените на свой адрес в сети Base
const YOUR_WALLET = '0x2585D2B16Bda2dBd183F2C3F0dA9D38917b0A32A';

// Функция, которая проверяет оплату через x402
function checkPayment(req, res, next) {
    // Если платеж уже прошел — пропускаем
    if (req.headers['x-payment']) {
        return next();
    }
    
    // Запрашиваем оплату: $0.01 USDC за один запрос
    res.status(402).json({
        x402Version: 1,
        accepts: [{
            scheme: 'exact',
            network: 'base-mainnet',      // сеть Base
            maxAmountRequired: '10000',    // 0.01 USDC (в минимальных единицах)
            payTo: YOUR_WALLET,
            asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC на Base
            description: 'Currency conversion - one request'
        }]
    });
}

// ГЛАВНЫЙ ЭНДПОИНТ: конвертер валют
app.get('/convert', checkPayment, async (req, res) => {
    const { from, to, amount } = req.query;
    
    if (!from || !to || !amount) {
        return res.status(400).json({ 
            error: 'Missing parameters. Use: /convert?from=USD&to=EUR&amount=100' 
        });
    }
    
    try {
        // Используем бесплатный API Европейского центробанка
        const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
        const data = await response.json();
        
        const rate = data.rates[to];
        const converted = (parseFloat(amount) * rate).toFixed(2);
        
        res.json({
            from: from,
            to: to,
            amount: amount,
            converted: converted,
            rate: rate,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Conversion failed' });
    }
});

// Эндпоинт для проверки работоспособности (бесплатно)
app.get('/health', (req, res) => {
    res.json({ status: 'online', name: 'Currency Converter Agent' });
});

// Запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Agent running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Convert endpoint: http://localhost:${PORT}/convert?from=USD&to=EUR&amount=100`);
});