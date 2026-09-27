import Spinner from '../_components/Spinner';

export default function Loading() {
  return (
    <div className="grid items-center justify-center text-center gap-4 py-20">
      <Spinner />

      <p className="text-xl text-primary-200">Loading opportunities...</p>
    </div>
  );
}
