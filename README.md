# Bibliothèque en ligne - Projet VTI 2025

Bienvenue dans le projet **Bibliothèque en ligne** !
Ce projet permet de gérer une bibliothèque avec des livres et des membres.
Il offre des fonctionnalités pour la gestion des livres (ajout, modification, suppression, emprunt) ainsi que la gestion des membres (ajout, modification, suppression).

Les visiteurs non connectés peuvent consulter la liste complète des livres
Les visiteurs non connectés peuvent connaître le statut des livres (disponible ou emprunté).

Les membres et les administrateurs ont accès aux mêmes fonctionnalités que les visiteurs non connectés.
Les membres et les administrateurs ont accès à des fonctionnalités supplémentaires :
Seuls les membres et les administrateurs peuvent voir le nom de l'emprunteur d'un livre.
Seuls les membres et les administrateurs peuvent emprunter et rendre un livre.
Seuls les membres et les administrateurs peuvent ajouter, modifier ou supprimer un livre.
Seuls les administrateurs peuvent accéder à la gestion des membres.

## URL du site déployé

Accédez au site en ligne à l'adresse suivante :  
[https://biblio-vti-2025.netlify.app/](https://biblio-vti-2025.netlify.app/)

## Pour tester rapidement

Si vous avez téléchargé le repo github,
ouvrir le fichier `index.html` dans le navigateur pour commencer à tester l'application localement.

Tester en tant qu'administrateur, se connecter avec :
-Nom: Brouille
-Prénom : Jean
-Login : test

Tester en tant que membre, se connecter avec :
-Nom: Curieu
-Prénom : Marie
-Login : test

Il y a quatre personnes pré-enregistrées dans le fichier membres.json

## Fonctionnalités principales

Le site propose les fonctionnalités de base suivantes (statut non connecté) :

- **Afficher la liste des livres** : Permet de voir tous les livres enregistrés dans la base de données.
- **Chercher un libre par auteur** : Permet de voir tous les livres enregistrés dans la base de données.
- **Chercher un libre par titre** : Permet de voir tous les livres enregistrés dans la base de données.

### 1. Gestion des livres : (Seul un administrateur ou un membre peuvent effectuer ces actions).

- **Afficher la liste des livres** : Permet de voir tous les livres enregistrés dans la base de données.
- **Ajouter un livre** : Ajouter un nouveau livre à la bibliothèque.
- **Modifier un livre** : Modifier les informations d'un livre existant.
- **Supprimer un livre** : Supprimer un livre de la bibliothèque.
- **Emprunter un livre** : Marquer un livre comme emprunté et l'associer à un emprunteur.
- **Retourner un livre** : Marquer un livre comme disponible après qu'il ait été retourné.

### 2. Gestion des membres : (Seul un administrateur peut effectuer ces actions).

- **Ajouter un membre** : Ajouter un nouveau membre à la bibliothèque
- **Modifier un membre** : Modifier les informations d'un membre existant.
- **Supprimer un membre** : Supprimer un membre de la base de données.

### 3. Connexion et déconnexion :

- **Connexion** : Permet à un utilisateur de se connecter avec un nom, prénom et mot de passe.
- **Déconnexion** : Permet à un utilisateur de se déconnecter et de revenir à l'état de non-connecté.

### 4. Accessibilité :

- **Page des membres** : Accessible uniquement aux administrateurs. Les membres classiques ne peuvent pas y accéder.
- **Interface utilisateur** : Adaptée pour une utilisation facile sur tous les appareils grâce à **Bootstrap 5**.

## Prérequis

Pour tester ou déployer ce projet localement, vous aurez besoin des éléments suivants :

- Un **navigateur web** moderne (Chrome, Firefox, Edge, Safari, etc.)
- **IndexedDB** : Le projet utilise **IndexedDB** pour stocker les livres et membres, ce qui garantit que les données persistent entre les sessions.

## Fonctionnement du projet

1. **Page d'accueil** : La page principale affiche la liste des livres disponibles et les fonctionnalités d'ajout/modification/émprunt/retour de livres.
2. **Page de connexion** : Les utilisateurs doivent se connecter avec un nom, un prénom et un mot de passe. Seuls les administrateurs peuvent accéder à la gestion des membres.
3. **Gestion des membres** : Après la connexion, un administrateur peut accéder à la page de gestion des membres. Cette page permet d'ajouter, modifier et supprimer des membres.

## Tests et interactions

### Connexion / Déconnexion

- Cliquez sur le bouton **Connexion** en haut à droite pour ouvrir le formulaire de connexion.
- Entrez vos identifiants (nom, prénom, mot de passe) et cliquez sur **Se connecter**.
- Après connexion, l'interface de gestion des livres sera accessible et le statut de l'utilisateur sera affiché en haut.
- Un administrateur peut accéder à la gestion des membres via le bouton **Gestion des Membres**.
- Pour se déconnecter, cliquez sur **Déconnexion** en haut à droite.

### Gestion des livres

- Les livres sont affichés sous forme de tableau. Pour chaque livre, vous pouvez :
  - **Emprunter** : Un livre devient **Emprunté** et est marqué avec le nom de l'emprunteur.
  - **Retourner** : Un livre devient **Disponible**.
  - **Modifier** : Modifiez les informations d'un livre (titre et auteur).
  - **Supprimer** : Retirez un livre de la bibliothèque.

### Gestion des membres (Administrateurs uniquement)

- Seuls les administrateurs peuvent ajouter, modifier ou supprimer des membres.
- Un administrateur peut ajouter un membre en cliquant sur **Ajouter un Membre**, remplir les informations nécessaires et valider.

## Structure du projet

### Fichiers principaux :

- **`index.html`** : Page d'accueil avec la gestion des livres.
- **`membres.html`** : Page de gestion des membres (accessible uniquement aux administrateurs).
- **`membres.js`** : JavaScript pour la gestion des membres (ajout, modification, suppression).
- **`script.js`** : JavaScript pour la gestion des livres, la connexion/déconnexion, et l'interaction avec IndexedDB.
- **`books.json`** : Contient les données des livres utilisés dans l'application.
- **`membres.json`** : Contient les données des membres utilisés dans l'application.
- **`README.md`** : Ce fichier d'explication.

Ouvrez le fichier `index.html` dans votre navigateur pour commencer à tester l'application localement.

## Problèmes connus

- **IndexedDB** est utilisé pour stocker les données localement, donc les informations sont conservées même après la fermeture du navigateur, à condition de ne pas vider les données manuellement.
