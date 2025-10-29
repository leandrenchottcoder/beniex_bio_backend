# Étape 1 : image Node officielle
FROM node:22

# Étape 2 : définir le répertoire de travail
WORKDIR /app

# Étape 3 : copier les fichiers package*
COPY package*.json ./

# Étape 4 : installer les dépendances
RUN npm install

# Étape 5 : copier le reste du code
COPY . .

# Étape 6 : exposer le port utilisé par Express
EXPOSE 3000

# Étape 7 : lancer l’application
CMD ["npm", "run", "start"]
