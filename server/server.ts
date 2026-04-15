import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import { stripeWebhook } from './controllers/stripeWebhook.js';

const app = express();

const port = 3000;

const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174', ...(process.env.TRUSTED_ORIGINS?.split(',') || [])],
    credentials: true,
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin?.match(/^http:\/\/localhost:(517[3-9]|5[1-9][0-9][0-9]|6[0-9]{3})/) || (process.env.TRUSTED_ORIGINS && process.env.TRUSTED_ORIGINS.split(',').includes(origin || ''))) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))
app.post('/api/stripe', express.raw({type: 'application/json'}), stripeWebhook)

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json({limit: '50mb'}))

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});
app.use('/api/user', userRouter);
app.use('/api/project', projectRouter);


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});