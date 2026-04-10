FROM node:22-alpine

# Dossier de travail dans le conteneur
WORKDIR /app

# Copier package.json + package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le reste du code
COPY . .

# Port utilisé par Azure App Service
ENV PORT=3000

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "app.js"]