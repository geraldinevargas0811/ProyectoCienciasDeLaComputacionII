// BÚSQUEDAS DINÁMICAS POR TRANSFORMACIÓN DE CLAVES
//
// Modelo según las notas del profesor:
//  - EXPANSIONES TOTALES:  T = 2^c · N. Cada expansión duplica el número de
//    cubetas (N = cubetas iniciales, c = número de expansiones) y redistribuye
//    TODOS los registros.
//  - EXPANSIONES PARCIALES: T = (1.5)^c · N. La tabla crece en un factor ≈ 1.5
//    y solo se redistribuyen los registros de las cubetas saturadas; las demás
//    cubetas permanecen intactas.
//  - REDUCCIONES TOTALES Y PARCIALES: proceso contrario; ocurren cuando la
//    densidad de ocupación baja de un umbral. Permiten reducir la estructura
//    cuando ya no se necesitan tantas cubetas.
//
// La dirección de un registro se calcula como H(K) = (K mod M) + 1 sobre el
// tamaño vigente M del directorio. Los accesos a disco acumulan: 1 por
// inserción/eliminación y 2 por registro redistribuido (releer + reescribir).

const hashFor = (key, m) => (parseInt(key, 10) % m) + 1;
const countRecords = (buckets) => buckets.reduce((acc, b) => acc + b.length, 0);
const cloneBuckets = (buckets) => buckets.map((b) => [...b]);

/**
 * Ejecuta la simulación dinámica completa y devuelve los pasos.
 * @param {object} options
 *   keys           claves a insertar (en orden).
 *   initial        número inicial de cubetas N.
 *   mode           'total' | 'partial' (tipo de expansión/reducción).
 *   high           umbral de densidad que dispara la expansión.
 *   low            umbral de densidad que dispara la reducción.
 *   reduce         true → después de insertar elimina claves para provocar reducciones.
 */
export function runDynamicSim({ keys, initial, mode = 'total', high = 0.75, low = 0.4, reduce = false }) {
  let M = initial;
  let expansions = 0;
  let buckets = Array.from({ length: M }, () => []);
  let accesses = 0;
  const steps = [];
  const snapshot = () => cloneBuckets(buckets);
  const density = () => countRecords(buckets) / M;
  const formula = mode === 'total' ? 'T = 2^c · N' : 'T ≈ (1.5)^c · N';

  steps.push({
    kind: 'init',
    M,
    c: 0,
    accesses,
    buckets: snapshot(),
    density: density().toFixed(2),
    description: `Directorio inicial: N = ${M} cubetas vacías. Modelo de referencia: ${formula}. Cada inserción genera un acceso a disco y la densidad = registros / cubetas se observa en todo momento.`,
  });

  // EXPANSIÓN: duplica (total) o crece ≈1.5 veces (parcial) el directorio.
  const expand = () => {
    const before = countRecords(buckets);
    const beforeAccesses = accesses;
    const Mfrom = M;
    let moved = 0;
    let kept = 0;

    if (mode === 'total') {
      // Se duplican las cubetas y se redistribuyen TODOS los registros.
      const all = buckets.flat();
      buckets = Array.from({ length: M * 2 }, () => []);
      all.forEach((key) => { buckets[hashFor(key, M * 2) - 1].push(key); });
      moved = all.length;
      M *= 2;
      expansions += 1;
    } else {
      // Solo se redistribuyen los registros de las cubetas saturadas.
      const average = before / M;
      const newM = Math.max(M + 1, Math.round(M * 1.5));
      const next = Array.from({ length: newM }, () => []);
      const toMove = [];
      buckets.forEach((block, index) => {
        if (block.length > average) {
          toMove.push(...block);
          moved += block.length;
        } else {
          next[index] = [...block];
          kept += 1;
        }
      });
      toMove.forEach((key) => { next[hashFor(key, newM) - 1].push(key); });
      buckets = next;
      M = newM;
      expansions += 1;
    }

    accesses += 2 * before;
    steps.push({
      kind: 'expansion',
      mode,
      c: expansions,
      Mfrom,
      Mto: M,
      moved,
      kept,
      accesses,
      accessBefore: beforeAccesses,
      buckets: snapshot(),
      density: density().toFixed(2),
      description: mode === 'total'
        ? `EXPANSIÓN TOTAL: la densidad alcanzó el umbral (${high}). T = 2^${expansions} · ${initial} = ${M} cubetas: se duplica el directorio y se redistribuyen TODOS los registros (${before}). Accesos: ${beforeAccesses} antes → ${accesses} después (la redistribución relee y reescribe cada registro).`
        : `EXPANSIÓN PARCIAL: la densidad alcanzó el umbral (${high}). T ≈ (1.5)^${expansions} · ${initial} ≈ ${M} cubetas: el directorio crece ~50% pero SOLO se redistribuyen los registros de las cubetas saturadas (${moved}); ${kept} cubeta(s) permanecen intactas. Accesos: ${beforeAccesses} antes → ${accesses} después.`,
    });
  };

  // REDUCCIÓN: proceso contrario a la expansión.
  const reduceFile = () => {
    if (M <= initial) return;
    const before = countRecords(buckets);
    const beforeAccesses = accesses;
    const Mfrom = M;
    let moved = 0;
    let kept = 0;

    if (mode === 'total') {
      // Se reduce a la mitad y se redistribuyen todos los registros.
      const half = Math.floor(M / 2);
      const all = buckets.flat();
      buckets = Array.from({ length: half }, () => []);
      all.forEach((key) => { buckets[hashFor(key, half) - 1].push(key); });
      moved = all.length;
      M = half;
    } else {
      // Se reduce ≈ 1/1.5 y se reorganizan solo las cubetas poco ocupadas.
      const average = before / M;
      const newM = Math.max(initial, Math.round(M / 1.5));
      if (newM >= M) return;
      const next = Array.from({ length: newM }, () => []);
      const toMove = [];
      buckets.forEach((block, index) => {
        if (block.length <= average) {
          toMove.push(...block);
          moved += block.length;
        } else {
          next[index] = [...block];
          kept += 1;
        }
      });
      toMove.forEach((key) => { next[hashFor(key, newM) - 1].push(key); });
      buckets = next;
      M = newM;
    }

    expansions = Math.max(0, expansions - 1);
    accesses += 2 * before;
    steps.push({
      kind: 'reduction',
      mode,
      c: expansions,
      Mfrom,
      Mto: M,
      moved,
      kept,
      accesses,
      accessBefore: beforeAccesses,
      buckets: snapshot(),
      density: density().toFixed(2),
      description: mode === 'total'
        ? `REDUCCIÓN TOTAL: la densidad bajó del umbral (${low}). El directorio se reduce a la mitad (${Mfrom} → ${M} cubetas) y todos los registros (${before}) se redistribuyen. Accesos: ${beforeAccesses} antes → ${accesses} después. Es el proceso contrario a una expansión total.`
        : `REDUCCIÓN PARCIAL: la densidad bajó del umbral (${low}). El directorio se reduce ≈ 1/1.5 (${Mfrom} → ${M}) y SOLO se reorganizan los registros de las cubetas poco ocupadas (${moved}); ${kept} cubeta(s) permanecen. Accesos: ${beforeAccesses} antes → ${accesses} después. Es el proceso contrario a una expansión parcial.`,
    });
  };

  keys.forEach((key) => {
    const position = hashFor(key, M);
    buckets[position - 1].push(String(key));
    accesses += 1;
    const currentDensity = density();
    steps.push({
      kind: 'insert',
      key: String(key),
      position,
      M,
      c: expansions,
      accesses,
      buckets: snapshot(),
      density: currentDensity.toFixed(2),
      description: `Clave ${key}: H(K) = (K mod ${M}) + 1 = ${position}. Se almacena en la Cubeta ${position}. Densidad actual: ${currentDensity.toFixed(2)}.`,
    });
    if (currentDensity >= high) expand();
  });

  if (reduce) {
    // Elimina claves (las de posición impar de la lista) para provocar las
    // reducciones y demostrar el proceso contrario a la expansión.
    steps.push({
      kind: 'note',
      M,
      c: expansions,
      accesses,
      buckets: snapshot(),
      density: density().toFixed(2),
      description: `Para demostrar las REDUCCIONES se eliminarán registros del archivo hasta que la densidad baje del umbral (${low}).`,
    });
    const removable = keys.filter((_, index) => index % 2 === 1);
    removable.forEach((key) => {
      let removed = false;
      buckets = buckets.map((block) => {
        const i = block.indexOf(String(key));
        if (i >= 0) { block.splice(i, 1); removed = true; }
        return block;
      });
      if (!removed) return;
      accesses += 1;
      const currentDensity = density();
      steps.push({
        kind: 'remove',
        key: String(key),
        M,
        c: expansions,
        accesses,
        buckets: snapshot(),
        density: currentDensity.toFixed(2),
        description: `Se elimina la clave ${key} del archivo. Densidad actual: ${currentDensity.toFixed(2)}.`,
      });
      if (currentDensity <= low) reduceFile();
    });
  }

  return {
    steps,
    result: {
      M,
      c: expansions,
      records: countRecords(buckets),
      accesses,
      buckets: snapshot(),
    },
  };
}