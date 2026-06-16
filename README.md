# 🎤 Eloquence Arena

Plateforme web ludique pour s'entraîner à l'éloquence : l'IA (Groq) génère un sujet,
tu t'enregistres en caméra/micro pendant un timer, et tu reçois un feedback IA.

## 🚀 Installation

```bash
npm install
cp .env.local.example .env.local
# Mets ta clé Groq dans .env.local (gratuite sur https://console.groq.com)
npm run dev
```

Ouvre http://localhost:3000

## 📁 Structure

```
eloquence-arena/
├── app/
│   ├── page.js                  # Page principale (state machine UI)
│   ├── layout.js                # Layout global
│   ├── globals.css              # Styles globaux + Tailwind
│   └── api/
│       ├── generate-topic/route.js  # Génération de sujet via Groq
│       └── feedback/route.js        # Feedback IA après le défi
├── components/
│   ├── CameraView.js            # Caméra/micro WebRTC + enregistrement
│   └── Timer.js                 # Timer circulaire animé
├── tailwind.config.js
├── package.json
└── .env.local.example
```

## 🧠 Fonctionnement

1. **Accueil** : choix de la difficulté (facile 60s / moyen 90s / difficile 120s)
2. **Génération** : appel à `/api/generate-topic` → Groq (llama-3.3-70b-versatile) génère un sujet aléatoire dans une catégorie aléatoire
3. **Prêt** : affichage du sujet + astuce, possibilité de regénérer
4. **Défi** : caméra/micro s'activent (WebRTC), timer circulaire démarre, enregistrement vidéo en local
5. **Résultats** : lecture de la vidéo enregistrée, téléchargement, feedback IA (`/api/feedback`) avec score simulé, points forts/à améliorer

## 🔑 Clé API

Obtiens une clé gratuite sur https://console.groq.com et place-la dans `.env.local` :

```
GROQ_API_KEY=your_api_key_here
```

## 🎨 Stack

- Next.js 14 (App Router) + API routes
- TailwindCSS + Framer Motion
- Groq SDK (llama-3.3-70b-versatile)
- WebRTC (getUserMedia + MediaRecorder)

## 🔥 Idées d'extensions (bonus)

- Mode duel (2 joueurs, sujets synchronisés)
- Historique des scores (localStorage ou DB)
- Analyse audio réelle (transcription via Whisper sur Groq + analyse de débit/mots de remplissage)
