# Viral Content Manager — Setup Guide

## ÉTAPE 1 : GitHub Pages (5 min)

1. Va sur github.com → "New repository"
2. Nom : `viral-content-app` — Public — Create
3. Clique "Upload files" → upload les 3 fichiers du dossier `github-pages/`
   - index.html
   - terms.html  
   - privacy.html
4. Commit
5. Va dans Settings → Pages → Source: "Deploy from branch" → Branch: main → Save
6. Attends 2 min → ton site est sur : https://TON-USERNAME.github.io/viral-content-app/

## ÉTAPE 2 : Remplir le formulaire TikTok

- App name : Viral Content Manager
- Terms of Service URL : https://TON-USERNAME.github.io/viral-content-app/terms.html
- Privacy Policy URL : https://TON-USERNAME.github.io/viral-content-app/privacy.html
- URL Prefix (vérification) : https://TON-USERNAME.github.io/viral-content-app/
  → Choisis "URL prefix" → TikTok te donne un fichier → upload-le dans le même repo GitHub

## ÉTAPE 3 : Lancer le prototype (sur ton PC Windows)

### Pré-requis
- Node.js installé (https://nodejs.org → version LTS)
- OpenSSL installé (inclus avec Git for Windows)

### Commandes PowerShell :

```powershell
# 1. Copie le dossier tiktok-prototype sur ton PC

# 2. Ouvre PowerShell dans le dossier, puis :
npm install

# 3. Génère les certificats SSL :
mkdir certs
cd certs
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
cd ..

# 4. Édite server.js ligne 9 : mets ton vrai CLIENT_SECRET
#    CLIENT_SECRET: '4GBltlkaM1g2tn7SwJDrO89JzAhr3exW'  (ou ta vraie valeur)

# 5. Lance :
node server.js

# 6. Ouvre Chrome → https://localhost:3000
#    Chrome va dire "Not secure" → clique Advanced → Proceed to localhost
```

## ÉTAPE 4 : Enregistrer la vidéo démo

1. Installe OBS Studio (https://obsproject.com) ou utilise ShareX
2. Lance l'enregistrement d'écran
3. Montre :
   - La page https://localhost:3000 (bouton "Login with TikTok")
   - Clique Login → TikTok OAuth → Authorize
   - Retour sur le site → "Connected to TikTok"
   - Upload une vidéo test → résultat "SUCCESS"
4. Arrête l'enregistrement → sauvegarde en MP4
5. Upload cette vidéo dans le formulaire TikTok Developer

## ÉTAPE 5 : Submit for review

Une fois la vidéo uploadée et tous les champs remplis → "Submit for review"
Attends 2-4 semaines pour l'approbation.

En attendant, tout fonctionne en mode Sandbox (vidéos privées seulement).
