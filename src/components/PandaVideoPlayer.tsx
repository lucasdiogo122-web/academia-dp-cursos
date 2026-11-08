/**
 * Player do Panda Video. A URL base do player é específica da sua biblioteca
 * (algo como "https://player-vz-xxxxxxx.tv.pandavideo.com.br/embed/"),
 * disponível no painel do Panda Video ao embedar qualquer vídeo.
 * Configure em NEXT_PUBLIC_PANDAVIDEO_PLAYER_URL.
 */
export default function PandaVideoPlayer({ videoId }: { videoId: string }) {
  const playerBaseUrl =
    process.env.NEXT_PUBLIC_PANDAVIDEO_PLAYER_URL ??
    "https://player.pandavideo.com.br/embed";

  const src = `${playerBaseUrl}/?v=${encodeURIComponent(videoId)}`;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black shadow-lg">
      <iframe
        src={src}
        className="h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        title="Videoaula"
      />
    </div>
  );
}
