"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  RefreshCw,
  Play,
  Download,
  ArrowRight,
  Trophy,
  Flame,
  Sparkles,
} from "lucide-react";
import CameraView from "../components/CameraView";
import Timer from "../components/Timer";

const DIFFICULTIES = [
  { key: "facile", label: "Facile 🌱", color: "from-emerald-400 to-teal-500", seconds: 60 },
  { key: "moyen", label: "Moyen 🔥", color: "from-amber-400 to-orange-500", seconds: 90 },
  { key: "difficile", label: "Difficile ⚡", color: "from-fuchsia-500 to-rose-500", seconds: 120 },
];

export default function Home() {
  const [screen, setScreen] = useState("home");
  const [difficulty, setDifficulty] = useState("moyen");
  const [topicData, setTopicData] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [totalSeconds, setTotalSeconds] = useState(90);
  const [feedback, setFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState(null);
  const [customTheme, setCustomTheme] = useState("");

  const cameraRef = useRef(null);
  const audioCtxRef = useRef(null);
  

  const playBeep = useCallback((freq = 880, duration = 0.4) => {
    try {
      const ctx =
        audioCtxRef.current ||
        new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }, []);

  const generateTopic = useCallback(async (diff) => {
    setScreen("generating");
    setError(null);
    try {
      const res = await fetch("/api/generate-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty: diff,
          customTheme: customTheme,
        }),
      });
      const data = await res.json();
      setTopicData(data);
      const dur = DIFFICULTIES.find((d) => d.key === diff)?.seconds || 90;
      setTotalSeconds(dur);
      setSecondsLeft(dur);
      setScreen("ready");
    } catch (e) {
      setError("Erreur lors de la génération du sujet. Réessaie.");
      setScreen("home");
    }
  }, [customTheme]);

  const startChallenge = useCallback(() => {
    setScreen("challenge");
    setFeedback(null);
    setRecordedUrl(null);
  }, []);

  const finishChallenge = useCallback(async (didComplete) => {
    playBeep(660, 0.6);
    const blob = await cameraRef.current?.stopRecording();
    if (blob && blob.size > 0) {
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
    } else {
      console.warn("Aucune vidéo enregistrée (blob vide ou nul).");
      setRecordedUrl(null);
    }
    if (didComplete) setStreak((s) => s + 1);
    setScreen("results");

    setLoadingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicData?.topic,
          duration: totalSeconds - secondsLeft,
          difficulty,
        }),
      });
      const data = await res.json();
      setFeedback(data);
    } catch {
      setFeedback({
        score: 75,
        strengths: "Tu as osé te lancer, bravo !",
        improvements: "Structure ton discours en 3 parties.",
        encouragement: "Continue comme ça ! 💪",
      });
    } finally {
      setLoadingFeedback(false);
    }
  }, [playBeep, topicData, totalSeconds, secondsLeft, difficulty]);

  useEffect(() => {
    if (screen !== "challenge") return;
    if (secondsLeft <= 0) {
      finishChallenge(true);
      return;
    }
    const id = setTimeout(() => {
      setSecondsLeft((s) => {
        if (s === 11) playBeep(440, 0.15);
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [screen, secondsLeft, finishChallenge, playBeep]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative">
      {streak > 0 && (
        <div className="fixed top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-semibold text-amber-300 z-20">
          <Flame size={18} className="text-amber-400" />
          {streak} défi{streak > 1 ? "s" : ""} relevé{streak > 1 ? "s" : ""}
        </div>
      )}

      <AnimatePresence mode="wait">
        {screen === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center max-w-xl"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🎤
            </motion.div>
            <h1 className="text-5xl sm:text-6xl font-extrabold gradient-text mb-3">
              Vloxy
            </h1>
            <p className="text-white/60 mb-10 text-lg">
              Affronte des sujets générés par IA, exprime-toi face caméra,
              et progresse défi après défi. 🔥
            </p>

            <div className="w-full mb-8">
              <p className="text-sm uppercase tracking-widest text-white/40 mb-3">
                Choisis ta difficulté
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDifficulty(d.key)}
                    className={`relative px-4 py-3 rounded-2xl font-semibold transition-all border ${
                      difficulty === d.key
                        ? `bg-gradient-to-r ${d.color} text-white border-transparent scale-105 shadow-lg`
                        : "glass text-white/70 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {d.label}
                    <div className="text-xs opacity-70 mt-1">{d.seconds}s</div>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

            <div className="w-full mb-6">
  <p className="text-sm uppercase tracking-widest text-white/40 mb-3">
    Thème personnalisé (optionnel)
  </p>

  <input
    type="text"
    placeholder="Ex: football, anime, politique, relations..."
    value={customTheme}
    onChange={(e) => setCustomTheme(e.target.value)}
    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-accent"
  />
</div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => generateTopic(difficulty)}
              className="group flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xl font-bold shadow-2xl animate-glow"
            >
              <Zap className="group-hover:rotate-12 transition" />
              Commencer un défi
            </motion.button>

            <p className="text-white/30 text-xs mt-6">
              Autorise l'accès à ta caméra et ton micro pour jouer 🎥🎙️
            </p>
          </motion.div>
        )}

        {screen === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={56} className="text-accent" />
            </motion.div>
            <p className="text-xl font-semibold text-white/80">
              L'IA prépare ton sujet...
            </p>
          </motion.div>
        )}

        {screen === "ready" && topicData && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center max-w-xl glass rounded-3xl p-8 sm:p-10"
          >
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/20 text-accent mb-4">
              {topicData.category} • {difficulty}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 leading-snug">
              {topicData.topic}
            </h2>
            <p className="text-white/50 italic mb-8">💡 {topicData.tip}</p>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={startChallenge}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-lg shadow-xl"
              >
                <Play size={20} /> Démarrer ({totalSeconds}s)
              </motion.button>
              <button
                onClick={() => generateTopic(difficulty)}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-full glass font-semibold text-white/80 hover:text-white transition"
              >
                <RefreshCw size={18} /> Autre sujet
              </button>
            </div>
          </motion.div>
        )}

        {screen === "challenge" && topicData && (
          <motion.div
            key="challenge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 w-full max-w-2xl"
          >
            <div className="text-center">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/20 text-accent mb-2 inline-block">
                {topicData.category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
                {topicData.topic}
              </h2>
            </div>

            <CameraView ref={cameraRef} active={true} />

            <Timer secondsLeft={secondsLeft} totalSeconds={totalSeconds} />

            <button
              onClick={() => finishChallenge(false)}
              className="px-8 py-3 rounded-full glass font-semibold text-white/70 hover:text-white hover:border-rose-400/50 border border-white/10 transition"
            >
              Terminer maintenant
            </button>
          </motion.div>
        )}

        {screen === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center max-w-xl glass rounded-3xl p-8 sm:p-10 w-full"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="mb-2"
            >
              <Trophy size={48} className="text-amber-400" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-1">Défi terminé !</h2>
            <p className="text-white/50 mb-6">{topicData?.topic}</p>

            {recordedUrl ? (
              <video
                src={recordedUrl}
                controls
                className="w-full rounded-2xl mb-6 scale-x-[-1] max-h-72 object-cover"
              />
            ) : (
              <div className="w-full rounded-2xl mb-6 p-6 glass text-white/50 text-sm">
                ⚠️ Aucune vidéo enregistrée. Vérifie que ton navigateur autorise
                l'enregistrement (MediaRecorder) et que la caméra était bien activée.
              </div>
            )}

            <div className="w-full glass rounded-2xl p-6 mb-6 text-left">
              {loadingFeedback ? (
                <div className="flex items-center justify-center gap-2 text-white/60 py-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={20} className="text-accent" />
                  </motion.div>
                  Analyse de ta performance par l'IA...
                </div>
              ) : feedback ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-white/70">
                      Score d'éloquence
                    </span>
                    <span className="text-3xl font-extrabold gradient-text">
                      {feedback.score}/100
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden mb-5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${feedback.score}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-accent"
                    />
                  </div>
                  <p className="mb-2">
                    <span className="font-semibold text-emerald-400">✅ Points forts : </span>
                    {feedback.strengths}
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold text-amber-400">🎯 À améliorer : </span>
                    {feedback.improvements}
                  </p>
                  <p className="text-white/60 italic mt-3">
                    {feedback.encouragement}
                  </p>
                </>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {recordedUrl && (
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = recordedUrl;
                    link.download = `eloquence-${Date.now()}.webm`;
                    link.click();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-full glass font-semibold hover:text-accent transition"
                >
                  <Download size={18} /> Enregistrer
                </button>
              )}
              <button
                onClick={() => generateTopic(difficulty)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold shadow-xl"
              >
                <RefreshCw size={18} /> Nouveau défi
              </button>
              <button
                onClick={() => {
                  setScreen("home");
                  setTopicData(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-full glass font-semibold text-white/70 hover:text-white transition"
              >
                Accueil <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}