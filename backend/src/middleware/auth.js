import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import pool from '../db/pool.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const hasFirebase =
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY;

if (hasFirebase && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[auth] Firebase Admin initialized');
  } catch (error) {
    console.error('[auth] Firebase init error:', error.message);
  }
}

/**
 * Unified mobile auth middleware.
 * Accepts either:
 *  - a JWT issued by /api/auth/login (custom token)
 *  - a Firebase ID token (if Firebase is configured)
 * Attaches req.user = { id, email, full_name } (DB user row)
 */
export const mobileAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }
  const token = authHeader.slice('Bearer '.length);

  // Try custom JWT first (fast path, DB-backed)
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.userId) {
      const result = await pool.query(
        'SELECT id, email, full_name, is_banned FROM users WHERE id = $1',
        [decoded.userId]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }
      if (result.rows[0].is_banned) {
        return res.status(403).json({ error: 'Account banned' });
      }
      req.user = result.rows[0];
      return next();
    }
  } catch (_) {
    // not a custom JWT, try Firebase
  }

  if (!hasFirebase) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    // Upsert into users table
    const upsert = await pool.query(
      `INSERT INTO users (firebase_uid, email, full_name, is_email_verified)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (firebase_uid) DO UPDATE
       SET email = EXCLUDED.email,
           full_name = COALESCE(users.full_name, EXCLUDED.full_name)
       RETURNING id, email, full_name, is_banned`,
      [decoded.uid, decoded.email, decoded.name || '', !!decoded.email_verified]
    );
    if (upsert.rows[0].is_banned) {
      return res.status(403).json({ error: 'Account banned' });
    }
    req.user = upsert.rows[0];
    return next();
  } catch (error) {
    console.error('[auth] token verify failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Admin auth: verifies JWT with role=admin.
 */
export const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }
  const token = authHeader.slice('Bearer '.length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const signMobileToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

export const signAdminToken = (admin) =>
  jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role || 'admin' },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

export default mobileAuth;
