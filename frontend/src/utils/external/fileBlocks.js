// Estructura física del archivo externo.
// El archivo se organiza en bloques (áreas de lectura en disco).
// Según las notas del profesor: BLOQUE = √N, donde N es el número de registros.

/** Tamaño de bloque según la fórmula del profesor: BLOQUE = √N. */
export function sqrtBlockSize(n) {
  return Math.max(1, Math.ceil(Math.sqrt(n)));
}

/** Divide los registros en bloques consecutivos de tamaño `blockSize`. */
export function splitBlocks(records, blockSize) {
  const blocks = [];
  for (let index = 0; index < records.length; index += blockSize) {
    blocks.push(records.slice(index, index + blockSize));
  }
  return blocks;
}

/** Copia ordenada de los registros por clave numérica. */
export function sortByKey(records) {
  return [...records].sort((a, b) => Number(a.key) - Number(b.key));
}

/** Bloque (0-indexado) que contiene la posición 1-indexada dada. */
export function blockOf(position, blockSize) {
  return Math.floor((position - 1) / blockSize);
}

/** Suma los registros de todos los bloques. */
export function flattenBlocks(blocks) {
  return blocks.reduce((all, block) => [...all, ...block], []);
}