# 🎤 VLOXY

**VLOXY** est une plateforme intelligente d’entraînement à l’éloquence et à la prise de parole en public, propulsée par l’intelligence artificielle.

Elle aide les utilisateurs à transformer leurs idées en discours clairs, structurés et convaincants, et à surmonter le blocage fréquent entre la pensée et l’expression orale.

---

## 🧠 Contexte

Il existe beaucoup de personnes qui, lorsqu’elles écrivent , ont des idées claires et bien structurées.

Mais au moment de prendre la parole en public, tout change :

* les mots deviennent difficiles à trouver
* les phrases se bloquent
* les idées disparaissent sous le stress

**VLOXY** a été créé pour résoudre ce problème.

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
