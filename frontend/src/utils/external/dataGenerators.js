// Generación de datos para búsquedas externas.
// Los "registros" son objetos { key }: la clave numérica es la que se busca.

/** Genera `count` claves numéricas únicas con exactamente `digits` dígitos. */
export function generateKeys(count, digits) {
  const minimum = digits === 1 ? 0 : 10 ** (digits - 1);
  const available = 10 ** digits - minimum;
  if (count > available) return null;
  const generated = new Set();
  while (generated.size < count) generated.add(String(Math.floor(Math.random() * available) + minimum));
  return [...generated];
}

/** Convierte una lista de claves en registros (cada registro es { key }). */
export function makeRecords(keys) {
  return keys.map((key) => ({ key: String(key) }));
}

/** Crea `count` registros aleatorios (claves únicas). */
export function randomRecords(count, digits) {
  const keys = generateKeys(count, digits);
  return keys ? makeRecords(keys) : null;
}

/** Verifica que un valor sea numérico y tenga exactamente `digits` dígitos. */
export function validKey(value, digits) {
  return new RegExp(`^\\d{${Number(digits)}}$`).test(String(value ?? ''));
}

/** Texto de error para una clave que no respeta la cantidad de dígitos. */
export function keyLengthError(type, digits) {
  const noun = type === 'search' ? 'La clave a buscar' : 'La clave';
  return { type: 'error', text: `${noun} debe ser numérica y tener exactamente ${digits} dígito${digits === '1' ? '' : 's'}.` };
}