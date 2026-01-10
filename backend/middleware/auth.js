import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Formato esperado: "Bearer TOKEN"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Acceso denegado. Token requerido." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error(`[AUTH AUDIT] Acceso denegado: Token inválido/expirado.`);
            return res.status(403).json({ error: "Sesión expirada. Por seguridad, re-ingrese credenciales." });
        }

        // Context Validation
        req.user = user;
        next();
    });
};

// RBAC & MFA Middleware (ISO 27799)
export const authorize = (roles = []) => {
    return (req, res, next) => {
        // 1. Role Check
        if (roles.length && !roles.includes(req.user.role)) {
            console.error(`[AUTH AUDIT] User ${req.user.email} (Role: ${req.user.role}) intentó acceder a ruta protegida.`);
            return res.status(403).json({ error: "No tiene privilegios clínicos para esta operación." });
        }

        // 2. MFA Enforcement for Critical Roles
        if (req.user.role === 'medico' || req.user.role === 'admin') {
            if (!req.user.mfa_verified) {
                return res.status(403).json({ error: "Acceso denegado. Se requiere Autenticación de Doble Factor (MFA)." });
            }
        }

        next();
    };
};
