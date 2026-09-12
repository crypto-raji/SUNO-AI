import AudioPlayer from "@/components/audio/AudioPlayer";
import AudioNotConfigured from "@/components/audio/AudioNotConfigured";

export default function AudioPlaylist({
  items,
}: {
  items: { section: string; url: string | null; status: "ready" | "failed" | "not_configured" }[];
}) {
  const anyNotConfigured = items.some((i) => i.status === "not_configured");

  if (anyNotConfigured) return <AudioNotConfigured />;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) =>
        item.status === "ready" && item.url ? (
          <AudioPlayer key={i} src={item.url} title={`Section ${i + 1}`} section={item.section} />
        ) : (
          <div key={i} className="glass-panel w-full max-w-md p-4">
            <p className="text-sm text-paper-100">{item.section}</p>
            <p className="mt-1 text-sm text-red-300">This section&apos;s audio failed to generate.</p>
          </div>
        )
      )}
    </div>
  );
}
