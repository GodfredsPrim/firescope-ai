export const staticHosting = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_STATIC_HOSTING === 'true';
export const hostingMessage = 'This public research demo includes saved NASA studies, CSV imports, analysis and exports. Live NASA, weather, news and place search are not connected.';
export function createApiFetch(forStaticHosting: boolean) {
 return function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  if (forStaticHosting && !['/api/demo/historical', '/api/demo/seasonal-study'].includes(path)) {
    return Promise.resolve(Response.json({ error: 'This service is not connected in the public research demo. Explore the saved NASA studies or import a CSV.' }, { status: 503 }));
  }
  return fetch(path, options);
 };
}
export const apiFetch = createApiFetch(staticHosting);
