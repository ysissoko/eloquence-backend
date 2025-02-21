import { Router } from 'express';
import { Request, Response } from 'express';

const chatRoutes = Router();

chatRoutes.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Hello, world!' });
});

export default chatRoutes;
