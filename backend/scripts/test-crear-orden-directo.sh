#!/bin/bash

echo "🧪 TEST DIRECTO - CREAR ORDEN INTERCAPITAL"
echo ""

curl -X POST https://app1.intercapital.ar/api/chatbot/ordenes \
  -H "Content-Type: application/json" \
  -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a" \
  -d '{
    "comitente": 18728,
    "operacion": "COMPRA",
    "symbol": "GGAL",
    "cantidad": 1,
    "precio": 8370,
    "plazo": "CONTADO",
    "tipo_orden": "MERCADO",
    "notas": "Test desde curl"
  }' \
  -v
