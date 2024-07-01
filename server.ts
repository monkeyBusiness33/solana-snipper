import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer, Server } from 'http';
import dotenv from 'dotenv';
import connectDb from './config/db';
import routers from './routes';
import { webhook, getAllWebhooks, deleteWebhook } from './config/webhook';
import SettingBuyModel from './models/schema/settingBuySchema';

const watchChanges = () => {

  const settingBuyChangeStream = SettingBuyModel.watch();

  settingBuyChangeStream.on('change', (change: any) => {
    webhook()
  });
};

dotenv.config();

// getAllWebhooks();
// deleteWebhook()
// connectDb();
// webhook();
// run();
// websocketHandler()
connectDb().then(() => {
  watchChanges(); // Start watching for changes
  // startBot(); //  Initial bot start
});

// const socket = io.on("connection", (socket) => {
//   socket.on('bot handle', (arg) => {
//     if(arg == "start"){
//       startBot()
//     }
//   });
// });

//----------------------Run main-------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_BASE_URL || 'http://localhost:3000'
}));


// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('Time:', new Date(Date.now()), 'Request URL:', req.url);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/v0", routers);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).send('Internal server error');
});

// Start the server
const server: Server = createServer(app);
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

