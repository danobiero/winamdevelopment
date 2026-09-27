import {
  getOptionsByCategory,
  createPropertyWithSelections,
} from './_lib/actions';

import PropertyForm from './_components/PropertyForm';

export default async function Page() {
  const categories = await getOptionsByCategory();

  return (
    <PropertyForm
      categories={categories}
      createPropertyWithSelections={createPropertyWithSelections}
    />
  );
}
