// BÚSQUEDA SECUENCIAL — CON ÍNDICES
// Existen dos archivos: el archivo principal de datos (organizado/ordenado,
// dividido en bloques) y un archivo de índices con una entrada por BLOQUE.
// Cada entrada del índice guarda el primer y el último registro del bloque y
// la dirección (número de bloque) donde continúa la búsqueda.
//
// El índice se consulta en memoria (no genera acceso a disco) para localizar
// la posición aproximada; a partir de ahí se lee el bloque indicado y se
// realiza la búsqueda secuencial sobre el archivo de datos.

import { splitBlocks } from './fileBlocks';

/** Construye el archivo de índices: una entrada por bloque. */
export function buildSparseIndex(records, blockSize) {
  const blocks = splitBlocks(records, blockSize);
  return blocks.map((block, index) => ({
    block: index + 1,
    first: block[0]?.key ?? null,
    last: block[block.length - 1]?.key ?? null,
    count: block.length,
    address: index + 1,
  }));
}

/**
 * Busca `target` en un archivo ordenado usando el archivo de índices.
 * Devuelve los pasos con las consultas al índice, los accesos al archivo de
 * datos y las comparaciones sobre los bloques.
 */
export function sequentialIndexSearch(sortedRecords, target, blockSize) {
  const blocks = splitBlocks(sortedRecords, blockSize);
  const index = buildSparseIndex(sortedRecords, blockSize);
  let indexReads = 0;
  let accesses = 0;
  let comparisons = 0;
  const steps = [];

  steps.push({
    type: 'start',
    description: `Archivo ordenado con N = ${sortedRecords.length} registros en ${blocks.length} bloque(s) (BLOQUE = √N = ${blockSize}). Se construyó el ARCHIVO DE ÍNDICES con ${index.length} entrada(s), una por bloque. Las consultas al índice se hacen en memoria.`,
  });

  // 1) Consultar el índice en memoria para localizar la posición aproximada.
  let candidate = 0;
  let located = false;
  for (let i = 0; i < index.length; i += 1) {
    indexReads += 1;
    const entry = index[i];
    if (Number(entry.last) >= Number(target)) {
      candidate = i;
      located = true;
      steps.push({
        type: 'index',
        entry: i,
        indexReads,
        candidate: i,
        description: `Consulta ${indexReads} al índice: entrada ${i + 1} [${entry.first}..${entry.last} → BLOQUE ${entry.address}]. Como la última clave del bloque (${entry.last}) es ≥ ${target}, la clave podría estar en el BLOQUE ${entry.address}: posición aproximada localizada.`,
      });
      break;
    }
    steps.push({
      type: 'index',
      entry: i,
      indexReads,
      candidate: null,
      description: `Consulta ${indexReads} al índice: entrada ${i + 1} [${entry.first}..${entry.last} → BLOQUE ${entry.address}]. La última clave ${entry.last} es menor que ${target}: se descarta y se continúa con la siguiente entrada.`,
    });
  }
  if (!located) candidate = blocks.length - 1;

  // 2) Búsqueda secuencial sobre el archivo de datos a partir del bloque candidato.
  for (let b = candidate; b < blocks.length; b += 1) {
    accesses += 1;
    const keysInBlock = blocks[b].map((record) => record.key).join(', ');
    steps.push({
      type: 'access',
      block: b,
      candidate,
      accesses,
      comparisons,
      description: `Acceso ${accesses} al archivo de datos: el índice indicó el BLOQUE ${b + 1}, así que se lee del disco (registros: ${keysInBlock}).`,
    });

    for (let j = 0; j < blocks[b].length; j += 1) {
      comparisons += 1;
      const record = blocks[b][j];
      const position = b * blockSize + j + 1;
      const found = String(record.key) === String(target);
      steps.push({
        type: 'compare',
        block: b,
        slot: j,
        position,
        accesses,
        comparisons,
        found,
        description: found
          ? `Comparación ${comparisons}: el registro ${record.key} (${record.name}) de la posición ${position} COINCIDE con ${target}.`
          : `Comparación ${comparisons}: el registro ${record.key} (${record.name}) de la posición ${position} no coincide con ${target}; se continúa la búsqueda secuencial.`,
      });
      if (found) {
        return {
          found: true,
          position,
          block: b + 1,
          accesses,
          comparisons,
          indexReads,
          steps,
        };
      }
    }
  }

  steps.push({
    type: 'notfound',
    accesses,
    comparisons,
    indexReads,
    description: `Se recorrió el archivo desde la posición indicada por el índice (${accesses} accesos, ${comparisons} comparaciones) y la clave ${target} no se encuentra.`,
  });
  return { found: false, position: null, block: null, accesses, comparisons, indexReads, steps };
}