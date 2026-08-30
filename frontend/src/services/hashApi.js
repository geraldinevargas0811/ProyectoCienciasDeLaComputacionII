const API_URL = 'http://localhost:8080/api/hash/transform';

export async function transformHash(request) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? 'No fue posible procesar la tabla hash.');
  return payload;
}

export async function searchHash(request) {
  const response = await fetch('http://localhost:8080/api/hash/search', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? 'No fue posible buscar la clave.');
  return payload;
}

export async function deleteHash(request) {
  const response = await fetch('http://localhost:8080/api/hash/delete', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? 'No fue posible eliminar la clave.');
  return payload;
}
