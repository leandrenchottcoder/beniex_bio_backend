# Étape 1 : image Node officielle
FROM node:22

# Étape 2 : définir le répertoire de travail
WORKDIR /app

# Etape 3 : Copier package.json et installer dépendances
COPY package*.json ./
RUN npm install -g nodemon && npm install

# Étape 4 : copier le reste du code
COPY . .

# Étape 5 : exposer le port utilisé par Express
EXPOSE 3000

# Étape 6 : lancer l’application
CMD ["npm", "run", "start"]
