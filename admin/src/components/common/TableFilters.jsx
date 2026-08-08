import StatusFilterDropdown from './StatusFilterDropdown';

export default function TableFilters({
  search,
  onSearch,
  status,
  onStatus,
  statusOptions,
  searchPlaceholder = 'Search...',
  statusPlaceholder = 'All statuses',
  secondaryValue,
  onSecondaryChange,
  secondaryOptions,
  secondaryPlaceholder = 'All statuses',
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 420 }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          style={{ paddingLeft: 42 }}
        />
      </div>
      {statusOptions && statusOptions.length > 0 && (
        <StatusFilterDropdown
          value={status}
          onChange={onStatus}
          options={statusOptions}
          placeholder={statusPlaceholder}
        />
      )}
      {secondaryOptions && secondaryOptions.length > 0 && (
        <StatusFilterDropdown
          value={secondaryValue}
          onChange={onSecondaryChange}
          options={secondaryOptions}
          placeholder={secondaryPlaceholder}
        />
      )}
      {(search || status || secondaryValue) && (
        <button onClick={() => { onSearch(''); onStatus(''); if (onSecondaryChange) onSecondaryChange(''); }} className="button-secondary" style={{ padding: '12px 16px' }}>
          Clear
        </button>
      )}
    </div>
  );
}
