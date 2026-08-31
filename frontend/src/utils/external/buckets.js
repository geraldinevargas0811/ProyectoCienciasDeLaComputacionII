// CUBETAS — archivo hasheado organizado en áreas llamadas cubetas.
//
// Modelo (según las notas del profesor):
//  - El archivo se divide en áreas llamadas cubetas.
//  - Cada cubeta está formada por cero, uno o más registros.
//  - El número de cubetas lo determina el método (tamaño M del directorio).
//  - No hay límite fijo de registros por cubeta; cuando una cubeta se llena,
//    se enlaza un bloque de desbordamiento (desbordamiento).
//
// Cada cubeta se representa como: { blocks: [ [clave,...], [clave], ... ] }
// donde blocks[0] es el bloque principal y los demás son bloques de
// desbordamiento enlazados. El desplazamiento/recorrido dentro de la cubeta
// se muestra paso a paso y cada bloque leído cuenta como un acceso a disco.

import { hashKey } from './hashFunctions';

/** Copia profunda del directorio de cubetas para congelar el estado de cada paso. */
export function cloneDirectory(directory) {
  return directory.map((cubeta) => cubeta.blocks.map((block) => [...block]));
}

/** Construye el archivo de cubetas insertando las claves una a una. */
export function buildBucketFile({ keys, size, capacity = 2, hashFunction = 'modulo' }) {
  const M = size;
  const C = capacity;
  const directory = Array.from({ length: M }, () => ({ blocks: [[]] }));
  const collisions = [];
  const steps = [];
  const snapshot = () => cloneDirectory(directory);

  steps.push({
    type: 'init',
    directory: snapshot(),
    accesses: 0,
    collisions: 0,
    description: `Directorio con ${M} cubetas. Cada cubeta es un área del archivo con capacidad para ${C} registro(s) por bloque; cuando se llena se enlaza un bloque de desbordamiento para NO perder la clave (desbordamiento).`,
  });

  let accesses = 0;
  keys.forEach((key) => {
    const calc = hashKey(key, M, hashFunction);
    const cubeta = directory[calc.position - 1];
    const last = cubeta.blocks[cubeta.blocks.length - 1];

    if (last.length >= C) {
      // Desbordamiento: se agrega un bloque enlazado con la clave.
      accesses += 1;
      cubeta.blocks.push([String(key)]);
      collisions.push({
        key: String(key),
        position: calc.position,
        calc: calc.text,
        strategy: 'Desbordamiento: bloque de desbordamiento enlazado a la cubeta',
        partners: [...cubeta.blocks.flat()].filter((k) => k !== String(key)),
      });
      steps.push({
        type: 'insert',
        key: String(key),
        position: calc.position,
        overflow: true,
        accesses,
        collisions: collisions.length,
        directory: snapshot(),
        description: `Clave ${key} → cubeta ${calc.position} (${calc.text}). La cubeta ya estaba llena: DESBORDAMIENTO, se enlaza un bloque adicional para almacenarla.`,
      });
      return;
    }

    accesses += 1;
    last.push(String(key));
    steps.push({
      type: 'insert',
      key: String(key),
      position: calc.position,
      overflow: false,
      accesses,
      collisions: collisions.length,
      directory: snapshot(),
      description: `Clave ${key} → cubeta ${calc.position} (${calc.text}). Se almacena en la cubeta ${calc.position} (bloque actual: ${last.length}/${C}).`,
    });
  });

  steps.push({
    type: 'done',
    directory: snapshot(),
    accesses,
    collisions: collisions.length,
    description: `Archivo de cubetas construido: ${keys.length} clave(s) ubicada(s) con ${accesses} acceso(s) y ${collisions.length} desbordamiento(s).`,
  });

  return { directory, steps, collisions, size: M, capacity: C, accesses };
}

/** Colisiones por posición a partir del directorio final. */
export function collisionsByPosition(directory) {
  return directory
    .map((cubeta, index) => ({ position: index + 1, keys: cubeta.blocks.flat() }))
    .filter((entry) => entry.keys.length > 1);
}

/** Busca una clave dentro del archivo de cubetas recorriendo la cubeta correcta. */
export function searchBucketFile(target, { directory, size, capacity, hashFunction }) {
  const M = size;
  const calc = hashKey(target, M, hashFunction);
  const p = calc.position;
  let accesses = 0;
  let comparisons = 0;
  const snapshot = () => cloneDirectory(directory);
  const steps = [];
  const cubeta = directory[p - 1];

  steps.push({
    type: 'start',
    position: p,
    accesses,
    comparisons,
    directory: snapshot(),
    description: `CLAVE → FUNCIÓN HASH → CUBETA: ${calc.text}. La clave ${target} debe localizarse en la CUBETA ${p}.`,
  });

  for (let bi = 0; bi < cubeta.blocks.length; bi += 1) {
    accesses += 1;
    const blockName = bi === 0 ? 'principal' : `de desbordamiento ${bi}`;
    steps.push({
      type: 'access',
      position: p,
      block: bi,
      accesses,
      comparisons,
      directory: snapshot(),
      description: `Acceso ${accesses} a disco: se lee el bloque ${blockName} de la CUBETA ${p}.`,
    });

    const block = cubeta.blocks[bi];
    for (let si = 0; si < block.length; si += 1) {
      comparisons += 1;
      if (String(block[si]) === String(target)) {
        return {
          found: true,
          position: p,
          block: bi === 0 ? 0 : bi,
          slot: si,
          accesses,
          comparisons,
          bucket: p,
          steps: [...steps, {
            type: 'found',
            position: p,
            block: bi,
            slot: si,
            accesses,
            comparisons,
            directory: snapshot(),
            description: `Comparación ${comparisons}: ${block[si]} == ${target}: COINCIDE. Clave encontrada en la CUBETA ${p}, bloque ${blockName}, posición ${si + 1} dentro del bloque.`,
          }],
        };
      }
      steps.push({
        type: 'compare',
        position: p,
        block: bi,
        slot: si,
        accesses,
        comparisons,
        directory: snapshot(),
        description: `Comparación ${comparisons}: ${block[si]} vs ${target}: no coincide, se continúa el desplazamiento dentro de la cubeta.`,
      });
    }
  }

  return {
    found: false,
    position: p,
    block: null,
    slot: null,
    accesses,
    comparisons,
    bucket: p,
    steps: [...steps, {
      type: 'notfound',
      position: p,
      accesses,
      comparisons,
      directory: snapshot(),
      description: `Se recorrió la CUBETA ${p} y sus bloques de desbordamiento (${accesses} accesos, ${comparisons} comparaciones): la clave ${target} no se encuentra en el archivo.`,
    }],
  };
}