'use client';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createServerComponentClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);


async function handleDownload(filePath) {
  // PRIVATE bucket (signed URL)
  const { data, error } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(filePath, 60);

  if (error) {
    console.error('Download error:', error);
    return;
  }

  // Force download
  const link = document.createElement('a');
  link.href = data.signedUrl;
  link.download = filePath.split('/').pop();
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function DownloadButton({ session, category, filePath }) {
  return (
    <>
      {session?.user ? (
        <button
          className="bg-primary-600 hover:bg-primary-700 transition-colors duration-300 text-white px-6 py-3 rounded-lg text-lg shadow-lg"
          aria-label={category === 1 ? 'Book this lesson' : 'Download resource'}
          onClick={() => category !== 1 && handleDownload(filePath)}
        >
          {category === 1 ? 'Welcome' : 'Download'}
        </button>
      ) : (
        category !== 1 && <LoginMessage />
      )}
    </>
  );
}
