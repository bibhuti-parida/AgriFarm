import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button.jsx';
import { Sprout, Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 border border-emerald-100">
        <Sprout className="w-8 h-8" />
      </div>
      <span className="text-sm font-extrabold text-emerald-600 uppercase tracking-widest">
        404 Error
      </span>
      <h1 className="text-3xl font-extrabold text-slate-900 mt-2 mb-3">
        Page Not Found
      </h1>
      <p className="text-slate-500 max-w-md text-sm mb-8 leading-relaxed">
        The agricultural parcel or management view you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" icon={Home}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
