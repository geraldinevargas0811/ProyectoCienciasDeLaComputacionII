export default function DynamicViz({ buckets, activeBucket, reason }) {
  const maxSlots = Math.max(1, ...buckets.map((b) => b.length));
  const maxLoad = Math.max(1, ...buckets.map((b) => b.length));

  return (
    <div className="dynamic-table">
      <div className="dynamic-table__header">
        <span className="dynamic-table__label">Cubetas</span>
        <div className="dynamic-table__cols">
          {buckets.map((_, index) => {
            const n = index + 1;
            const active = activeBucket === n;
            return (
              <span
                key={n}
                className={`dynamic-table__col-id${active ? ' dynamic-table__col-id--active' : ''}`}
              >
                C{n}
              </span>
            );
          })}
        </div>
      </div>

      <div className="dynamic-table__body">
        {Array.from({ length: maxSlots }, (_, slotIndex) => (
          <div key={slotIndex} className="dynamic-table__row">
            <span className="dynamic-table__row-label">
              {slotIndex === 0 ? 'Registros' : ''}
            </span>
            <div className="dynamic-table__cols">
              {buckets.map((block, bIndex) => {
                const n = bIndex + 1;
                const key = block[slotIndex];
                const active = activeBucket === n;
                const isNew = key && slotIndex === block.length - 1 && active;
                return (
                  <span
                    key={n}
                    className={[
                      'dynamic-table__cell',
                      active && key ? 'dynamic-table__cell--active' : '',
                      isNew ? 'dynamic-table__cell--new' : '',
                      !key ? 'dynamic-table__cell--empty' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {key || '·'}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="dynamic-table__footer">
        <span className="dynamic-table__row-label">Ocupación</span>
        <div className="dynamic-table__cols">
          {buckets.map((block, index) => {
            const pct = Math.min(100, Math.round((block.length / maxLoad) * 100));
            const active = activeBucket === index + 1;
            return (
              <span
                key={index + 1}
                className={`dynamic-table__cell dynamic-table__cell--load${active ? ' dynamic-table__cell--load-active' : ''}`}
              >
                {block.length} ({pct}%)
              </span>
            );
          })}
        </div>
      </div>

      {reason && <div className="dynamic-reason">{reason}</div>}
    </div>
  );
}
