'use client';
import { useState } from 'react';
import { uploadPdf } from '../actions/uploadPdf';

export default function UploadPDF() {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    try {
      await uploadPdf(file);
      alert('Upload successful!');
    } catch (e) {
      console.error(e.message);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Upload PDF</button>
    </div>
  );
}
