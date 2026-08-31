// BÚSQUEDA SECUENCIAL — CON ÍNDICES
// La estructura principal es una lista ordenada dividida en bloques y, además,
// se construye un índice con la ÚLTIMA clave de cada bloque como referencia.
//
//   Bloque 1: [3, 7, 12, 18]   →   18 → Bloque 1
//   Bloque 2: [25, 31, 40, 46] →   46 → Bloque 2
//   Bloque 3: [52, 60, 68, 75] →   75 → Bloque 3
//
// Para buscar una clave se recorre el índice de forma SECUENCIAL hasta
// encontrar la entrada cuya última clave es mayor o igual que la buscada (esa
// entrada indica el bloque candidato). Luego se hace una búsqueda SECUENCIAL
// normal únicamente dentro de ese bloque. No se usa búsqueda binaria.

import { splitBlocks } from './fileBlocks';

/** Construye la estructura de índices: una entrada por bloque. */
export function buildSparseIndex(records, blockSize) {
  const blocks = splitBlocks(records, blockSize);
  return blocks.map((block, index) => ({
    block: index + 1,
    last: block[block.length - 1]?.key ?? null,
    count: block.length,
    address: index + 1,
  }));
}

/**
 * Busca `target` en una estructura ordenada usando la estructura de índices.
 * Recorre el índice secuencialmente y luego el bloque candidato.
 */
export function sequentialIndexSearch(sortedRecords, target, blockSize) {
  const blocks = splitBlocks(sortedRecords, blockSize);
  const index = buildSparseIndex(sortedRecords, blockSize);
  const values = sortedRecords.map((record) => record.key);

  let indexReads = 0;
  let accesses = 0;
  let comparisons = 0;
  const steps = [];

  steps.push({
    type: 'start',
    description: `Lista ordenada: ${values.join(', ')} (N = ${values.length}). Se divide en ${blocks.length} bloque(s) de ${blockSize} registro(s) y el índice guarda la última clave de cada bloque: ${index.map((entry) => `${entry.last} → Bloque ${entry.address}`).join(', ')}.`,
  });

  // 1) Recorrer el índice secuencialmente para localizar el bloque candidato.
  let candidate = null;
  for (let i = 0; i < index.length; i += 1) {
    indexReads += 1;
    const entry = index[i];
    if (Number(target) <= Number(entry.last)) {
      candidate = i;
      steps.push({
        type: 'index',
        entry: i,
        indexReads,
        candidate: i,
        description: `Consulta ${indexReads} al índice: entrada ${i + 1} [${entry.last} → Bloque ${entry.address}]. ¿${target} ≤ ${entry.last}? Sí: la clave ${target} podría estar en el Bloque ${entry.address}. Se selecciona ese bloque.`,
      });
      break;
    }
    steps.push({
      type: 'index',
      entry: i,
      indexReads,
      candidate: null,
      description: `Consulta ${indexReads} al índice: entrada ${i + 1} [${entry.last} → Bloque ${entry.address}]. ¿${target} ≤ ${entry.last}? No: ${target} es mayor que ${entry.last}, se continúa con la siguiente entrada.`,
    });
  }
  if (candidate == null) {
    candidate = blocks.length - 1;
    steps.push({
      type: 'index',
      entry: candidate,
      indexReads,
      candidate,
      description: `${target} es mayor que la última clave del último bloque (${index[index.length - 1].last}): la clave solo podría estar en el último bloque. Se selecciona el Bloque ${candidate + 1}.`,
    });
  }

  // 2) Búsqueda secuencial dentro del bloque candidato.
  accesses += 1;
  const keysInBlock = blocks[candidate].map((record) => record.key).join(', ');
  steps.push({
    type: 'access',
    block: candidate,
    candidate,
    accesses,
    comparisons,
    description: `Acceso ${accesses} a disco: se lee el Bloque ${candidate + 1} (registros: ${keysInBlock}).`,
  });

  for (let j = 0; j < blocks[candidate].length; j += 1) {
    comparisons += 1;
    const record = blocks[candidate][j];
    const position = candidate * blockSize + j + 1;
    const found = String(record.key) === String(target);
    steps.push({
      type: 'compare',
      block: candidate,
      slot: j,
      position,
      accesses,
      comparisons,
      found,
      description: found
        ? `Comparación ${comparisons}: ${record.key} = ${target} → clave encontrada en la posición ${position} del Bloque ${candidate + 1}.`
        : `Comparación ${comparisons}: ${record.key} ≠ ${target} → se sigue con el siguiente registro del Bloque.`,
    });
    if (found) {
      return {
        found: true,
        position,
        block: candidate + 1,
        accesses,
        comparisons,
        indexReads,
        steps,
      };
    }
  }

  steps.push({
    type: 'notfound',
    block: candidate,
    accesses,
    comparisons,
    indexReads,
    description: `Se revisó el Bloque ${candidate + 1} completo (${comparisons} comparación${comparisons === 1 ? '' : 'es'}) y la clave ${target} no se encuentra en la estructura.`,
  });
  return {
    found: false,
    position: null,
    block: null,
    accesses,
    comparisons,
    indexReads,
    steps,
  };
}