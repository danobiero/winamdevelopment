import {
  getOptions,
  getCategories,
  createOption,
  deleteOption,
  updateOption,
} from '../_lib/actions';

import OptionManager from './OptionManager';

export default async function Page() {
  const options = await getOptions();
  const categories = await getCategories();

  return (
    <OptionManager
      options={options}
      categories={categories}
      createOption={createOption}
      deleteOption={deleteOption}
      updateOption={updateOption}
    />
  );
}