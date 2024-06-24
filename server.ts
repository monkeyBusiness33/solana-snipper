import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer, Server } from 'http';
import dotenv from 'dotenv';
import connectDb from './config/db';
import routers from './routes';
import runListener from './bot';
import { getBuySettings, getSellAllSettings } from './models/Setting';
import SettingBuyModel from './models/schema/settingBuySchema';
import SettingSellModel from './models/schema/settingSellSchema';
import io from './config/socket';

//---------------starting Bot--------------------
let botInstance: NodeJS.Timeout | null = null;

const startBot = async () => {
  const configBuy = await  getBuySettings();
  const configSell = await getSellAllSettings();
  if (configBuy && configSell) {
    if (botInstance) {
      clearTimeout(botInstance); // Stop the existing bot
      botInstance = null;
    }
    botInstance = setTimeout(() => runListener(configBuy, configSell, socket)); // Start a new bot instance
  } else {
    console.error('Configuration settings not found.');
  }
}

const watchChanges = () => {
  const settingBuyChangeStream = SettingBuyModel.watch();
  const settingSellChangeStream = SettingSellModel.watch();

  settingBuyChangeStream.on('change', (change) => {
    //console.log('Detected change in SettingBuyModel:', change);
    startBot(); // Restart the bot on changes
  });

  settingSellChangeStream.on('change', (change) => {
    //console.log('Detected change in SettingSellModel:', change);
    startBot(); // Restart the bot on changes
  });
};

dotenv.config();

connectDb().then(() => {
  watchChanges(); // Start watching for changes
  // startBot(); //  Initial bot start
});

const socket = io.on("connection", (socket) => {
  socket.on('bot handle', (arg) => {
    if(arg == "start"){
      startBot()
    }
  });
});

//----------------------Run main-------------------------------------------

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_BASE_URL || 'http://localhost:3000'
}));


// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('Time:', Date.now(), 'Request URL:', req.url);
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

