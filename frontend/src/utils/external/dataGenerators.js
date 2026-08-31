// Generación de datos para búsquedas externas.
// Los "registros" son objetos { key, name }: la clave numérica es la que se
// busca; el nombre solo da contexto visual al registro dentro del archivo.

const NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Estela', 'Fabián', 'Gina', 'Hugo', 'Irene', 'Jorge', 'Karina', 'Luis', 'Marta', 'Nico', 'Olga', 'Pablo', 'Queta', 'Rita', 'Sofía', 'Tomás', 'Úrsula', 'Víctor', 'Wendy', 'Ximena', 'Yago', 'Zulema'];

/** Genera `count` claves numéricas únicas con exactamente `digits` dígitos. */
export function generateKeys(count, digits) {
  const minimum = digits === 1 ? 0 : 10 ** (digits - 1);
  const available = 10 ** digits - minimum;
  if (count > available) return null;
  const generated = new Set();
  while (generated.size < count) generated.add(String(Math.floor(Math.random() * available) + minimum));
  return [...generated];
}

/** Convierte una lista de claves en registros con nombre asociado. */
export function makeRecords(keys) {
  return keys.map((key, index) => ({ key: String(key), name: NAMES[index % NAMES.length] }));
}

/** Crea `count` registros aleatorios (claves únicas). */
export function randomRecords(count, digits) {
  const keys = generateKeys(count, digits);
  return keys ? makeRecords(keys) : null;
}

/** Nombre automático para un registro ingresado manualmente. */
export function nameFor(records) {
  return NAMES[(records?.length ?? 0) % NAMES.length];
}