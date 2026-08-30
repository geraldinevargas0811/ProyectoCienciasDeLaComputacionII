const asNumber = (value) => Number(value);

export function isSortedAscending(values) {
  return values.every((value, index) => index === 0 || asNumber(values[index - 1]) <= asNumber(value));
}

export function sequentialSearch(values, key) {
  const steps = [];
  const target = asNumber(key);
  for (let index = 0; index < values.length; index += 1) {
    const found = asNumber(values[index]) === target;
    steps.push({ currentIndex: index, comparedIndices: [index], discardedIndices: Array.from({ length: index }, (_, position) => position), comparisons: index + 1, description: `Comparar la clave ${key} con la posición ${index} (${values[index]}).`, found });
    if (found) return { found: true, index, comparisons: index + 1, steps };
  }
  steps.push({ comparedIndices: [], discardedIndices: values.map((_, index) => index), comparisons: values.length, description: `Se recorrió toda la estructura y la clave ${key} no fue encontrada.`, found: false });
  return { found: false, index: null, comparisons: values.length, steps };
}

export function binarySearch(values, key) {
  const steps = [];
  const target = asNumber(key);
  let lower = 0; let upper = values.length - 1; let comparisons = 0;
  while (lower <= upper) {
    const middle = Math.floor((lower + upper) / 2);
    const middleValue = asNumber(values[middle]);
    comparisons += 1;
    const found = target === middleValue;
    const comparison = found ? 'equal' : target < middleValue ? 'less' : 'greater';
    const direction = found ? 'found' : comparison === 'less' ? 'left' : 'right';
    const nextLower = direction === 'right' ? middle + 1 : lower;
    const nextUpper = direction === 'left' ? middle - 1 : upper;
    steps.push({ lower, upper, nextLower, nextUpper, currentIndex: middle, middleValue: values[middle], comparison, direction, comparedIndices: [middle], discardedIndices: values.map((_, index) => index).filter((index) => index < lower || index > upper), comparisons, description: found ? `Inicio ${lower}, fin ${upper}, centro ${middle}, valor central ${values[middle]}. ${key} == ${values[middle]}: encontrado.` : `Inicio ${lower}, fin ${upper}, centro ${middle}, valor central ${values[middle]}. ${key} ${comparison === 'less' ? '<' : '>'} ${values[middle]}: continuar hacia la ${direction === 'left' ? 'izquierda' : 'derecha'} (rango ${nextLower}–${nextUpper}).`, found });
    if (found) return { found: true, index: middle, comparisons, steps };
    lower = nextLower; upper = nextUpper;
  }
  steps.push({ lower, upper, comparedIndices: [], discardedIndices: values.map((_, index) => index), comparisons, description: `El rango está agotado; la clave ${key} no fue encontrada.`, found: false });
  return { found: false, index: null, comparisons, steps };
}

function filledEntries(values) {
  return values.map((value, index) => ({ value, index })).filter((entry) => entry.value !== null);
}

function finalStructureAfterRemoval(values, removedIndex) {
  const next = [...values];
  next.splice(removedIndex, 1);
  next.push(null);
  return next;
}

export function sequentialDelete(values, key) {
  const steps = [];
  const target = asNumber(key);
  const entries = filledEntries(values);
  let removedIndex = null;
  for (let position = 0; position < entries.length; position += 1) {
    const { value, index } = entries[position];
    const found = asNumber(value) === target;
    steps.push({ currentIndex: index, discardedIndices: entries.slice(0, position).map((entry) => entry.index), comparisons: position + 1, description: `Buscar la clave ${key}: comparar con la celda ${index} (${value}).`, found, action: found ? 'found' : undefined, values: [...values] });
    if (found) { removedIndex = index; break; }
  }
  if (removedIndex !== null) {
    steps.push({ discardedIndices: [], comparisons: steps.length, description: `Clave ${key} encontrada en la celda ${removedIndex}: se elimina de la estructura.`, found: false, action: 'deleted', removedIndex, values: finalStructureAfterRemoval(values, removedIndex) });
    return { type: 'delete', found: true, index: removedIndex, comparisons: steps.length, steps };
  }
  steps.push({ discardedIndices: entries.map((entry) => entry.index), comparisons: steps.length + 1, description: `Se recorrió la estructura y la clave ${key} no fue encontrada: no hay nada que eliminar.`, found: false, action: 'notfound', values: [...values] });
  return { type: 'delete', found: false, index: null, comparisons: steps.length, steps };
}

export function binaryDelete(values, key) {
  const steps = [];
  const target = asNumber(key);
  const entries = filledEntries(values);
  let lower = 0; let upper = entries.length - 1; let comparisons = 0; let removedIndex = null;
  while (lower <= upper) {
    const middle = Math.floor((lower + upper) / 2);
    const { value, index } = entries[middle];
    const middleNumber = asNumber(value);
    comparisons += 1;
    const found = target === middleNumber;
    const comparison = found ? 'equal' : target < middleNumber ? 'less' : 'greater';
    const direction = found ? 'found' : comparison === 'less' ? 'left' : 'right';
    const nextLower = direction === 'right' ? middle + 1 : lower;
    const nextUpper = direction === 'left' ? middle - 1 : upper;
    const discardedIndices = entries.map((entry) => entry.index).filter((entryIndex) => entryIndex < lower || entryIndex > upper);
    steps.push({ lower, upper, currentIndex: index, middleValue: value, comparison, direction, discardedIndices, comparisons, description: found ? `Buscar la clave ${key}: la celda ${index} (${value}) coincide; posición encontrada.` : `Buscar la clave ${key}: la celda ${index} (${value}) ${comparison === 'less' ? 'es mayor' : 'es menor'}; continuar por la ${direction === 'left' ? 'izquierda' : 'derecha'}.`, found, action: found ? 'found' : undefined, values: [...values] });
    if (found) { removedIndex = index; break; }
    lower = nextLower; upper = nextUpper;
  }
  if (removedIndex !== null) {
    steps.push({ discardedIndices: [], comparisons, description: `Clave ${key} encontrada en la celda ${removedIndex}: se elimina de la estructura.`, found: false, action: 'deleted', removedIndex, values: finalStructureAfterRemoval(values, removedIndex) });
    return { type: 'delete', found: true, index: removedIndex, comparisons, steps };
  }
  steps.push({ discardedIndices: entries.map((entry) => entry.index), comparisons, description: `El rango está agotado y la clave ${key} no fue encontrada: no hay nada que eliminar.`, found: false, action: 'notfound', values: [...values] });
  return { type: 'delete', found: false, index: null, comparisons, steps };
}
