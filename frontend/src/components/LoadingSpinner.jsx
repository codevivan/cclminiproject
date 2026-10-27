export const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="page-loader">
      <div className="big-spinner" role="status" aria-label="Loading"></div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{text}</p>
    </div>
  );
};

export default LoadingSpinner;
