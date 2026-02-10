'use client';

import { useState } from 'react';
import UploadMaterials from '../UploadMaterials';
import MaterialsList from '../_components/MaterialsList';

export default function LessonMaterialsClient({ initialMaterials, lesson }) {
  const [materials, setMaterials] = useState(initialMaterials);

  // Called when upload succeeds
  const handleMaterialAdded = (newMaterial) => {
    setMaterials((prev) => [newMaterial, ...prev]);
  };

  // Called when delete succeeds
  const handleMaterialDeleted = (id) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-10">
      {/* Upload */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <UploadMaterials lessons={[lesson]} onUpload={handleMaterialAdded} />
      </div>

      {/* List */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <MaterialsList materials={materials} onDelete={handleMaterialDeleted} />
      </div>
    </div>
  );
}
