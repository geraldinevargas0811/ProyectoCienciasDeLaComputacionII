const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function keyInfo(letter) {
  const key = String(letter ?? '').trim().toUpperCase();
  const value = ALPHABET.indexOf(key) + 1;
  if (!value) return null;
  return { key, value, binary: value.toString(2).padStart(5, '0') };
}

export function parseKeys(input) {
  const compact = String(input ?? '').toUpperCase().replace(/[^A-Z]/g, '');
  return [...compact];
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const edge = (node, label, bitIndex) => ({ node, label, bitIndex });
const leaf = (info, id) => ({ id, kind: 'key', ...info, children: {} });
const link = (id) => ({ id, kind: 'link', children: {} });

function insertDigital(root, info) {
  if (!root) return { tree: leaf(info, 'r'), details: ['La primera clave ocupa directamente la raíz.'], path: ['r'] };
  let node = root; let start = 0; const path = [node.id]; const details = [];
  while (true) {
    if (node.key === info.key) return { tree: root, duplicate: true, details: [`${info.key} ya existe en el árbol.`], path };
    let bitIndex = start;
    while (bitIndex < 5 && node.binary[bitIndex] === info.binary[bitIndex]) bitIndex += 1;
    if (bitIndex === 5) return { tree: root, duplicate: true, details: [`${info.key} ya existe en el árbol.`], path };
    const bit = info.binary[bitIndex]; const side = bit === '0' ? 'izquierda' : 'derecha'; const token = `${bitIndex}:${bit}`;
    details.push(`Comparar con ${node.key}: el primer bit diferente es el ${bitIndex + 1}; ${bit} → ${side}.`);
    const current = node.children[token];
    if (!current) {
      const child = leaf(info, `${node.id}.${token}`);
      node.children[token] = edge(child, `b${bitIndex + 1}=${bit}`, bitIndex);
      path.push(child.id); details.push(`Se crea el nodo con clave ${info.key}.`);
      return { tree: root, details, path };
    }
    node = current.node; start = current.bitIndex + 1; path.push(node.id);
  }
}

function chunks(binary, width) {
  const result = [];
  for (let index = 0; index < binary.length; index += width) result.push(binary.slice(index, index + width));
  return result;
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
      const connector = link(previous.id);
      node.children[group] = edge(connector, group, level * width);
      node = connector; path.push(connector.id);
      details.push(`Colisión con ${previous.key}: ambas claves comparten ${group}. Se crea un nodo de enlace vacío y se compara el siguiente ${width === 1 ? 'bit' : 'grupo'}.`);
      let placed = false;
      for (let next = level + 1; next < groups.length; next += 1) {
        const oldGroup = chunks(previous.binary, width)[next]; const newGroup = groups[next];
        if (oldGroup === newGroup) {
          const common = link(`${connector.id}.${oldGroup}`);
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

export function buildSimulation(keys, type, m = 1) {
  const width = type === 'multiple' ? m : 1;
  let tree = type === 'digital' ? null : link('r');
  const accepted = []; const steps = [];
  keys.forEach((key) => {
    const info = keyInfo(key);
    const result = type === 'digital' ? insertDigital(tree, info) : insertResidue(tree, info, width);
    tree = result.tree;
    if (!result.duplicate) accepted.push(info);
    steps.push({ info, tree: clone(tree), path: result.path, details: result.details, duplicate: result.duplicate, order: accepted.length });
  });
  return { tree, steps, accepted, width };
}

export function searchTree(tree, target, type, m = 1) {
  const info = keyInfo(target); if (!info || !tree) return { found: false, steps: [] };
  const width = type === 'multiple' ? m : 1; const steps = []; let node = tree; let start = 0;
  if (type !== 'digital') {
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
    let bitIndex = start; while (bitIndex < 5 && node.binary[bitIndex] === info.binary[bitIndex]) bitIndex += 1;
    if (bitIndex === 5) break;
    const bit = info.binary[bitIndex]; const token = `${bitIndex}:${bit}`; const next = node.children[token];
    steps.push({ path: [node.id, next?.node.id].filter(Boolean), text: `Bit ${bitIndex + 1} = ${bit}: ${next ? `continuar por ${bit === '0' ? 'izquierda' : 'derecha'}.` : 'rama inexistente.'}` });
    if (!next) break; start = next.bitIndex + 1; node = next.node;
  }
  return { found: false, info, steps };
}
