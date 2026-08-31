// BÚSQUEDA SECUENCIAL — USANDO BLOQUES
// El archivo se divide en bloques de tamaño BLOQUE = √N. La búsqueda lee cada
// bloque del "disco" (1 acceso de disco por bloque) y compara los registros
// dentro del bloque en memoria.

import { splitBlocks } from './fileBlocks';

/**
 * Ejecuta la búsqueda secuencial con bloques y devuelve los pasos de la
 * simulación junto con el resultado. Cada acceso de disco equivale a leer un
 * bloque completo; cada comparación es contra un registro individual.
 */
export function sequentialBlockSearch(records, target, blockSize) {
  const blocks = splitBlocks(records, blockSize);
  const total = records.length;
  let accesses = 0;
  let comparisons = 0;
  const steps = [];

  steps.push({
    type: 'start',
    description: `Archivo con N = ${total} registros. BLOQUE = √N = √${total} = ${blockSize}, por lo que el archivo queda dividido en ${blocks.length} bloque(s). La búsqueda leerá los bloques del disco en orden.`,
  });

  for (let b = 0; b < blocks.length; b += 1) {
    accesses += 1;
    const keysInBlock = blocks[b].map((record) => record.key).join(', ');
    steps.push({
      type: 'access',
      block: b,
      accesses,
      comparisons,
      description: `Acceso ${accesses} a disco: se lee el BLOQUE ${b + 1} completo (registros: ${keysInBlock}).`,
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
          ? `Comparación ${comparisons}: el registro ${record.key} (${record.name}) de la posición ${position} COINCIDE con la clave buscada ${target}.`
          : `Comparación ${comparisons}: el registro ${record.key} (${record.name}) de la posición ${position} no coincide con ${target}; se continúa.`,
      });
      if (found) {
        return {
          found: true,
          position,
          block: b + 1,
          accesses,
          comparisons,
          steps,
        };
      }
    }
  }

  steps.push({
    type: 'notfound',
    accesses,
    comparisons,
    description: `Se recorrieron los ${blocks.length} bloques del archivo (${accesses} accesos, ${comparisons} comparaciones) y la clave ${target} no se encuentra.`,
  });
  return { found: false, position: null, block: null, accesses, comparisons, steps };
}