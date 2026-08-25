import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { login } from './services/api';
import './login.css';
import logo from './images/logo.png';
import { ButtonLoader } from './components/LoadingSpinner';
import { BRAND_LOGO_ALT, SYSTEM_NAME } from './utils/brand';

const EMPLOYEE_LOCATIONS = ['Boma', 'Geita'];

const BRANCH_DASHBOARD = {
  boma: '/boma/dashboard',
  geita: '/geita/dashboard',
};

function Login() {
  const navigate = useNavigate();
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    username: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const switchToAdminLogin = () => {
    setIsAdminLogin(true);
    setError('');
    setFormData((prev) => ({ ...prev, location: '' }));
  };

  const switchToEmployeeLogin = () => {
    setIsAdminLogin(false);
    setError('');
    setFormData((prev) => ({ ...prev, username: '' }));
  };

  const redirectAfterLogin = (userData) => {
    if (userData.userType === 'employee') {
      const branch = String(userData.location || '').trim().toLowerCase();
      const path = BRANCH_DASHBOARD[branch] || BRANCH_DASHBOARD.geita;
      navigate(path);
      return;
    }
    navigate('/admin/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let credentials;

      if (isAdminLogin) {
        const username = formData.username.trim();
        if (!username) {
          setError('Please enter your username.');
          setLoading(false);
          return;
        }
        credentials = {
          username,
          loginType: 'admin',
          password: formData.password,
        };
      } else {
        const location = formData.location.trim();
        if (!location) {
          setError('Please select your location.');
          setLoading(false);
          return;
        }
        credentials = {
          location,
          branch: location,
          loginType: 'employee',
          password: formData.password,
        };
      }

      const response = await login(credentials);

      if (response.success && response.user) {
        const isAdmin = response.user.userType === 'admin';
        const userData = isAdmin
          ? {
              id: response.user.id,
              username: response.user.username,
              userType: 'admin',
              full_name: response.user.username,
            }
          : {
              id: response.user.id,
              username: response.user.location,
              email: response.user.email,
              full_name: response.user.full_name,
              phone: response.user.phone,
              position: response.user.position,
              department: response.user.department,
              location: response.user.location,
              status: response.user.status,
              userType: 'employee',
            };

        const storage = formData.rememberMe ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(userData));

        redirectAfterLogin({
          ...userData,
          location: userData.location || formData.location.trim(),
        });
      } else {
        throw new Error('Login failed: Invalid response from server');
      }
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.';

      if (
        err.message.includes('Cannot reach') ||
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        err.message.includes('API route not found') ||
        err.message.includes('backend')
      ) {
        errorMessage = err.message.includes('Cannot reach')
          ? err.message
          : 'Cannot reach the API. Open https://www.ts-autoparts.co.tz and ensure the backend is running.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header className="header-band"></header>

      <main className="login-main-content">
        <div className="login-container">
          <div className="login-card">
            <div className="login-logo-container">
              <img src={logo} alt={BRAND_LOGO_ALT} className="login-logo" />
            </div>
            <h2 className="login-title">Login</h2>
            <p className="login-subtitle">
              {isAdminLogin ? 'Admin sign in' : 'Employee sign in by location'}
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              {isAdminLogin ? (
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-control"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter admin username"
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="location" className="form-label">
                    Location
                  </label>
                  <select
                    id="location"
                    name="location"
                    className="form-control login-select"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select location</option>
                    {EMPLOYEE_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="form-control password-input"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="password-icon" />
                    ) : (
                      <FaEye className="password-icon" />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <div className="form-check">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    className="form-check-input"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <label htmlFor="rememberMe" className="form-check-label">
                    Remember me
                  </label>
                </div>
                <a href="#forgot-password" className="forgot-password-link">
                  Forgot Password?
                </a>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <ButtonLoader message="Logging in..." size="sm" /> : 'Login'}
              </button>
            </form>

            <div className="login-footer-text">
              {isAdminLogin ? (
                <p>
                  Employee?{' '}
                  <button type="button" className="register-link login-switch-link" onClick={switchToEmployeeLogin}>
                    Sign in with location
                  </button>
                </p>
              ) : (
                <p>
                  Admin?{' '}
                  <button type="button" className="register-link login-switch-link" onClick={switchToAdminLogin}>
                    Sign in with username
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer-band">
        <p>
          Copyright &copy; 2026. <b>{SYSTEM_NAME}</b>
        </p>
      </footer>
    </div>
  );
}

export default Login;
