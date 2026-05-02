import React from 'react';
import '../assets/css/distribution.css';

const Distribution = () => {
  const items = [
    { id: 'A1', desc: 'Output batches' },
    { id: 'B2', desc: 'PDF generator' },
    { id: 'C3', desc: 'Archive' },
  ];

  return (
    <div className="dist-root">
      <header className="dist-header">
        <h1>Distribution</h1>
        <p className="dist-sub">Output & printing utilities (mock)</p>
      </header>

      <div className="dist-grid">
        {items.map((it) => (
          <div className="dist-card" key={it.id}>
            <div className="dist-id">{it.id}</div>
            <div className="dist-desc">{it.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Distribution;
