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

## 4. Déploiement sur Azure App Service for Containers

### Objectif

Déployer l’image Docker stockée dans Azure Container Registry (ACR) sur un service web accessible publiquement via Azure App Service.

---

### Problème rencontré

Lors de la création du **App Service Plan**, une erreur de type *throttling* a été rencontrée :

```bash
App Service Plan Create operation is throttled for subscription...
```

Ce problème est lié à une limitation de la souscription Azure (souvent sur les comptes étudiants ou les environnements de test), empêchant temporairement la création de nouvelles ressources.

Le App Service Plan étant obligatoire (il représente les ressources de calcul : CPU/RAM), il n’est pas possible de finaliser le déploiement sans celui-ci.

---

### Commandes utilisées

#### Création du App Service Plan

```bash
az appservice plan create \
  --name todoappizserv \
  --resource-group todo-test-iz \
  --location francecentral \
  --sku B1 \
  --is-linux
```

Résultat : échec dû à une limitation Azure (*throttling*).

---

#### Commande prévue pour créer l’App Service

```bash
az webapp create \
  --resource-group todo-test-iz \
  --plan todoappizserv \
  --name todo-app-iz \
  --deployment-container-image-name todoappiz.azurecr.io/todo-app
```

---

### Analyse

* Le déploiement sur Azure App Service a besoins obligatoirement :

  * un **App Service Plan**

* L’erreur rencontrée est externe au projet (limitation Azure) et non liée à une erreur de configuration.

---

### Solutions envisagées

les solutions trouvées :

* Attendre la levée du throttling Azure : en cours
* Changer de région (ex : `westeurope`) : beaucoup de régions inaccessibles pour cause de réstrictions par azure
* Utiliser un SKU gratuit (`F1`) : même problème
* Créer les ressources via le portail Azure : même problème

---

### État actuel

* Image Docker disponible dans ACR
* Déploiement App Service non finalisé (blocage App Service Plan)

---

### Conclusion

Le déploiement est prêt d’un point de vue technique, mais bloqué par une contrainte de la plateforme Azure.

Dès que la ressource App Service Plan pourra être créée, l’application pourra être déployée et rendue accessible publiquement.

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
