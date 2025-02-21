import { Request, Response, NextFunction } from 'express';
import supabase from '../services/supabase-client';

// JWT verification middleware
export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({ error: 'No authorization header' });
            return;
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }

        (req as any).user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
};
