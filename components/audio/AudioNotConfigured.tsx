export default function AudioNotConfigured() {
  return (
    <div className="glass-panel w-full max-w-md border-signal/20 p-4">
      <p className="text-sm text-paper-100">Audio generation isn&apos;t set up yet.</p>
      <p className="mt-1 text-xs text-paper-300">
        Sona AI&apos;s text-to-speech provider hasn&apos;t been configured for this project yet. Once one is
        added, this will generate real audio automatically — nothing else needs to change.
      </p>
    </div>
  );
}
