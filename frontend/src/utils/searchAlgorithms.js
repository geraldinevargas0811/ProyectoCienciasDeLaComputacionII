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
