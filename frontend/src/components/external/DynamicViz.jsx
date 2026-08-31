// Visualización del directorio dinámico (expansiones / reducciones):
// una columna por cubeta con sus registros y un indicador de ocupación.
export default function DynamicViz({ buckets, activeBucket, reason }) {
  const total = buckets.flat().length;
  return <div className="dynamic-dir">
    {buckets.map((block, index) => {
      const bucketNumber = index + 1;
      const active = activeBucket === bucketNumber;
      return <div key={bucketNumber} className={`dynamic-bucket${active ? ' dynamic-bucket--active' : ''}`}>
        <span className="dynamic-bucket__id">C{index + 1}</span>
        <div className="dynamic-bucket__slots">
          {block.map((key, si) => <span key={`${key}-${si}`} className="dynamic-bucket__slot">{key}</span>)}
          {block.length === 0 && <span className="dynamic-bucket__slot dynamic-bucket__slot--empty">·</span>}
        </div>
        <span className="dynamic-bucket__load">
          {block.length === 0 ? 0 : Math.round((block.length / (total / buckets.length || 1)) * 100)}%
        </span>
      </div>;
    })}
    {reason && <div className="dynamic-reason">{reason}</div>}
  </div>;
}