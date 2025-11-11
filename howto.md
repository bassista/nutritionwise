modificato package.json:
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",

-------------------------------------------------------------------------------------------

modificato next.config.ts:
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {

  experimental: {
    turbo: false
  },

  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },

  devIndicators: false, // disattiva completamente la UI degli indicatori di sviluppo
  output: 'standalone', // riduce il bundle e semplifica il deploy
  swcMinify: true, // assicura che la minificazione sia attiva

};

export default nextConfig;


-------------------------------------------------------------------------------------------------

npm install


npm run build

cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

cd .next/standalone

node server.js

------------------------------------------------------------------------------------------------

# Usa un'immagine base compatibile con ARM64
FROM node:18-bullseye-slim

# Imposta la directory di lavoro
WORKDIR /app

# Copia la build standalone
COPY .next/standalone/ ./

# Copia gli asset statici e la cartella public
COPY .next/static ./.next/static
COPY public ./public

# Espone la porta (modifica se necessario)
EXPOSE 3000

# Avvia il server Next.js
CMD ["node", "server.js"]


-------------------------------------------------------------------------------------------------

docker build -t bassista/nutritionwise:latest .
docker run -p 3000:3000 bassista/nutritionwise:latest


#3000
services:
  nutritionwise:
    image: bassista/nutritionwise:latest
    restart: unless-stopped
    container_name: nutritionwise

-------------------------------------------------------------------------------------------------
