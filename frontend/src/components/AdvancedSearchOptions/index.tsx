import {useState} from 'react';

interface AdvancedSearchOptionsProps {
  threshold: number;
  onThresholdChange: (val: number) => void;
  limit: number;
  onLimitChange: (val: number) => void;
  labelClassName?: string;
}

export const AdvancedSearchOptions = ({ threshold, onThresholdChange, limit, onLimitChange, labelClassName }: AdvancedSearchOptionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <label className={labelClassName} style={{ marginBottom: 0 }}>Search Query:</label>
        <button 
          type="button" 
          className="win95-btn" 
          style={{ padding: '2px 5px', fontSize: '0.85em' }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '▲ Hide Advanced' : '▼ Advanced'}
        </button>
      </div>

      {isOpen && (
        <div className="win95-border" style={{ padding: '8px 12px', marginTop: '5px', marginBottom: '10px', backgroundColor: '#dfdfdf' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className={labelClassName} style={{ marginBottom: 0, fontSize: '0.9em' }}>
              Match Threshold: <span style={{ fontWeight: 'bold' }}>{Math.round(threshold * 100)}%</span>
            </label>
            <span 
              title="Determines how strict the semantic matching should be. Higher values return fewer, more precise results. Lower values return more results, but they may be less relevant." 
              style={{ cursor: 'help', display: 'inline-block', backgroundColor: '#000080', color: 'white', borderRadius: '50%', width: '16px', height: '16px', textAlign: 'center', lineHeight: '16px', fontSize: '0.75em', fontWeight: 'bold' }}
            >
              i
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.99"
            step="0.01"
            value={threshold}
            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
            className="win95-slider"
            style={{ width: '100%', marginTop: '6px', height: '15px' }}
          />
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className={labelClassName} style={{ marginBottom: 0, fontSize: '0.9em' }}>
              Max Results:
            </label>
            <select 
              className="win95-inset win95-input" 
              value={limit} 
              onChange={(e) => onLimitChange(Number(e.target.value))}
              style={{ padding: '2px', fontSize: '0.9em', width: '80px', height: '24px' }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      )}
    </>
  );
};
