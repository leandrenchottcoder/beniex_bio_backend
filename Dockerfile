FROM node:22

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer toutes les dépendances (y compris dev)
RUN npm install

# Copier le reste du code
COPY . .

# Installer nodemon globalement si besoin
RUN npm install -g nodemon

# Exposer le port
EXPOSE 3000

# Lancer l’application
CMD ["npm", "start"]
