import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { ErrorAlert } from '../../components/common/ErrorAlert.jsx';
import { Sprout, Mail, Lock, ArrowRight } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { success } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email.trim(), formData.password);
      success('Logged in successfully. Welcome back to AgriFarm!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md mb-3">
          <Sprout className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign in to Agri<span className="text-emerald-600">Farm</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Smart farm management, cycle planning, and yield optimization
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && <ErrorAlert message={error} className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="farmer@agrifarm.dev"
              icon={Mail}
              value={formData.email}
              onChange={handleChange}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                icon={Lock}
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={loading}
              icon={ArrowRight}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-bold text-emerald-600 hover:text-emerald-700"
              >
                Register as a farmer
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials Quick Note */}
        <div className="mt-6 p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-100 text-center text-xs text-emerald-800">
          <p className="font-semibold">Demo Credentials:</p>
          <p className="text-slate-600 mt-0.5">
            <code className="text-emerald-700 font-mono">farmer@agrifarm.dev</code> / <code className="text-emerald-700 font-mono">AgriFarmPassword123</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
