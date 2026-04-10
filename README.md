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

### Lancer l’application en local

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

commande non fonctionnelle :

```bash
az appservice plan create \
  --name todoappizserv \
  --resource-group todo-test-iz \
  --location francecentral \
  --sku B1 \
  --is-linux
```

commande fonctionnelle :

```bash
az appservice plan create \
  --name todoappizserv \
  --resource-group todo-test-iz \
  --location polandcentral \
  --sku B1 \
  --is-linux
```

Résultat : échec dû à une limitation Azure (*throttling*) avant de fonctionner maintenant avec les serveurs pologne.

---

#### Commande prévue pour créer l’App Service

```bash
az webapp create \
  --resource-group todo-test-iz \
  --plan todoappizserv \
  --name todo-app-iz \
  --deployment-container-image-name todoappiz.azurecr.io/todo-app:latest
```

---

### Analyse

* Le déploiement sur Azure App Service a besoins obligatoirement :

  * un **App Service Plan**

* L’erreur rencontrée est externe au projet (limitation Azure) et non liée à une erreur de configuration.

---

### Solutions envisagées (fonctionne)

les solutions trouvées :

* Attendre la levée du throttling Azure : n'a pas fonctionné
* Changer de région (ex : `westeurope`) : beaucoup de régions ne fonctionnent pas mais pologne centre a fini par fonctionner
* Utiliser un SKU gratuit (`F1`) : n'a pas fonctionné
* Créer les ressources via le portail Azure : n'a pas fonctionné

---

## 4.5 Persistance avec Azure Cosmos DB

### Objectif

Remplacer le stockage local (fichier JSON) par une base de données cloud NoSQL avec Azure Cosmos DB afin d’assurer la persistance des données.

---

### Création de Cosmos DB

```bash
az cosmosdb create \
  --name todocosmosizdb \
  --resource-group todo-test-iz \
  --kind MongoDB
```

---

### Création de la base et collection

```bash
az cosmosdb mongodb database create \
  --account-name todocosmosizdb \
  --resource-group todo-test-iz \
  --name tododb
```

```bash
az cosmosdb mongodb collection create \
  --account-name todocosmosizdb \
  --resource-group todo-test-iz \
  --database-name tododb \
  --name tasks
```

---

### Connexion à l’application

L’application Node.js est modifiée pour utiliser la chaîne de connexion Cosmos DB via variable d’environnement.

```bash
az cosmosdb keys list \
  --name todocosmosizdb \
  --resource-group todo-test-iz
```

---

### Résultat

* Les tâches sont stockées dans Cosmos DB
* Les données persistent après redémarrage

---

## 4.6 Sécurisation avec Azure Key Vault et Identité Managée

### Objectif

Sécuriser les informations sensibles (ex : chaîne de connexion) avec Azure Key Vault.

---

### Création du Key Vault

```bash
az keyvault create \
  --name todo-keyvault-iz \
  --resource-group todo-test-iz \
  --location PolandCentral
```

---

### Ajout d’un secret

```bash
az keyvault secret set \
  --vault-name todo-keyvault-iz \
  --name CosmosConnectionString \
  --value "connection-string"
```

---

### Activation de l’identité managée

```bash
az webapp identity assign \
  --name todo-app-iz \
  --resource-group todo-test-iz
```

---

### Attribution des droits

```bash
az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee 8ef0261e-c21f-40b4-9096-4e891fc53df3 \
  --scope /subscriptions/64b49246-8ac5-4b69-8842-bd62ea73128d/resourceGroups/todo-test-iz/providers/Microsoft.KeyVault/vaults/todo-keyvault-iz
```

---

### Résultat

* Les secrets ne sont plus stockés en clair
* Accès sécurisé via identité managée
* Bonnes pratiques de sécurité respectées

---

## 4.7 Utilisation d’Azure Blob Storage

### Objectif

Utiliser un stockage objet pour stocker des fichiers liés à l’application.

---

### Création du Storage Account

```bash
az storage account create \
  --name todostorage \
  --resource-group todo-test-iz \
  --location PolandCentral \
  --sku Standard_LRS
```

---

### Création d’un container

```bash
az storage container create \
  --name todo-container \
  --account-name todostorage
```

---

### Upload d’un fichier

```bash
az storage blob upload \
  --account-name todostorageaccount \
  --container-name todo-container \
  --name test.txt \
  --file test.txt
```

---

### Résultat

* Stockage d’objets fonctionnel
* Fichiers accessibles via URL
* Possibilité d’associer fichiers aux tâches

---

## 4.8 Multi-environnement avec Deployment Slot

### Objectif

Mettre en place un environnement de staging pour tester avant mise en production.

---

### Création du slot

```bash
az webapp deployment slot create \
  --name todo-app-iz \
  --resource-group todo-test-iz \
  --slot staging
```

---

### Swap staging vers production

```bash
az webapp deployment slot swap \
  --name todo-app-iz \
  --resource-group todo-test-iz \
  --slot staging
```

---

### Résultat

* Environnement de staging disponible
* Déploiement sans interruption
* Meilleure gestion des mises à jour

---

### Intérêt

Le deployment slot permet de :

* tester une version sans impacter les utilisateurs
* effectuer des déploiements sans downtime
* sécuriser les mises en production

---

## 4.9 Scaling manuel

### Objectif

Adapter les ressources de l’application en fonction de la charge.

---

### Modification du nombre d’instances

```bash
az appservice plan update \
  --name plan-todo-app \
  --resource-group todo-rg \
  --number-of-workers 2
```

---

### Résultat

* Augmentation du nombre d’instances
* Meilleure gestion de la charge
* Haute disponibilité améliorée

---

### Intérêt

Le scaling manuel permet :

* d’absorber une montée en charge
* d’améliorer la disponibilité
* d’adapter les coûts aux besoins

---

### Retour à une configuration normale

```bash
az appservice plan update \
  --name plan-todo-app \
  --resource-group todo-rg \
  --number-of-workers 1
```

---

## Résultat

À ce stade :

* Application fonctionnelle en local
* Image Docker créée
* Image stockée dans Azure Container Registry
* Application web fonctionnelle
* CosmosDB Fonctionnel