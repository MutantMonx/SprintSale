#!/bin/bash
set -e

echo "🔄 SprintSale Auto-Update Script"
echo "================================"

# Kolory
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Sprawdź czy jesteś w katalogu SprintSale
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Błąd: Nie znaleziono docker-compose.yml${NC}"
    echo "Uruchom ten skrypt z katalogu SprintSale"
    exit 1
fi

# Pobierz zmiany z GitHub
echo -e "${BLUE}📥 Pobieranie zmian z GitHub...${NC}"
git fetch origin main

# Sprawdź czy są zmiany
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}✅ Brak zmian - aplikacja jest aktualna${NC}"
    exit 0
fi

echo -e "${BLUE}📝 Znaleziono nowe zmiany:${NC}"
git log --oneline HEAD..origin/main

# Pull changes
echo -e "${BLUE}⬇️  Aktualizacja kodu...${NC}"
git pull origin main

# Rebuild i restart
echo -e "${BLUE}🔨 Przebudowa kontenerów...${NC}"
docker compose up -d --build

# Sprawdź status
echo -e "${BLUE}🔍 Sprawdzanie statusu...${NC}"
sleep 3
docker compose ps

echo ""
echo -e "${GREEN}✅ Aktualizacja zakończona!${NC}"
echo "📊 Logi dostępne: docker compose logs -f"
