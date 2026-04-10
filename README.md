# Todo App - Projet Cloud Azure

## Description

Ce projet consiste en la création d’une application web simple de gestion de tâches (TODO), conteneurisée avec Docker et prête à être déployée sur Microsoft Azure.

L’objectif est de mettre en pratique les bases du cloud :

* développement d’une application web
* conteneurisation
* utilisation d’un registre d’images (Azure Container Registry)

---

## Choix technologiques

* **Backend** : Node.js (Express)
* **Frontend** : HTML / JavaScript simple
* **Conteneurisation** : Docker
* **Registry** : Azure Container Registry (ACR)

---

## 1. Création de l’application

L’application permet les fonctionnalités suivantes :

* Ajouter une tâche
* Afficher les tâches
* Supprimer une tâche

Les données sont stockées localement dans un fichier JSON.

### ▶Lancer l’application en local

```bash
npm init -y
npm install express
node app.js
```

Accès : http://localhost:3000

---

## 2. Conteneurisation avec Docker

### Dockerfile

Création d’un fichier `Dockerfile` pour empaqueter l’application :

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "app.js"]
```

---

### Build de l’image

```bash
docker build -t todo-app .
```

---

### Exécution du conteneur

```bash
docker run -p 3000:3000 todo-app
```

Accès : http://localhost:3000

---

## 3. Création d’Azure Container Registry (ACR)

### Connexion à Azure

```bash
az login
```

---

### Création du Resource Group

```bash
az group create --name todo-test-iz --location FranceCentral
```

---

### Création du registre ACR

```bash
az acr create --resource-group todo-test-iz --name todoappiz --sku Basic
```

---

### Connexion à ACR

```bash
az acr login --name todoappiz
```

---

### Tag de l’image

```bash
docker tag todo-app todoappiz.azurecr.io/todo-app
```

---

### Push de l’image

```bash
docker push todoappiz.azurecr.io/todo-app
```

---

## Résultat

À ce stade :

* Application fonctionnelle en local
* Image Docker créée
* Image stockée dans Azure Container Registry

---

## Prochaines étapes

* Déploiement sur Azure App Service
* Connexion à une base de données (Cosmos DB)
* Sécurisation avec Azure Key Vault
* Ajout de stockage Blob

---

## Remarques

* L’application utilise un stockage local (non persistant en cloud)

---
