import React, { useState } from 'react';

export default function ResetPassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isOldPasswordCorrect, setIsOldPasswordCorrect] = useState(false);
  const [isPasswordResetSuccessful, setIsPasswordResetSuccessful] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/validateOldPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: localStorage.getItem('userEmail'),
          oldPassword: oldPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsOldPasswordCorrect(true);
      } else {
        setIsOldPasswordCorrect(false);
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // --- FRONTEND SECURITY: Prevent null or empty passwords ---
    if (!newPassword || newPassword.trim() === "") {
        alert("Password cannot be empty!");
        return; 
    }
    if (newPassword.length < 5) {
        alert("Password must be at least 5 characters long.");
        return;
    }
    // -----------------------------------------------------------

    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/resetPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: localStorage.getItem('userEmail'),
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsPasswordResetSuccessful(true);
      } else {
        setIsPasswordResetSuccessful(false);
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {isOldPasswordCorrect ? (
        isPasswordResetSuccessful ? (
          <div className="text-white fs-1">Password reset was successful.</div>
        ) : (
          <form onSubmit={handleResetPassword}>
            <label htmlFor="newPasswordInput" className="form-label text-white fs-6">
              New Password:
            </label>
            {/* REMOVED text-white from the input so you can see the text! */}
            <input 
              type="password" 
              id="newPasswordInput"
              className="form-control" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
            />
            
            <div style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', marginTop: '15px' }}>
              <button type="submit" className="btn btn-primary btn-shadow">Reset Password</button>
            </div>
          </form>
        )
      ) : (
        <div>
          <label htmlFor="oldPasswordInput" className="form-label text-white fs-6">
            Old Password:
          </label>
          <input 
            type="password" 
            id="oldPasswordInput"
            className="form-control requi" 
            value={oldPassword} 
            onChange={(e) => setOldPassword(e.target.value)} 
          />
          
          <div style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', marginTop: '15px' }}>
            <button type="submit" className="btn btn-primary btn-shadow" onClick={handleSubmit}>Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}