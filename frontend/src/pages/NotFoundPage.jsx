import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div style={{ minHeight: 'calc(100vh - 150px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="surface-card" style={{ maxWidth: '440px', width: '100%', padding: '3rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4.5rem', color: 'var(--warm-orange)', margin: 0, fontFamily: 'var(--font-heading)' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--forest-green)', margin: '0.5rem 0 1rem' }}>
          Dish Not Found
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          The page you requested does not exist or may have been moved.
        </p>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>
          <Home size={18} />
          <span>Return to Canteen Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
