export const validationErrorMessage = (error: unknown): string | null => {
  const response = (error as { response?: { status?: number; data?: { detail?: unknown } } } | null)?.response;
  if (response?.status !== 422) return null;
  const detail = response.data?.detail;
  if (typeof detail === 'string') return detail || null;
  if (!Array.isArray(detail)) return null;

  const messages = detail.flatMap((issue: unknown) => {
    if (typeof issue !== 'object' || issue === null || !('msg' in issue) || typeof issue.msg !== 'string') {
      return [];
    }
    const location = 'loc' in issue && Array.isArray(issue.loc)
      ? issue.loc.filter((part: unknown) => (typeof part === 'string' || typeof part === 'number') && part !== 'body').join('.')
      : '';
    return [location ? `${location}: ${issue.msg}` : issue.msg];
  });
  return messages.join('; ') || null;
};
