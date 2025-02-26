import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import verifyToken from './middlewares/verify-auth-token';

// Routes
import chatRoutes from './routes/chat.route';
import speechAssessmentRoutes from './routes/speech-assessment.route';

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
