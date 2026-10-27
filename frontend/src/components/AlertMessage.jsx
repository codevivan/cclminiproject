import { AlertCircle, CheckCircle } from 'lucide-react';

export const AlertMessage = ({ type = 'error', message }) => {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`alert ${isSuccess ? 'alert-success' : 'alert-error'}`} role="alert">
      {isSuccess ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
    </div>
  );
};

export default AlertMessage;
