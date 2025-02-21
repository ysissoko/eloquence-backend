import dotenv from 'dotenv';
dotenv.config();
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import express from 'express';
import verifyToken from './middlewares/verify-auth-token';

// Routes
import speechAssessmentRoutes from './routes/speech-assessment.route';
import chatRoutes from './routes/chat.route';

export default class App {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private initializeMiddlewares() {
        this.app.use(helmet());
        this.app.use(cors()); // TODO: Allow specific origins
        this.app.use(rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
        }));
        this.app.use(express.json());
        // this.app.use(verifyToken);
    }

    private initializeRoutes() {
        this.app.use('/api/speechAssessment', speechAssessmentRoutes);
        this.app.use('/api/chat', chatRoutes);
    }

    public start() {
        this.app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    }
}   
