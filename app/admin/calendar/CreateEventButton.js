export default function CreateEventButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg bg-logo-100 text-white text-sm font-medium hover:bg-logo-200 transition"
    >
      + Create Event
    </button>
  );
}
