const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BITS = 5;

export function keyInfo(letterOrNumber) {
  const raw = String(letterOrNumber ?? '').trim();
  if (/^\d+$/.test(raw)) {
    // Claves numéricas (transformación por claves): el valor "ABC" es el propio número.
    const value = Number(raw);
    return { key: raw, value, binary: value.toString(2).padStart(BITS, '0') };
  }
  const key = raw.toUpperCase();
  const value = ALPHABET.indexOf(key) + 1;
  if (!value) return null;
  return { key, value, binary: value.toString(2).padStart(BITS, '0') };
}

export function parseKeys(input) {
  const compact = String(input ?? '').toUpperCase().replace(/[^A-Z]/g, '');
  return [...compact];
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const edge = (node, label, bitIndex) => ({ node, label, bitIndex });
const leaf = (info, id) => ({ id, kind: 'key', ...info, children: {} });
const link = (id) => ({ id, kind: 'link', children: {} });

function firstDifferingBit(a, b) {
  for (let i = 0; i < BITS; i += 1) if (a[i] !== b[i]) return i;
  return -1;
}

// Árbol de búsqueda digital: la primera clave es la raíz; cada nodo tiene como máximo
// dos hijos (izquierda = 0, derecha = 1) y cada arista se etiqueta únicamente con el bit.
// Al comparar una clave nueva con un nodo se toma el primer bit donde difieren para decidir
// la dirección; si la rama está ocupada, se desciende y se repite (colisión → siguiente bit).
function insertDigital(root, info) {
  if (!root) return { tree: leaf(info, 'r'), details: ['La primera clave ocupa la raíz.'], path: ['r'] };
  let node = root; const path = [node.id]; const details = [];
  while (true) {
    if (node.key === info.key) return { tree: root, duplicate: true, details: [`${info.key} ya existe en el árbol.`], path };
    const bitIndex = firstDifferingBit(node.binary, info.binary);
    if (bitIndex === -1) return { tree: root, duplicate: true, details: [`${info.key} ya existe en el árbol.`], path };
    const bit = info.binary[bitIndex]; const side = bit === '0' ? 'izquierda' : 'derecha';
    details.push(`Comparar ${info.key} con ${node.key}: el primer bit distinto es el ${bitIndex + 1}; ${bit} → rama ${side}.`);
    const current = node.children[bit];
    if (!current) {
      const child = leaf(info, `${node.id}.${bit}`);
      node.children[bit] = edge(child, bit, bitIndex);
      path.push(child.id);
      details.push(`Rama ${side} (bit ${bitIndex + 1} = ${bit}) libre: se inserta ${info.key}.`);
      return { tree: root, details, path };
    }
    details.push(`Rama ${side} ocupada: continuar con el siguiente bit.`);
    node = current.node; path.push(node.id);
  }
}

// Niveles de decisión para residuos múltiples: se agrupan los 5 bits en bloques de m bits;
// el último bloque puede quedar de un solo bit, que se resuelve como decisión 0/1 final.
function multipleLevels(m) {
  const levels = []; let remaining = BITS;
  while (remaining > 0) { const w = Math.min(m, remaining); levels.push(w); remaining -= w; }
  return levels;
}

function branchLabels(w) {
  const count = 2 ** w; const labels = [];
  for (let i = 0; i < count; i += 1) labels.push(i.toString(2).padStart(w, '0'));
  return labels;
}

function keyGroup(binary, levelIndex, levels) {
  let start = 0;
  for (let i = 0; i < levelIndex; i += 1) start += levels[i];
  return binary.slice(start, start + levels[levelIndex]);
}

// Estructura completa de residuos múltiples: se crean YA TODAS las ramas posibles de cada
// nivel (m=2 → 4 ramas 00,01,10,11; m=3 → 8), de modo que se visualicen aunque no tengan
// claves. Los nodos vacíos son enlaces; las claves se colocan al final de su recorrido.
function buildMultipleSkeleton(m) {
  const levels = multipleLevels(m);
  const root = link('r');
  const addChildren = (node, depth) => {
    if (depth >= levels.length) return;
    branchLabels(levels[depth]).forEach((label) => {
      const child = link(`${node.id}.${label}`);
      node.children[label] = edge(child, label, depth);
      addChildren(child, depth + 1);
    });
  };
  addChildren(root, 0);
  return root;
}

function insertMultipleKey(root, info, m) {
  const levels = multipleLevels(m);
  let node = root; const path = [node.id]; const details = [];
  for (let i = 0; i < levels.length; i += 1) {
    const group = keyGroup(info.binary, i, levels);
    const isBinary = levels[i] === 1;
    const side = isBinary ? (group === '0' ? 'izquierda' : 'derecha') : `grupo ${group}`;
    const isLast = i === levels.length - 1;
    if (!isLast) {
      details.push(`${isBinary ? `Bit ${group}` : `Grupo ${group}`} → ${side}: se atraviesa el enlace vacío.`);
    } else {
      details.push(`Decisión final 0/1: ${group} → ${side}. Posición libre: se inserta ${info.key}.`);
    }
    node = node.children[group].node; path.push(node.id);
  }
  if (node.kind === 'key') return { tree: root, duplicate: true, details: [`${info.key} ya existe en el árbol.`], path };
  node.key = info.key; node.kind = 'key';
  return { tree: root, details, path };
}

function insertResidue(root, info, width) {
  const groups = chunks(info.binary, width); let node = root; const path = [root.id]; const details = [];
  for (let level = 0; level < groups.length; level += 1) {
    const group = groups[level]; const side = width === 1 ? (group === '0' ? 'izquierda' : 'derecha') : `rama ${group}`;
    const current = node.children[group];
    if (!current) {
      const child = leaf(info, `${node.id}.${group}`);
      node.children[group] = edge(child, group, level * width);
      path.push(child.id); details.push(`Grupo ${group} → ${side}. Posición libre: se almacena ${info.key}.`);
      return { tree: root, details, path };
    }
    if (current.node.kind === 'key') {
      if (current.node.key === info.key) return { tree: root, duplicate: true, details: [`${info.key} ya existe en el árbol.`], path };
      const previous = current.node;
      const connector = link(`${node.id}.${group}.e`);
      node.children[group] = edge(connector, group, level * width);
      node = connector; path.push(connector.id);
      details.push(`Colisión con ${previous.key}: ambas claves comparten ${group}. Se crea un nodo de enlace vacío y se compara el siguiente ${width === 1 ? 'bit' : 'grupo'}.`);
      let placed = false;
      for (let next = level + 1; next < groups.length; next += 1) {
        const oldGroup = chunks(previous.binary, width)[next]; const newGroup = groups[next];
        if (oldGroup === newGroup) {
          const common = link(`${node.id}.${oldGroup}`);
          node.children[oldGroup] = edge(common, oldGroup, next * width); node = common; path.push(common.id);
          details.push(`El grupo ${newGroup} coincide; el enlace permanece vacío y se continúa.`);
        } else {
          node.children[oldGroup] = edge(previous, oldGroup, next * width);
          const child = leaf(info, `${node.id}.${newGroup}`);
          node.children[newGroup] = edge(child, newGroup, next * width); path.push(child.id);
          details.push(`Los grupos difieren: ${previous.key} → ${oldGroup}; ${info.key} → ${newGroup}. Se separan las ramas.`);
          placed = true; break;
        }
      }
      if (!placed) return { tree: root, duplicate: true, details: [`${info.key} ya existe en el árbol.`], path };
      return { tree: root, details, path };
    }
    details.push(`Grupo ${group} → ${side}. Se atraviesa un nodo de enlace vacío.`);
    node = current.node; path.push(node.id);
  }
  return { tree: root, duplicate: true, details: [`${info.key} ya existe en el árbol.`], path };
}

function chunks(binary, width) {
  const result = [];
  for (let index = 0; index < binary.length; index += width) result.push(binary.slice(index, index + width));
  return result;
}

export function buildSimulation(keys, type, m = 1) {
  let tree;
  let width = 1;
  if (type === 'multiple') { width = m; tree = buildMultipleSkeleton(m); }
  else if (type === 'residue') { tree = link('r'); }
  else { tree = null; }
  const accepted = []; const steps = [];
  keys.forEach((key) => {
    const info = keyInfo(key);
    const result = type === 'digital' ? insertDigital(tree, info)
      : type === 'multiple' ? insertMultipleKey(tree, info, m)
      : insertResidue(tree, info, width);
    tree = result.tree;
    if (!result.duplicate) accepted.push(info);
    steps.push({ info, tree: clone(tree), path: result.path, details: result.details, duplicate: result.duplicate, order: accepted.length });
  });
  return { tree, steps, accepted, width };
}

function searchMultiple(tree, info, m) {
  const levels = multipleLevels(m); const target = info.binary;
  const steps = []; let node = tree;
  for (let i = 0; i < levels.length; i += 1) {
    if (node.kind === 'key') {
      steps.push({ path: [node.id], text: `Se llega a ${node.key}: ${node.key === info.key ? 'clave encontrada.' : 'la clave no coincide.'}` });
      return { found: node.key === info.key, info, steps };
    }
    const group = keyGroup(target, i, levels); const next = node.children[group];
    steps.push({ path: [node.id, next?.node.id].filter(Boolean), text: `${levels[i] === 1 ? `Bit ${group}` : `Grupo ${group}`}: ${next ? 'seguir la rama seleccionada.' : 'la rama no existe.'}` });
    if (!next) return { found: false, info, steps };
    node = next.node;
  }
  return { found: node.kind === 'key' && node.key === info.key, info, steps };
}

export function searchTree(tree, target, type, m = 1) {
  const info = keyInfo(target); if (!info || !tree) return { found: false, steps: [] };
  if (type === 'multiple') return searchMultiple(tree, info, m);
  const width = type === 'residue' ? 1 : 1; const steps = []; let node = tree;
  if (type === 'residue') {
    const groups = chunks(info.binary, width);
    for (let level = 0; level < groups.length; level += 1) {
      if (node.kind === 'key') {
        steps.push({ path: [node.id], text: `Se llega a ${node.key}: ${node.key === info.key ? 'clave encontrada.' : 'la clave no coincide.'}` });
        return { found: node.key === info.key, info, steps };
      }
      const group = groups[level]; const next = node.children[group];
      steps.push({ path: [node.id, next?.node.id].filter(Boolean), text: `Grupo ${group}: ${next ? 'seguir la rama seleccionada.' : 'la rama no existe.'}` });
      if (!next) return { found: false, info, steps };
      node = next.node;
    }
    return { found: node.kind === 'key' && node.key === info.key, info, steps };
  }
  while (node) {
    if (node.key === info.key) { steps.push({ path: [node.id], text: `Se llega a ${node.key}: clave encontrada.` }); return { found: true, info, steps }; }
    // Se compara desde el primer bit (igual que en la construcción), no desde el bit
    // de la arista por la que se entró, para no saltarse diferencias en bits previos.
    let bitIndex = firstDifferingBit(node.binary, info.binary);
    if (bitIndex === -1) break;
    const bit = info.binary[bitIndex]; const token = bit; const next = node.children[token];
    steps.push({ path: [node.id, next?.node.id].filter(Boolean), text: `Bit ${bitIndex + 1} = ${bit}: ${next ? `continuar por ${bit === '0' ? 'izquierda' : 'derecha'}.` : 'rama inexistente.'}` });
    if (!next) break;
    node = next.node;
  }
  return { found: false, info, steps };
}
