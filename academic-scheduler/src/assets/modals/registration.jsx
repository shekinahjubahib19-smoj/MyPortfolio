import React, { useState } from 'react';
import '../css/registration.css';

const Registration = ({ isOpen, onClose, onShowResult }) => {
	const [formData, setFormData] = useState({ username: '', password: '', role: 'TEACHER' });
	const [message, setMessage] = useState('');
	// `onShowResult` is an optional prop provided by the parent to show result modals

	if (!isOpen) return null;

	const handleRegister = async (e) => {
		e.preventDefault();
		setMessage('Processing...');

		try {
			const response = await fetch('http://localhost/Portfolio/academic-scheduler/backend/api/register_user.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			});

			const text = await response.text();
			console.log('Register response', response.status, response.statusText, text);

			if (!response.ok) {
				let parsed = {};
				try {
					parsed = text ? JSON.parse(text) : {};
				} catch (parseErr) {
					console.warn('Failed to parse error response JSON:', parseErr);
					parsed = { message: text };
				}
				const msg = parsed.message || `Request failed: ${response.status} ${response.statusText}`;
				console.error('Register request failed', response.status, msg);
				setMessage('Error: ' + msg);
				return;
			}

			let result = {};
			try {
				result = text ? JSON.parse(text) : {};
			} catch (err) {
				console.error('Invalid JSON response from backend:', err, text);
				setMessage('Error: Invalid response from server. Check backend logs.');
				return;
			}

			if (result.success) {
				setMessage('User registered successfully!');
				setFormData({ username: '', password: '', role: 'TEACHER' });
				if (typeof onShowResult === 'function') {
					onShowResult({ title: 'Success', message: result.message || 'User registered successfully!', isError: false, success: true });
				}
			} else {
				const msg = result.message || JSON.stringify(result) || 'Unknown error';
				setMessage('Error: ' + msg);
				if (typeof onShowResult === 'function') {
					onShowResult({ title: 'Error', message: msg, isError: true, success: false });
				}
			}
		} catch (error) {
			console.error('Register user error:', error);
			setMessage('Failed to connect to backend.');
			if (typeof onShowResult === 'function') {
				onShowResult({ title: 'Error', message: 'Failed to connect to backend.', isError: true, success: false });
			}
		}
	};

	const stop = (e) => e.stopPropagation();

	return (
		<div className="registration-overlay" role="dialog" aria-modal="true" onClick={onClose}>
			<div className="registration-modal" onClick={stop}>
				<button className="registration-close" onClick={onClose} aria-label="Close">×</button>
				<h3 style={{ marginTop: 0 }}>New</h3>
				<form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
					<input
						type="text"
						placeholder="Username"
						className="input-field"
						value={formData.username}
						onChange={(e) => setFormData({ ...formData, username: e.target.value })}
						required
					/>
					<input
						type="password"
						placeholder="Temporary Password"
						className="input-field"
						value={formData.password}
						onChange={(e) => setFormData({ ...formData, password: e.target.value })}
						required
					/>
					<select
						className="input-field"
						value={formData.role}
						onChange={(e) => setFormData({ ...formData, role: e.target.value })}
					>
						<option value="TEACHER">Teacher</option>
						<option value="ADMIN">Admin</option>
					</select>

					<div className="actions">
						<button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
						<button type="submit" className="btn primary">Create</button>
					</div>
					{message && <p style={{ fontSize: '0.85rem', color: message.includes('Error') ? '#ff4d4d' : '#47d147' }}>{message}</p>}
				</form>
			</div>
		</div>
	);
};

export default Registration;
