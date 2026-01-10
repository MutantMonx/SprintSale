#!/bin/bash
# Quick local test script

echo "🧪 SprintSale - Quick Test"
echo "=========================="

# Start services
docker compose up -d

# Wait for services to be ready
echo "⏳ Czekam na uruchomienie serwisów..."
sleep 5

# Check health
echo ""
echo "🏥 Health Check:"
curl -s http://localhost:4000/api/health | jq '.' || echo "❌ Backend nie odpowiada"

echo ""
echo "✅ Serwisy uruchomione!"
echo ""
echo "📍 Dostępne endpointy:"
echo "   - Frontend:  http://localhost:3000"
echo "   - API:       http://localhost:4000/api/health"
echo "   - Admin:     admin@sprintsale.local / [check .env]"
echo ""
echo "📊 Sprawdź logi: docker compose logs -f backend"
