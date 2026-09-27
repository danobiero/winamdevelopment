import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} from '../_lib/actions';

import CategoryManager from './CategoryManager';

export default async function Page() {
  const categories = await getCategories();

  return (
    <CategoryManager
      categories={categories}
      createCategory={createCategory}
      deleteCategory={deleteCategory}
      updateCategory={updateCategory}
    />
  );
}
