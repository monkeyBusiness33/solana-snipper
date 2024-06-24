import { MarketCache, PoolCache } from './cache';
import { Listeners } from './listeners';
import { Connection, KeyedAccountInfo, Keypair } from '@solana/web3.js';
import { array, BigNumberish, LIQUIDITY_STATE_LAYOUT_V4, MARKET_STATE_LAYOUT_V3, Token, TokenAmount } from '@raydium-io/raydium-sdk';
import { AccountLayout, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { Bot, BotConfig } from './bot';
import { DefaultTransactionExecutor, TransactionExecutor } from './transactions';
import {
  getToken,
  getWallet,
  logger,
  COMMITMENT_LEVEL,
  RPC_ENDPOINT,
  RPC_WEBSOCKET_ENDPOINT,
  PRE_LOAD_EXISTING_MARKETS,
  LOG_LEVEL,
  CHECK_IF_MUTABLE,
  CHECK_IF_MINT_IS_RENOUNCED,
  CHECK_IF_FREEZABLE,
  CHECK_IF_BURNED,
  QUOTE_MINT,
  MAX_POOL_SIZE,
  MIN_POOL_SIZE,
  QUOTE_AMOUNT,
  PRIVATE_KEY,
  USE_SNIPE_LIST,
  ONE_TOKEN_AT_A_TIME,
  AUTO_SELL_DELAY,
  MAX_SELL_RETRIES,
  AUTO_SELL,
  MAX_BUY_RETRIES,
  AUTO_BUY_DELAY,
  COMPUTE_UNIT_LIMIT,
  COMPUTE_UNIT_PRICE,
  CACHE_NEW_MARKETS,
  TAKE_PROFIT,
  STOP_LOSS,
  BUY_SLIPPAGE,
  SELL_SLIPPAGE,
  PRICE_CHECK_DURATION,
  PRICE_CHECK_INTERVAL,
  SNIPE_LIST_REFRESH_INTERVAL,
  TRANSACTION_EXECUTOR,
  CUSTOM_FEE,
  FILTER_CHECK_INTERVAL,
  FILTER_CHECK_DURATION,
  CONSECUTIVE_FILTER_MATCHES,
} from './helpers';
//import { version } from './package.json';
import { WarpTransactionExecutor } from './transactions/warp-transaction-executor';
import { JitoTransactionExecutor } from './transactions/jito-rpc-transaction-executor';
import { SettingBuyModel } from '../models/schema/settingBuySchema';
import { SettingSellModel } from '../models/schema/settingSellSchema';
const moment = require('moment');

const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
  commitment: COMMITMENT_LEVEL,
});

function printDetails(wallet: Keypair, quoteToken: Token, bot: Bot, socket : any) {
//----------------Getting log info------------------
  const botConfig = bot.config;
  interface Datalog {
    status?: string;
    time: Date;
    msg: any[];
  }
  const datalog: Datalog = {
    status: "success",
    time: moment.utc().toDate(),
    msg: []
  };
  function addMessage(datalog: Datalog, message: string | number, status? : string ): void {
    datalog.msg.push(message);
    datalog.status = status?status : "success";
  }
  
  logger.info('------- CONFIGURATION START -------');
  addMessage(datalog, '------- CONFIGURATION START -------');
  logger.info(`Wallet: ${wallet.publicKey.toString()}`);
  addMessage(datalog, `Wallet: ${wallet.publicKey.toString()}`);
  logger.info('- Bot -');
  addMessage(datalog, '- Bot -');
  logger.info(
    `Using ${TRANSACTION_EXECUTOR} executer: ${bot.isWarp || bot.isJito || (TRANSACTION_EXECUTOR === 'default' ? true : false)}`,
  );
  addMessage(datalog, `Using ${TRANSACTION_EXECUTOR} executer: ${bot.isWarp || bot.isJito || (TRANSACTION_EXECUTOR === 'default' ? true : false)}`);
  
  if (bot.isWarp || bot.isJito) {
    logger.info(`${TRANSACTION_EXECUTOR} fee: ${CUSTOM_FEE}`);
    addMessage(datalog, `${TRANSACTION_EXECUTOR} fee: ${CUSTOM_FEE}`);
  } else {
    logger.info(`Compute Unit limit: ${botConfig.unitLimit}`);
    logger.info(`Compute Unit price (micro lamports): ${botConfig.unitPrice}`);
    addMessage(datalog, `Compute Unit limit: ${botConfig.unitLimit}`);
    addMessage(datalog, `Compute Unit price (micro lamports): ${botConfig.unitPrice}`);
  }

  logger.info(`Single token at the time: ${botConfig.oneTokenAtATime}`);
  addMessage(datalog, `Single token at the time: ${botConfig.oneTokenAtATime}`);
  logger.info(`Pre load existing markets: ${PRE_LOAD_EXISTING_MARKETS}`);
  addMessage(datalog, `Pre load existing markets: ${PRE_LOAD_EXISTING_MARKETS}`);
  logger.info(`Cache new markets: ${CACHE_NEW_MARKETS}`);
  addMessage(datalog, `Cache new markets: ${CACHE_NEW_MARKETS}`);
  logger.info(`Log level: ${LOG_LEVEL}`);
  addMessage(datalog,`Log level: ${LOG_LEVEL}`);
  logger.info('- Buy -');
  addMessage(datalog, '- Buy -');
  logger.info(`Buy amount: ${botConfig.quoteAmount.toFixed()} ${botConfig.quoteToken.name}`);
  addMessage(datalog, `Buy amount: ${botConfig.quoteAmount.toFixed()} ${botConfig.quoteToken.name}`);
  logger.info(`Auto buy delay: ${botConfig.autoBuyDelay} ms`);
  addMessage(datalog, `Auto buy delay: ${botConfig.autoBuyDelay} ms`);
  logger.info(`Max buy retries: ${botConfig.maxBuyRetries}`);
  addMessage(datalog, `Max buy retries: ${botConfig.maxBuyRetries}`);
  //logger.info(`Buy amount (${quoteToken.symbol}): ${botConfig.quoteAmount.toFixed()}`);
  logger.info(`Buy slippage: ${botConfig.buySlippage}%`);
  addMessage(datalog, `Buy slippage: ${botConfig.buySlippage}%`);
  logger.info('- Sell -');
  addMessage(datalog, '- Sell -');
  logger.info(`Auto sell: ${AUTO_SELL}`);
  addMessage(datalog,`Auto sell: ${AUTO_SELL}`);
  logger.info(`Auto sell delay: ${botConfig.autoSellDelay} ms`);
  addMessage(datalog, `Auto sell delay: ${botConfig.autoSellDelay} ms`);
  logger.info(`Max sell retries: ${botConfig.maxSellRetries}`);
  addMessage(datalog, `Max sell retries: ${botConfig.maxSellRetries}`);
  logger.info(`Sell slippage: ${botConfig.sellSlippage}%`);
  addMessage(datalog, `Sell slippage: ${botConfig.sellSlippage}%`);
  logger.info(`Price check interval: ${botConfig.priceCheckInterval} ms`);
  addMessage(datalog,`Price check interval: ${botConfig.priceCheckInterval} ms`);
  logger.info(`Price check duration: ${botConfig.priceCheckDuration} ms`);
  addMessage(datalog, `Price check duration: ${botConfig.priceCheckDuration} ms`);
  logger.info(`Take profit: ${botConfig.takeProfit}%`);
  addMessage(datalog, `Take profit: ${botConfig.takeProfit}%`);
  logger.info(`Stop loss: ${botConfig.stopLoss}%`);
  addMessage(datalog, `Stop loss: ${botConfig.stopLoss}%`);
  logger.info('- Snipe list -');
  addMessage(datalog, '- Snipe list -');
  logger.info(`Snipe list: ${botConfig.useSnipeList}`);
  addMessage(datalog, `Snipe list: ${botConfig.useSnipeList}`);
  logger.info(`Snipe list refresh interval: ${SNIPE_LIST_REFRESH_INTERVAL} ms`);
  addMessage(datalog, `Snipe list refresh interval: ${SNIPE_LIST_REFRESH_INTERVAL} ms`);
  if (botConfig.useSnipeList) {
    logger.info('- Filters -');
    addMessage(datalog,'- Filters -');
    logger.info(`Filters are disabled when snipe list is on`);
    addMessage(datalog, `Filters are disabled when snipe list is on`);
  } else {
    logger.info('- Filters -');
    addMessage(datalog, '- Filters -');
    logger.info(`Filter check interval: ${botConfig.filterCheckInterval} ms`);
    addMessage(datalog, `Filter check interval: ${botConfig.filterCheckInterval} ms`);
    logger.info(`Filter check duration: ${botConfig.filterCheckDuration} ms`);
    addMessage(datalog, `Filter check duration: ${botConfig.filterCheckDuration} ms`);
    logger.info(`Consecutive filter matches: ${botConfig.consecutiveMatchCount}`);
    addMessage(datalog, `Consecutive filter matches: ${botConfig.consecutiveMatchCount}`);
    logger.info(`Check renounced: ${botConfig.checkRenounced}`);
    addMessage(datalog, `Check renounced: ${botConfig.checkRenounced}`);
    logger.info(`Check freezable: ${botConfig.checkFreezable}`);
    addMessage(datalog, `Check freezable: ${botConfig.checkFreezable}`);
    logger.info(`Check burned: ${botConfig.checkBurned}`);
    addMessage(datalog, `Check burned: ${botConfig.checkBurned}`);
    logger.info(`Min pool size: ${botConfig.minPoolSize.toFixed()}`);
    addMessage(datalog, `Min pool size: ${botConfig.minPoolSize.toFixed()}`);
    logger.info(`Max pool size: ${botConfig.maxPoolSize.toFixed()}`);
    addMessage(datalog,`Max pool size: ${botConfig.maxPoolSize.toFixed()}`);
  }
    
  logger.info('------- CONFIGURATION END -------');
  addMessage(datalog, '------- CONFIGURATION END -------');
  logger.info('Bot is running! Press CTRL + C to stop it.');
  socket.emit(
    "Wallet", `${wallet.publicKey.toString()}`,
    "Buy", {
    buyAmount: `(${quoteToken.symbol}) : ${botConfig.quoteAmount.toFixed()}`,
    autoBuyDelay: `${botConfig.autoBuyDelay} ms`,
    maxBuyRetries: `${botConfig.maxBuyRetries}`,
    buySlippage: `${botConfig.buySlippage}%`
  },
    "Sell", {
    autoSell: `${AUTO_SELL}`,
    autoSellDelay: `${botConfig.autoSellDelay} ms`,
    maxSellRetries: `${botConfig.maxSellRetries}`,
    sellSlippage: `${botConfig.sellSlippage}%`,
    priceCheckInterval: `${botConfig.priceCheckInterval} ms`,
    priceCheckDuration: `${botConfig.priceCheckDuration} ms`,
    takeProfit: `${botConfig.takeProfit}%`,
    stopLoss: `${botConfig.stopLoss}%`
  },
    "log" ,  datalog,
  );
}

const runListener = async (configBuy: SettingBuyModel, configSell: SettingSellModel, socket :any) => {
  logger.level = LOG_LEVEL;
  logger.info('Bot is starting...');

  if (!configBuy && !configSell) {
    logger.error('No configuration settings found. Exiting...');
    process.exit(1);
  }

  const marketCache = new MarketCache(connection);
  const poolCache = new PoolCache();
  let txExecutor: TransactionExecutor;

  switch (TRANSACTION_EXECUTOR) {
    case 'warp': {
      txExecutor = new WarpTransactionExecutor(CUSTOM_FEE);
      break;
    }
    case 'jito': {
      txExecutor = new JitoTransactionExecutor(CUSTOM_FEE, connection);
      break;
    }
    default: {
      txExecutor = new DefaultTransactionExecutor(connection);
      break;
    }
  }

  // const wallet = getWallet(PRIVATE_KEY.trim());
  const wallet = getWallet(configBuy.wallet.trim());
  const quoteToken = getToken(QUOTE_MINT);
  const botConfig = <BotConfig>{
    wallet,
    // configBuy.wallet,
    quoteAta: getAssociatedTokenAddressSync(quoteToken.mint, wallet.publicKey),
    checkRenounced: CHECK_IF_MINT_IS_RENOUNCED, 
    // checkRenounced: configBuy.checkMintIsRenounced,
    checkBurned: CHECK_IF_BURNED,
    // checkBurned: configBuy.isCheckBurn,
    checkFreezable: CHECK_IF_FREEZABLE,
    // checkFreezable: configBuy.checkfreezable,
    minPoolSize: new TokenAmount(quoteToken, MIN_POOL_SIZE, false),
    // minPoolSize: new TokenAmount(quoteToken, configBuy.minPoolSizeAmount, false),
    maxPoolSize: new TokenAmount(quoteToken, MAX_POOL_SIZE, false),
    // maxPoolSize: new TokenAmount(quoteToken, configBuy.maxPoolSizeAmount, false),
    quoteToken,
    //quoteAmount: new TokenAmount(quoteToken, QUOTE_AMOUNT, false),
    quoteAmount: new TokenAmount(quoteToken, configBuy.investSolAmount, false),
    oneTokenAtATime: ONE_TOKEN_AT_A_TIME,
    useSnipeList: USE_SNIPE_LIST,
    autoSell: AUTO_SELL,
    // autoSell: configSell.autoSell,
    autoSellDelay: AUTO_SELL_DELAY,
    // autoSellDelay: configSell.autoSellDelay,
    maxSellRetries: MAX_SELL_RETRIES,
    // maxSellRetries: configSell.maxSellRetrives,
    autoBuyDelay: AUTO_BUY_DELAY, 
    // autoBuyDelay: configSell.autoSellDelay,
    maxBuyRetries: MAX_BUY_RETRIES,
    // maxBuyRetries: configBuy.buyTries,
    unitLimit: COMPUTE_UNIT_LIMIT,
    unitPrice: COMPUTE_UNIT_PRICE,
    takeProfit: TAKE_PROFIT,
    // takeProfit: configSell.takeProfit,
    stopLoss: STOP_LOSS,
    // stopLoss: configSell.stopLoss,
    //buySlippage: BUY_SLIPPAGE, 
    buySlippage: configBuy.buySlippage,
    sellSlippage: SELL_SLIPPAGE, 
    // sellSlippage: configSell.sellSlippage,
    priceCheckInterval: PRICE_CHECK_INTERVAL,
    // priceCheckInterval: configSell.priceCheckInterval,
    priceCheckDuration: PRICE_CHECK_DURATION,
    // priceCheckDuration: configSell.priceCheckDuration,
    filterCheckInterval: FILTER_CHECK_INTERVAL,
    // filterCheckInterval: configBuy.filterCheckInterval,
    filterCheckDuration: FILTER_CHECK_DURATION,
    // filterCheckDuration: configBuy.filterCheckDuration,
    consecutiveMatchCount: CONSECUTIVE_FILTER_MATCHES,  
    // consecutiveMatchCount: configBuy.consecutiveFilterMatches,
  };

  const bot = new Bot(connection, marketCache, poolCache, txExecutor, botConfig);
  const valid = await bot.validate();

  if (!valid) {
    logger.info('Bot is exiting...');
    process.exit(1);
  }

  if (PRE_LOAD_EXISTING_MARKETS) {
    await marketCache.init({ quoteToken });
  }

  const runTimestamp = Math.floor(new Date().getTime() / 1000);
  const listeners = new Listeners(connection);
  await listeners.start({
    walletPublicKey: wallet.publicKey,
    quoteToken,
    autoSell: AUTO_SELL,
    cacheNewMarkets: CACHE_NEW_MARKETS,
  });

  listeners.on('market', (updatedAccountInfo: KeyedAccountInfo) => {
    const marketState = MARKET_STATE_LAYOUT_V3.decode(updatedAccountInfo.accountInfo.data);
    marketCache.save(updatedAccountInfo.accountId.toString(), marketState);
  });

  listeners.on('pool', async (updatedAccountInfo: KeyedAccountInfo) => {
    const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(updatedAccountInfo.accountInfo.data);
    const poolOpenTime = parseInt(poolState.poolOpenTime.toString());
    const exists = await poolCache.get(poolState.baseMint.toString());

    if (!exists && poolOpenTime > runTimestamp) {
      poolCache.save(updatedAccountInfo.accountId.toString(), poolState);
      await bot.buy(updatedAccountInfo.accountId, poolState);
    }
  });

  listeners.on('wallet', async (updatedAccountInfo: KeyedAccountInfo) => {
    const accountData = AccountLayout.decode(updatedAccountInfo.accountInfo.data);

    if (accountData.mint.equals(quoteToken.mint)) {
      return;
    }

    await bot.sell(updatedAccountInfo.accountId, accountData);
  });
  
  printDetails(wallet, quoteToken, bot, socket);
  
};

//runListener();

export default runListener;