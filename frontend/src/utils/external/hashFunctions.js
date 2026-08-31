// FUNC HASH — búsqueda por transformación de claves.
// Cada función recibe una clave numérica y el tamaño M del archivo (cantidad de
// posiciones/cubetas) y devuelve una POSICIÓN/CUBETA entre 1 y M, junto con el
// texto que explica la transformación (CLAVE → FUNCIÓN HASH → POSICIÓN).

const digitsOf = (m) => String(m).length;

/** FUNCIÓN MÓDULO: H(K) = (K mod M) + 1. */
function modulo(key, m) {
  const position = (parseInt(key, 10) % m) + 1;
  const text = `H(K) = (K mod M) + 1 = (${key} mod ${m}) + 1 = ${position}`;
  return { position, text };
}

/** FUNCIÓN CUADRADO (dígitos centrales del cuadrado). */
function cuadrado(key, m) {
  const n = parseInt(key, 10);
  const square = n * n;
  const required = digitsOf(m);
  let padded = String(square);
  while (padded.length < required + 2) padded = `0${padded}`;
  const discard = Math.floor((padded.length - required) / 2);
  const middle = padded.substr(discard, required);
  const position = (parseInt(middle, 10) % m) + 1;
  const note = padded.length !== String(square).length ? ' (se completa con ceros a la izquierda)' : '';
  const text = `H(K): K² = ${square}${note} → se extraen los dígitos centrales "${middle}" → (${middle} mod ${m}) + 1 = ${position}`;
  return { position, text };
}

/** FUNCIÓN TRUNCAMIENTO: se conservan el primer y el último dígito de la clave. */
function truncamiento(key, m) {
  const str = String(parseInt(key, 10));
  const digits = str.length === 1 ? str + str : `${str[0]}${str[str.length - 1]}`;
  const position = (parseInt(digits, 10) % m) + 1;
  const text = `H(K): truncamiento → se conservan el primer y el último dígito ("${digits}") → (${digits} mod ${m}) + 1 = ${position}`;
  return { position, text };
}

/** FUNCIÓN PLEGAMIENTO: la clave se divide en grupos y los grupos se suman. */
function plegamiento(key, m) {
  const groupSize = digitsOf(m);
  const str = String(parseInt(key, 10));
  const parts = [];
  for (let i = 0; i < str.length; i += groupSize) parts.push(str.substr(i, groupSize));
  const sum = parts.reduce((acc, part) => acc + parseInt(part, 10), 0);
  const position = (sum % m) + 1;
  const text = `H(K): plegamiento en grupos de ${groupSize} dígito(s) [${parts.join(' · ')}] → suma = ${sum} → (${sum} mod ${m}) + 1 = ${position}`;
  return { position, text };
}

/** FUNCIÓN CONVERSIÓN DE BASES: la clave se interpreta en la base (M + 1) y se
 *  convierte a decimal; el valor se reduce con módulo al tamaño del archivo. */
function conversionBases(key, m) {
  const base = m + 1;
  const str = String(parseInt(key, 10));
  let value = 0;
  const terms = [];
  for (let i = 0; i < str.length; i += 1) {
    const digit = parseInt(str[i], 10);
    const exp = str.length - 1 - i;
    const term = digit * (base ** exp);
    value += term;
    terms.push(exp > 0 ? `${digit}·${base}^${exp}` : `${digit}`);
  }
  const position = (value % m) + 1;
  const text = `H(K): conversión de bases → "(${key})10" se interpreta en base ${base} → [${terms.join(' + ')}] = ${value} → (${value} mod ${m}) + 1 = ${position}`;
  return { position, text };
}

export const HASH_FUNCTIONS = {
  modulo: { label: 'Función módulo', short: 'Módulo', fn: modulo },
  cuadrado: { label: 'Función cuadrado', short: 'Cuadrado', fn: cuadrado },
  truncamiento: { label: 'Función truncamiento', short: 'Truncamiento', fn: truncamiento },
  plegamiento: { label: 'Función plegamiento', short: 'Plegamiento', fn: plegamiento },
  conversion: { label: 'Función conversión de bases', short: 'Conversión de bases', fn: conversionBases },
};

export const HASH_ORDER = ['modulo', 'cuadrado', 'truncamiento', 'plegamiento', 'conversion'];

/** Calcula la posición/cubeta de una clave con la función indicada. */
export function hashKey(key, size, functionName) {
  const fn = HASH_FUNCTIONS[functionName]?.fn;
  if (!fn) throw new Error(`Función hash no reconocida: ${functionName}`);
  return fn(String(key), size);
}

/**
 * Calcula las posiciones de todas las claves con la función elegida y detecta
 * las colisiones (claves que producen la misma posición).
 */
export function computeHashTable(keys, size, functionName) {
  const results = keys.map((key) => {
    const { position, text } = hashKey(key, size, functionName);
    return { key: String(key), position, text };
  });
  const byPosition = {};
  results.forEach((result) => {
    (byPosition[result.position] = byPosition[result.position] || []).push(result.key);
  });
  const collisions = Object.entries(byPosition)
    .filter(([, list]) => list.length > 1)
    .map(([position, list]) => ({ position: Number(position), keys: list }));
  return {
    results,
    byPosition,
    collisions,
    size,
    name: HASH_FUNCTIONS[functionName].label,
  };
}