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
