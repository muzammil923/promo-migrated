const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Fail fast at boot if the secret is missing. A missing secret previously
// fell back to the hardcoded string 'secret', which let anyone forge tokens.
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Refusing to start with an insecure default.');
  process.exit(1);
}

// ── Layer 3: Authentication ────────────────────────────────────────────────
// Verifies a valid token is present and decodes the user. Does NOT check role
// (that is Layer 4 / requireRole). Existing callers keep working unchanged.
module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ── Layer 4: Role-based access control ──────────────────────────────────────
// Gate a route to one or more roles. Usage: router.use(requireRole('admin'))
// or requireRole('admin','business_owner').
module.exports.requireRole = (...roles) => (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    if (!roles.includes(decoded.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Convenience: admin-only gate (most admin/console routes).
module.exports.requireAdmin = module.exports.requireRole('admin');
