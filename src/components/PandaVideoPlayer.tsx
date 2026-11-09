"use client";

import { useEffect, useRef } from "react";
import { markLessonWatchedAction } from "@/app/membros/progress-actions";

/**
 * Player do Panda Video. A URL base do player é específica da sua biblioteca
 * (algo como "https://player-vz-xxxxxxx.tv.pandavideo.com.br/embed/"),
 * disponível no painel do Panda Video ao embedar qualquer vídeo.
 * Configure em NEXT_PUBLIC_PANDAVIDEO_PLAYER_URL.
 *
 * Quando o player dispara o evento `panda_ended` (vídeo assistido até o
 * fim), marcamos a aula como concluída via Server Action — não depende de o
 * aluno clicar em nada. O evento não dispara com autoplay ligado, então o
 * player aqui não usa autoplay.
 */
export default function PandaVideoPlayer({
  videoId,
  lessonId,
}: {
  videoId: string;
  lessonId: string;
}) {
  const playerBaseUrl =
    process.env.NEXT_PUBLIC_PANDAVIDEO_PLAYER_URL ??
    "https://player.pandavideo.com.br/embed";

  const src = `${playerBaseUrl}/?v=${encodeURIComponent(videoId)}`;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;

    function handleMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as { message?: string } | null | undefined;
      if (data?.message === "panda_ended" && !firedRef.current) {
        firedRef.current = true;
        markLessonWatchedAction(lessonId).catch(() => {
          firedRef.current = false;
        });
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [lessonId]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black shadow-lg">
      <iframe
        ref={iframeRef}
        src={src}
        className="h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        title="Videoaula"
      />
    </div>
  );
}
