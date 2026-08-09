export function MemoryCell({ index, value, hash }) {
  return <div className="memory-cell"><span className="memory-cell__index">{hash ? `#${index}` : index}</span><strong>{value}</strong>{hash && <small>posición {index}</small>}</div>;
}

export default function MemoryStructure({ values = [25, 83, 12, 47, 31], hash = false }) {
  return <div className={`memory-structure ${hash ? 'memory-structure--hash' : ''}`} aria-label="Representación visual de memoria">
    {values.map((value, index) => <MemoryCell key={index} index={index} value={value} hash={hash} />)}
  </div>;
}
