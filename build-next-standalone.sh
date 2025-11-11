#!/bin/bash

# Uscita immediata in caso di errore
set -e

echo "🔧 Pulizia vecchi file..."
rm -rf .next

#rm -rf node_modules package-lock.json
#echo "📦 Installazione dipendenze..."
#npm install

echo "🛠️ Creazione build standalone..."
npm run build

echo "📁 Copia degli asset statici e public nella cartella standalone..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "✅ Build completata. Pronto per Docker!"

docker build --no-cache -t bassista/nutritionwise:latest .

docker push bassista/nutritionwise:latest
