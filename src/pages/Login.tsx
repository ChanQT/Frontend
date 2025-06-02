import React, { useState } from 'react';
import Swal from 'sweetalert2'; // Import SweetAlert
import '../CSS/login.css';
import Logo from "../assets/Sign.png";

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (username === 'admin' && password === 'password') {
      localStorage.setItem('isAuthenticated', 'true'); // Save login state

      // Show SweetAlert on successful login with auto redirect
      Swal.fire({
        title: 'Login Successful!',
        text: 'Redirecting to the Dashboard...',
        icon: 'success',
        timer: 1500, // Auto close after 2 seconds
        timerProgressBar: true,
        showConfirmButton: false, // Remove the OK button
      }).then(() => {
        window.location.href = '/dashboard'; // Redirect to dashboard after alert
      });
    } else {
      setErrorMessage('Invalid username or password.');
    }
  };

  return (
    <div className="login-page">
      <div className="form-wrapper">
        <form id="login-form" onSubmit={handleSubmit}>
          <img src={Logo} alt="Boarding House Logo" className="logo" />
          <h2>Admin Login</h2>

          <div className="input-field">
            <input
              type="text"
              id="username"
              placeholder=""
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label htmlFor="username">Enter your Username</label>
          </div>
          <div className="input-field">
            <div className="password-wrapper" style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"} // Toggle input type
                id="password"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: "40px" }} // Add space for the icon
              />
              <label htmlFor="password">Enter your Password</label>
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)} // Toggle visibility
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "10px",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                }}
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} style={{ fontSize: "1.2rem" }}></i>
              </span>
            </div>
          </div>
          <button type="submit">Log In</button>
          {errorMessage && <div id="error-message" className="error-message">{errorMessage}</div>}
        </form>
      </div>
    </div>
  );
};

export default Login;