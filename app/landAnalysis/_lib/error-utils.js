

export function getErrorMessage(err) {
  const msg = err?.message || '';

  if (msg.includes('duplicate key')) {
    return 'This entry already exists.';
  }

  if (msg.includes('null value')) {
    return 'All required fields must be filled.';
  }

  return 'Something went wrong. Please try again.';
}
