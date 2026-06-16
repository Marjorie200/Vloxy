"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";

const CameraView = forwardRef(function CameraView({ active }, ref) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [error, setError] = useState(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  useImperativeHandle(ref, () => ({
    startRecording: () => {
      const attemptStart = (retriesLeft) => {
        if (!streamRef.current) {
          if (retriesLeft > 0) {
            console.log("Stream not ready yet, retrying...", retriesLeft);
            setTimeout(() => attemptStart(retriesLeft - 1), 300);
          } else {
            console.warn("No stream available for recording after retries");
          }
          return;
        }

        // Avoid starting a second recorder if one is already active
        if (recorderRef.current && recorderRef.current.state === "recording") {
          console.log("Recorder already running, skipping duplicate start.");
          return;
        }

        chunksRef.current = [];

        const candidates = [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
          "video/mp4",
        ];
        const supported = candidates.find(
          (type) =>
            typeof MediaRecorder !== "undefined" &&
            MediaRecorder.isTypeSupported &&
            MediaRecorder.isTypeSupported(type)
        );

        try {
          const recorder = supported
            ? new MediaRecorder(streamRef.current, { mimeType: supported })
            : new MediaRecorder(streamRef.current);

          recorder.ondataavailable = (e) => {
            console.log("ondataavailable, size:", e.data?.size);
            if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
          };
          recorder.onerror = (e) => console.error("Recorder error:", e);
          recorder.start(500);
          recorderRef.current = recorder;
          recorderRef.current._mimeType = supported || "video/webm";
          console.log(
            "Recording started with mimeType:",
            supported || "default",
            "state:",
            recorder.state
          );
        } catch (e) {
          console.error("MediaRecorder init error:", e);
        }
      };

      attemptStart(10);
    },
    stopRecording: () =>
      new Promise((resolve) => {
        const recorder = recorderRef.current;
        console.log(
          "stopRecording called. recorder state:",
          recorder?.state,
          "chunks so far:",
          chunksRef.current.length
        );

        if (!recorder) {
          resolve(null);
          return;
        }

        if (recorder.state === "inactive") {
          const type = recorder._mimeType || "video/webm";
          resolve(
            chunksRef.current.length
              ? new Blob(chunksRef.current, { type })
              : null
          );
          return;
        }

        recorder.onstop = () => {
          const type = recorder._mimeType || "video/webm";
          console.log("recorder.onstop fired. total chunks:", chunksRef.current.length);
          const blob = new Blob(chunksRef.current, { type });
          console.log("blob size:", blob.size, "type:", blob.type);
          resolve(blob);
        };

        try {
          recorder.requestData();
        } catch (e) {
          console.warn("requestData failed:", e);
        }
        recorder.stop();
      }),
    toggleCam: () => {
      const stream = streamRef.current;
      if (!stream) return;
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setCamOn(track.enabled);
      }
    },
    toggleMic: () => {
      const stream = streamRef.current;
      if (!stream) return;
      const track = stream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setMicOn(track.enabled);
      }
    },
  }));

  useEffect(() => {
    let stream;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        console.log("Camera stream acquired:", stream);

        // Auto-start recording as soon as the stream is ready
        ref.current?.startRecording();
      } catch (e) {
        console.error(e);
        setError(
          "Impossible d'accéder à la caméra/micro. Vérifie les permissions de ton navigateur."
        );
      }
    }
    if (active) start();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop();
        } catch (e) {}
      }
      streamRef.current = null;
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden glass shadow-2xl">
      {error ? (
        <div className="w-full h-full flex items-center justify-center p-6 text-center text-red-300">
          {error}
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
        <button
          onClick={() => ref.current?.toggleCam()}
          className="p-3 rounded-full glass hover:bg-white/10 transition"
          title="Activer/désactiver la caméra"
        >
          {camOn ? <Video size={20} /> : <VideoOff size={20} className="text-red-400" />}
        </button>
        <button
          onClick={() => ref.current?.toggleMic()}
          className="p-3 rounded-full glass hover:bg-white/10 transition"
          title="Activer/désactiver le micro"
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} className="text-red-400" />}
        </button>
      </div>

      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        REC
      </div>
    </div>
  );
});

export default CameraView;