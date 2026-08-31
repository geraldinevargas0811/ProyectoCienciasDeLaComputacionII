// BÚSQUEDA BINARIA sobre un archivo organizado/ordenado.
// Se trabaja sobre las posiciones del archivo (1..N). En cada paso se consulta
// el registro de la posición central; cada consulta implica leer del disco el
// BLOQUE donde vive ese registro (1 acceso). Tras cada comparación el intervalo
// de búsqueda se reduce a la mitad.

import { blockOf } from './fileBlocks';

/**
 * Ejecuta búsqueda binaria sobre registros ordenados.
 * Cada comparación se genera como un paso para poder animar la reducción del
 * espacio de búsqueda (posición inicial, final y central).
 */
export function binaryFileSearch(records, target, blockSize) {
  let lower = 1;
  let upper = records.length;
  let accesses = 0;
  let comparisons = 0;
  const steps = [];

  steps.push({
    type: 'start',
    lower,
    upper,
    accesses,
    comparisons,
    description: `Archivo ordenado con ${records.length} registros. Intervalo de búsqueda inicial: posición ${lower} .. ${upper}. El objetivo es reducir los accesos al disco: en cada paso solo se lee el bloque de la posición central.`,
  });

  while (lower <= upper) {
    const middle = Math.floor((lower + upper) / 2);
    const record = records[middle - 1];
    const block = blockOf(middle, blockSize) + 1;
    accesses += 1;
    comparisons += 1;

    const cmp = Number(target) < Number(record.key) ? -1 : Number(target) > Number(record.key) ? 1 : 0;
    const nextLower = cmp > 0 ? middle + 1 : lower;
    const nextUpper = cmp < 0 ? middle - 1 : upper;

    steps.push({
      type: 'compare',
      lower,
      upper,
      middle,
      block,
      value: record.key,
      accesses,
      comparisons,
      found: cmp === 0,
      nextLower,
      nextUpper,
      description: cmp === 0
        ? `Posición inicial ${lower}, final ${upper}. Posición central ${middle} → se lee el BLOQUE ${block} (acceso ${accesses}) y se consulta el registro ${record.key} (${record.name}). ${target} == ${record.key}: COINCIDE.`
        : `Posición inicial ${lower}, final ${upper}. Posición central ${middle} → se lee el BLOQUE ${block} (acceso ${accesses}) y se consulta el registro ${record.key} (${record.name}). ${target} ${cmp < 0 ? '<' : '>'} ${record.key}: se descarta la mitad ${cmp < 0 ? 'derecha' : 'izquierda'} y queda el intervalo ${nextLower} .. ${nextUpper}.`,
    });

    if (cmp === 0) {
      return { found: true, position: middle, block, accesses, comparisons, steps };
    }
    lower = nextLower;
    upper = nextUpper;
  }

  steps.push({
    type: 'notfound',
    lower,
    upper,
    accesses,
    comparisons,
    description: `El intervalo quedó vacío: la clave ${target} no se encuentra en el archivo (${accesses} accesos, ${comparisons} comparaciones).`,
  });
  return { found: false, position: null, block: null, accesses, comparisons, steps };
}