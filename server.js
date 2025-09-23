const WebSocket = require('ws');
const express = require('express');
const app = express();
const PORT = 3000;

const AISSTREAM_URL = 'wss://stream.aisstream.io/v0/stream';
const API_KEY = process.env.API_KEY;

let latestData = {}; // Armazena dados por MMSI
let latestETAData = {}; // Armazena dados por MMSI
// Iniciar WebSocket e subscrever todos os navios
const ws = new WebSocket(AISSTREAM_URL);
const wsEta = new WebSocket(AISSTREAM_URL);

ws.on('open', () => {
  console.log('✅ Conectado ao AISStream.io');

  const subscription = {
    Apikey: API_KEY,
	BoundingBoxes: [[[-180, -90], [180, 90]]],
    FilterMessageTypes: ['PositionReport']
  };

  ws.send(JSON.stringify(subscription));
  console.log('📡 Subscrito a todos os navios.');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    const mmsi = message?.Message?.PositionReport?.UserID;

    if (mmsi) {
      latestData[mmsi] = message;
      console.log(`📥 Recebido MMSI ${mmsi}`);
    }
  } catch (err) {
    console.error('❌ Erro ao processar mensagem:', err);
  }
});

ws.on('error', (err) => {
  console.error('❌ Erro no WebSocket:', err);
});

ws.on('close', () => {
  console.log('🔌 WebSocket fechado.');
});


wsEta.on('open', () => {
  console.log('✅ Conectado ao AISStream.io');

  const subscription = {
    Apikey: API_KEY,
	BoundingBoxes: [[[-180, -90], [180, 90]]],
    FilterMessageTypes: ['ShipStaticData']
  };

  wsEta.send(JSON.stringify(subscription));
  console.log('📡 Subscrito a todos os navios.');
});

wsEta.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    const mmsi = message?.Message?.ShipStaticData?.UserID;

    if (mmsi) {
      latestETAData[mmsi] = message;
      console.log(`📥 Recebido MMSI ${mmsi}`);
    }
  } catch (err) {
    console.error('❌ Erro ao processar mensagem:', err);
  }
});

wsEta.on('error', (err) => {
  console.error('❌ Erro no WebSocket:', err);
});

wsEta.on('close', () => {
  console.log('🔌 WebSocket fechado.');
});



// 🔍 Rota para consultar todos os navios
app.get('/ship', (req, res) => {
  res.json(Object.values(latestData));
});

// 🔍 Rota para consultar navio específico por MMSI
app.get('/ship/:mmsi', (req, res) => {
  const mmsi = req.params.mmsi;
  const shipData = latestETAData[mmsi];

  if (shipData) {
    res.json(shipData);
  } else {
    res.status(404).json({ error: 'Navio não encontrado ou sem dados recentes.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr em http://localhost:${PORT}`);
});
