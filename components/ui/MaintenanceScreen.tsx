export default function MaintenanceScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center text-paper-100">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="mb-6 text-signal">
        <path
          d="M14.7 6.3a1 1 0 0 0-1.4 0L11 8.6 9.4 7 11.7 4.7a1 1 0 0 0 0-1.4 4 4 0 0 0-5.4 5.4l-5 5a2 2 0 1 0 2.8 2.8l5-5a4 4 0 0 0 5.4-5.4Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h1 className="font-display text-2xl">Sona AI is currently under maintenance.</h1>
      <p className="mt-3 max-w-sm text-paper-300">{message}</p>
    </main>
  );
}
