/**
 * Middleware to enforce authentication on routes.
 * Decodes the base64 simulated JWT session token.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized. No session token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Invalid session token.' });
  }
}
