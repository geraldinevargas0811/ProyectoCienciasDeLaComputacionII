// ============================================================================
// ÁRBOLES DE HUFFMAN — lógica del algoritmo
// ============================================================================
// La implementación es determinista y totalmente trazable:
//   1. Se cuentan las frecuencias de cada carácter (se conserva el orden de
//      aparición del texto, sin mezclar mayúsculas/minúsculas).
//   2. Se ordena la lista de frecuencias de MENOR a MAYOR (empates se resuelven
//      por el orden de aparición/entrada en el texto).
//   3. En cada paso se toman las DOS frecuencias menores, se suman y el nodo
//      resultante se vuelve a incorporar a la lista respetando la frecuencia.
//   4. El proceso se repite hasta quedar un único nodo: la RAÍZ (frecuencia total).
//   5. Cada suma queda registrada como un paso independiente (con su nivel).
//   6. El árbol se construye con la estructura real (izquierda = 0, derecha = 1);
//      los códigos, la tabla, la codificación y las búsquedas se derivan de él.
// ============================================================================

let NODE_COUNTER = 0;

function nextId() {
  NODE_COUNTER += 1;
  return `h${NODE_COUNTER}`;
}

function resetCounter() {
  NODE_COUNTER = 0;
}

function probabilityOf(frequency, total) {
  return total > 0 ? frequency / total : 0;
}

function fraction(frequency, total) {
  return `${frequency}/${total}`;
}

// Nodo hoja: representa un carácter del alfabeto.
function makeLeaf(character, frequency, total, step) {
  return {
    id: nextId(),
    character,
    frequency,
    probability: probabilityOf(frequency, total),
    fraction: fraction(frequency, total),
    isLeaf: true,
    left: null,
    right: null,
    step,           // paso (visible) en el que aparece dentro del árbol
    code: null,     // se asigna tras recorrer el árbol
  };
}

// Nodo interno: combina dos nodos (izquierda = bit 0, derecha = bit 1).
function makeInternal(left, right, total, step) {
  const frequency = left.frequency + right.frequency;
  return {
    id: nextId(),
    character: null,
    frequency,
    probability: probabilityOf(frequency, total),
    fraction: fraction(frequency, total),
    isLeaf: false,
    left,
    right,
    step,
    code: null,
  };
}

// ----------------------------------------------------------------------------
// 1. FRECUENCIAS: cuenta cada carácter conservando el orden de aparición.
// ----------------------------------------------------------------------------
export function computeFrequencies(chars) {
  const map = new Map();
  chars.forEach((c) => map.set(c, (map.get(c) || 0) + 1));
  const list = [...map.entries()].map(([character, count]) => ({ character, count }));
  const total = chars.length;
  return {
    total,
    // orden de aparición original (frecuencias en bruto)
    raw: list.map(({ character, count }) => ({
      character, count, fraction: fraction(count, total), probability: probabilityOf(count, total),
    })),
    // ordenadas de menor a mayor; empates por orden de aparición. El sort de JS
    // es estable, por lo que los empates conservan el orden de `raw`.
    ordered: [...list].sort((a, b) => a.count - b.count).map(({ character, count }) => ({
      character, count, fraction: fraction(count, total), probability: probabilityOf(count, total),
    })),
  };
}

// ----------------------------------------------------------------------------
// 2. PROCESO DE SUMAS: construye el árbol paso a paso y registra cada operación.
// ----------------------------------------------------------------------------
export function buildHuffman(chars) {
  resetCounter();
  const freq = computeFrequencies(chars);
  const { total } = freq;

  // Forest inicial: una hoja por carácter (orden de aparición).
  const forest = freq.ordered.map((entry) => makeLeaf(entry.character, entry.count, total, 0));

  const sumSteps = [];
  let forestSnapshot = forest.map((n) => n);
  let stepOrder = 0;

  while (forest.length > 1) {
    // Se toman las dos frecuencias menores (orders estables: empates por creación).
    forest.sort((a, b) => a.frequency - b.frequency);
    const a = forest.shift();
    const b = forest.shift();
    stepOrder += 1;
    const parent = makeInternal(a, b, total, stepOrder);
    parent.left = a;
    parent.right = b;
    forest.push(parent);
    sumSteps.push({
      index: sumSteps.length,          // 0-based
      number: sumSteps.length + 1,     // paso visible (1-based)
      a: a.id, b: b.id, parent: parent.id,
      aText: `${fraction(a.frequency, total)} · ${a.character ?? 'nodo interno'}`,
      bText: `${fraction(b.frequency, total)} · ${b.character ?? 'nodo interno'}`,
      aFreq: a.frequency, bFreq: b.frequency,
      sumFreq: parent.frequency, sumFraction: parent.fraction,
      level: stepOrder,
      forest: forest.map((n) => ({ id: n.id, frequency: n.frequency, character: n.character })),
    });
    forestSnapshot = forest.map((n) => n);
  }

  const root = forest[0];

  // --------------------------------------------------------------------------
  // 3. ASIGNACIÓN DE CÓDIGOS: se recorre el árbol desde la raíz (0 = izquierda,
  //    1 = derecha) y cada hoja hereda el código del camino.
  // --------------------------------------------------------------------------
  const codes = new Map(); // character -> { code, path: [id...] }
  const assignCodes = (node, acc, path) => {
    if (node.isLeaf) {
      node.code = acc;
      codes.set(node.character, { character: node.character, code: acc, path: [...path, node.id] });
      return;
    }
    assignCodes(node.left, `${acc}0`, [...path, node.id]);
    assignCodes(node.right, `${acc}1`, [...path, node.id]);
  };
  if (root) {
    if (root.isLeaf) {
      // Caso especial: un único símbolo distinto. Se asigna un código mínimo
      // consistente ("0") para que el documento nunca quede vacío.
      root.code = '0';
      codes.set(root.character, { character: root.character, code: '0', path: [root.id] });
    } else {
      assignCodes(root, '', []);
    }
  }

  // Codificación del texto original (respeta exactamente el orden).
  const encodedChars = chars.map((c) => ({ character: c, code: codes.get(c)?.code ?? '' }));
  const encoded = encodedChars.map((e) => e.code).join('');

  const table = freq.ordered.map((entry) => ({
    character: entry.character,
    count: entry.count,
    fraction: entry.fraction,
    probability: entry.probability,
    code: codes.get(entry.character)?.code ?? '',
  }));

  // Ecuación final: se deriva directamente de la estructura combinada.
  const equation = buildEquation(root, total);

  return {
    chars,
    total,
    length: chars.length,
    initialBits: chars.length * 8,
    finalBits: encoded.length,
    savings: chars.length * 8 - encoded.length,
    reduction: chars.length * 8 > 0 ? ((chars.length * 8 - encoded.length) / (chars.length * 8)) * 100 : 0,
    frequencies: freq,
    rawFrequencies: freq.raw,
    orderedFrequencies: freq.ordered,
    sumSteps,
    tree: root,
    codes: [...codes.values()],
    table,
    encodedChars,
    encoded,
    equation,
  };
}

// ----------------------------------------------------------------------------
// 4. ECUACIÓN FINAL: representación textual de la agrupación de frecuencias.
// ----------------------------------------------------------------------------
function buildEquation(node, total) {
  if (!node) return '';
  if (node.isLeaf) {
    return `${node.character}(${fraction(node.frequency, total)})`;
  }
  return `(${buildEquation(node.left, total)} + ${buildEquation(node.right, total)})`;
}

// ----------------------------------------------------------------------------
// 5. BÚSQUEDA DE UN CARÁCTER: devuelve el recorrido (nodos + bits) usado para
//    llegar a la hoja, o indica que no existe.
// ----------------------------------------------------------------------------
export function searchCharacter(tree, character) {
  if (!tree) return { found: false, steps: [], code: '' };
  const path = findPath(tree, character);
  if (!path) {
    return { found: false, steps: [], code: '', text: `El carácter "${character}" no se encuentra en el árbol.` };
  }
  const nodeIds = path.nodeIds;
  const bits = path.bits;
  const steps = [];
  for (let i = 0; i < nodeIds.length - 1; i += 1) {
    steps.push({
      nodeIds: [nodeIds[i], nodeIds[i + 1]],
      text: `Bit ${bits[i]}: se toma la rama ${bits[i] === '0' ? 'izquierda (0)' : 'derecha (1)'}.`,
      bit: bits[i],
    });
  }
  const leaf = nodeIds[nodeIds.length - 1];
  steps.push({ nodeIds: [leaf], text: `Carácter encontrado: "${character}". Código Huffman: ${bits}.`, bit: null });
  return { found: true, steps, code: bits, path: nodeIds };
}

// Camino desde la raíz hasta la hoja del carácter (si existe).
function findPath(root, character) {
  const walk = (node, bits, ids) => {
    ids.push(node.id);
    if (node.isLeaf) {
      if (node.character === character) return { nodeIds: ids, bits: bits || '0' };
      ids.pop();
      return null;
    }
    const l = walk(node.left, `${bits}0`, ids);
    if (l) return l;
    if (node.right) {
      const r = walk(node.right, `${bits}1`, ids);
      if (r) return r;
    }
    ids.pop();
    return null;
  };
  return root ? walk(root, '', []) : null;
}

// ----------------------------------------------------------------------------
// 6. BÚSQUEDA DE UN TEXTO: codifica carácter por carácter usando el árbol real.
//    Devuelve también qué carácter (si alguno) no pertenece al alfabeto.
// ----------------------------------------------------------------------------
export function encodeText(tree, text) {
  const missing = [];
  const results = [...text].map((c) => {
    const found = findCharCode(tree, c);
    if (!found) missing.push(c);
    return { character: c, code: found ?? null, found: Boolean(found) };
  });
  const full = results.map((r) => r.code ?? '?').join('');
  return { results, missing: [...new Set(missing)], full, length: results.length, bits: full.length };
}

function findCharCode(root, character) {
  const walk = (node, bits) => {
    if (node.isLeaf) return node.character === character ? bits : null;
    return walk(node.left, `${bits}0`) || (node.right ? walk(node.right, `${bits}1`) : null);
  };
  return root ? walk(root, '') : null;
}

// ----------------------------------------------------------------------------
// 7. VALIDACIONES: comprueban la integridad del árbol y del proceso.
// ----------------------------------------------------------------------------
export function validateHuffman(result) {
  const errors = [];
  if (!result || !result.tree) { errors.push('No hay árbol construido.'); return { valid: false, errors }; }

  // Suma de frecuencias = longitud del texto.
  const freqSum = (result.orderedFrequencies || []).reduce((acc, f) => acc + f.count, 0);
  if (freqSum !== result.length) errors.push(`La suma de frecuencias (${freqSum}) no coincide con la longitud del texto (${result.length}).`);

  // Raíz con la frecuencia total (100%).
  if (result.tree.frequency !== result.length) errors.push(`La raíz tiene frecuencia ${result.tree.frequency} y debería ser ${result.length}.`);

  // Cada código es único y no vacío (salvo texto vacío).
  const seen = new Set();
  (result.table || []).forEach((row) => {
    if (!row.code) errors.push(`El carácter "${row.character}" no tiene código.`);
    if (seen.has(row.code)) errors.push(`El código "${row.code}" se repite.`);
    seen.add(row.code);
  });

  // Codificación final = concatenación de códigos individuales.
  if (result.encoded !== (result.encodedChars || []).map((e) => e.code).join('')) {
    errors.push('La codificación final no coincide con la concatenación de los códigos.');
  }

  // La sum de probabilidades debe ser 1 (100%).
  const probSum = (result.orderedFrequencies || []).reduce((acc, f) => acc + f.probability, 0);
  if (Math.abs(probSum - 1) > 1e-9) errors.push(`La suma de probabilidades es ${probSum.toFixed(4)} y debería ser 1.`);

  return { valid: errors.length === 0, errors };
}
