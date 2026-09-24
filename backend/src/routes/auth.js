const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendOtpEmail } = require('../emailService');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sahakara-super-secret-jwt-key-2026';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
    phone: user.phone,
    zone: user.zone,
  };
}

async function findUserByEmail(email) {
  const { data, error } = await db.from('users').select('*').eq('email', email).maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureDemoUsers() {
  const hash = await bcrypt.hash('Sahakara@123', 10);
  const demoUsers = [
    { id: 'usr-donor-1', name: 'Rajesh Sharma', email: 'donor@sahakara.org', password_hash: hash, role: 'donor', organization: 'Jaipur Marriott & Banquet', phone: '+91 98290 12345', zone: 'Mansarovar' },
    { id: 'usr-shelter-1', name: 'Anjali Sen', email: 'shelter@sahakara.org', password_hash: hash, role: 'shelter', organization: 'Aasha Shelter Home', phone: '+91 94140 54321', zone: 'Malviya Nagar' },
    { id: 'usr-driver-1', name: 'Kabir Verma', email: 'driver@sahakara.org', password_hash: hash, role: 'driver', organization: 'Sahakara Express Fleet', phone: '+91 97850 99887', zone: 'Tonk Road' },
  ];
  const { error } = await db.from('users').upsert(demoUsers, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw error;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ ok: false, error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (error, user) => {
    if (error) return res.status(403).json({ ok: false, error: 'Invalid or expired session token' });
    req.user = user;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: 'This action is not allowed for your role' });
    }
    next();
  };
}

router.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose = 'signup', name, role, organization } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'Please provide a valid email address' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await findUserByEmail(normalizedEmail);
    if (purpose === 'signup' && existingUser) {
      return res.status(409).json({ ok: false, error: 'An account with this email already exists. Please log in instead.' });
    }
    if (purpose === 'login' && !existingUser) {
      return res.status(404).json({ ok: false, error: 'No account found with this email. Please sign up first.' });
    }

    const otpCode = generateOtp();
    const id = `otp_${crypto.randomUUID()}`;
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const payload = JSON.stringify({ name, role, organization });

    const invalidate = await db.from('otp_verifications')
      .update({ verified: true }).eq('email', normalizedEmail).eq('purpose', purpose).eq('verified', false);
    if (invalidate.error) throw invalidate.error;

    const insert = await db.from('otp_verifications').insert({
      id, email: normalizedEmail, otp_code: otpCode, purpose, payload, expires_at: expiresAt, verified: false,
    });
    if (insert.error) throw insert.error;

    const emailResult = await sendOtpEmail({
      toEmail: normalizedEmail,
      otpCode,
      purpose,
      userName: name || (existingUser ? existingUser.name : 'Sahakara Member'),
    });

    res.json({ ok: true, message: `Verification code sent to ${normalizedEmail}`, expiresInMinutes: 10, devOtp: emailResult.devOtp || undefined, mode: emailResult.mode });
  } catch (error) {
    console.error('Error in send-otp:', error);
    res.status(500).json({ ok: false, error: 'Failed to generate and dispatch OTP' });
  }
});

async function getLatestOtp(email, otp, purpose) {
  const { data, error } = await db.from('otp_verifications').select('*')
    .eq('email', email).eq('otp_code', otp).eq('purpose', purpose).eq('verified', false)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

router.post('/verify-and-register', async (req, res) => {
  try {
    const { email, otp, password, name, role = 'donor', organization, phone, zone } = req.body;
    if (!email || !otp || !password || !name) return res.status(400).json({ ok: false, error: 'Email, OTP, Name, and Password are required' });
    if (password.length < 6) return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters' });

    const normalizedEmail = email.trim().toLowerCase();
    const otpRecord = await getLatestOtp(normalizedEmail, otp.trim(), 'signup');
    if (!otpRecord) return res.status(400).json({ ok: false, error: 'Invalid verification code' });
    if (Date.now() > Number(otpRecord.expires_at)) return res.status(400).json({ ok: false, error: 'Verification code has expired. Please request a new one.' });

    const verified = await db.from('otp_verifications').update({ verified: true }).eq('id', otpRecord.id);
    if (verified.error) throw verified.error;

    const user = {
      id: `usr_${crypto.randomUUID()}`,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: await bcrypt.hash(password, 10),
      role,
      organization: organization || null,
      phone: phone || null,
      zone: zone || 'Central',
    };
    const created = await db.from('users').insert(user).select().single();
    if (created.error) {
      if (created.error.code === '23505') return res.status(409).json({ ok: false, error: 'An account with this email already exists' });
      throw created.error;
    }

    const token = jwt.sign(publicUser(user), JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ ok: true, message: 'Account created and verified successfully', token, user: publicUser(user) });
  } catch (error) {
    console.error('Error in verify-and-register:', error);
    res.status(500).json({ ok: false, error: 'Registration failed' });
  }
});

router.post('/login-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password are required' });

    const userRow = await findUserByEmail(email.trim().toLowerCase());
    if (!userRow || !(await bcrypt.compare(password, userRow.password_hash))) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    const user = publicUser(userRow);
    res.json({ ok: true, message: 'Logged in successfully', token: jwt.sign(user, JWT_SECRET, { expiresIn: '7d' }), user });
  } catch (error) {
    console.error('Error in login-password:', error);
    res.status(500).json({ ok: false, error: 'Authentication failed' });
  }
});

router.post('/login-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ ok: false, error: 'Email and OTP code are required' });

    const normalizedEmail = email.trim().toLowerCase();
    const otpRecord = await getLatestOtp(normalizedEmail, otp.trim(), 'login');
    if (!otpRecord) return res.status(400).json({ ok: false, error: 'Invalid OTP code' });
    if (Date.now() > Number(otpRecord.expires_at)) return res.status(400).json({ ok: false, error: 'OTP code expired. Please request a new code.' });

    const verified = await db.from('otp_verifications').update({ verified: true }).eq('id', otpRecord.id);
    if (verified.error) throw verified.error;
    const userRow = await findUserByEmail(normalizedEmail);
    if (!userRow) return res.status(404).json({ ok: false, error: 'User record not found' });

    const user = publicUser(userRow);
    res.json({ ok: true, message: 'Logged in successfully via OTP', token: jwt.sign(user, JWT_SECRET, { expiresIn: '7d' }), user });
  } catch (error) {
    console.error('Error in login-otp:', error);
    res.status(500).json({ ok: false, error: 'OTP login failed' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await db.from('users').select('id, name, email, role, organization, phone, zone, created_at').eq('id', req.user.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'User not found' });
    res.json({ ok: true, user: data });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to load user' });
  }
});

router.get('/demo-personas', (req, res) => {
  res.json({ ok: true, personas: [
    { role: 'donor', label: 'Commercial Donor (Restaurant/Hotel)', name: 'Rajesh Sharma', email: 'donor@sahakara.org', password: 'Sahakara@123', org: 'Jaipur Marriott & Banquet' },
    { role: 'shelter', label: 'Shelter Coordinator (NGO)', name: 'Anjali Sen', email: 'shelter@sahakara.org', password: 'Sahakara@123', org: 'Aasha Shelter Home' },
    { role: 'driver', label: 'Volunteer Rescue Driver', name: 'Kabir Verma', email: 'driver@sahakara.org', password: 'Sahakara@123', org: 'Sahakara Express Fleet' },
  ] });
});

module.exports = { router, initializeAuth: ensureDemoUsers, authenticateToken, requireRole };
