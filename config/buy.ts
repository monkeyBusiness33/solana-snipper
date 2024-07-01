const { Command } = require('commander');
const { Connection, SystemProgram, Transaction, sendAndConfirmTransaction, Keypair, ComputeBudgetProgram, PublicKey, VersionedTransaction } = require("@solana/web3.js");
const { jsonInfo2PoolKeys, LiquidityPoolKeys, LiquidityPoolJsonInfo, LIQUIDITY_STATE_LAYOUT_V4, buildSimpleTransaction, Liquidity, MAINNET_PROGRAM_ID, MARKET_STATE_LAYOUT_V3, TOKEN_PROGRAM_ID, Token, TokenAmount, findProgramAddress, SOL, Currency, parseBigNumberish, ONE, SPL_ACCOUNT_LAYOUT, TxVersion, DEVNET_PROGRAM_ID } = require('@raydium-io/raydium-sdk');
const { unpackMint } = require("@solana/spl-token");
const { BN } = require("bn.js");
const axios = require('axios');
const bs58 = require("bs58");
require('dotenv').config();

const RPC_URL = process.env.RPC_ENDPOINT || "https://api.devnet.solana.com";
const connection = new Connection(RPC_URL, "confirmed");

const program = new Command();
program.parse(process.argv);

const FROM_SECRET_KEY_BASE58 = '5WT5v5fEpw5LQXDSwiT533TDGtBXRdTEYCUiXJfrfjE3Dp6aY5ikjaMkVuXsGyFDdExkMtagKAZou6whE4sMJ44G'; // Replace with your own secret key in base58 format
const FROM_PRIVATE_KEY = bs58.decode(FROM_SECRET_KEY_BASE58);
const MARKET_ID = "7EkAGWK1fsSp6hvPGEnuWrSsZriFzcjD5KwAaKizK1Fr";
const quote_Mint_amount = 2;
const input_baseMint_tokens_percentage = 1;
const delay_pool_open_time = Number(0);
const lookupTableCache = {};
const makeTxVersion = TxVersion.V0;
const addLookupTableInfo = undefined; // only mainnet. other = undefined

const RAY_SOL_LP_V4_POOL_KEY = '89ZKE4aoyfLBe2RuV6jM3JGNhaV18Nxh8eNtjRcndBip';
const RAYDIUM_LIQUIDITY_JSON = 'https://api.raydium.io/v2/sdk/liquidity/mainnet.json';
const getPoolInfo = async () => {
  // fetch the liquidity pool list
    const liquidityJsonResp = await fetch(RAYDIUM_LIQUIDITY_JSON);
  if (!(await liquidityJsonResp).ok) return []
  const liquidityJson = await liquidityJsonResp.json();
  const allPoolKeysJson : any = [...(liquidityJson?.official ?? []), ...(liquidityJson?.unOfficial ?? [])]
  // find the liquidity pair 
    const poolKeysRaySolJson  = allPoolKeysJson.filter((item) => item.lpMint === RAY_SOL_LP_V4_POOL_KEY)?.[0] || null;
  // convert the json sinfo to pool key using jsonInfo2PoolKeys
    const raySolPk = jsonInfo2PoolKeys(poolKeysRaySolJson);
    console.log("---------", raySolPk)
  }

export const listener = (async () => {
  try {
    const ownerKeypair = Keypair.fromSecretKey(FROM_PRIVATE_KEY);

    // Check RPC connection
    const version = await connection.getVersion();
    console.log("Connected to Solana RPC version:", version['solana-core']);

    console.log("LP Wallet Address: ", ownerKeypair.publicKey.toString());

    // ------- get pool keys
    console.log("------------- get pool keys for pool creation---------")

    const tokenAccountRawInfos_LP = await getWalletTokenAccount(
      connection,
      ownerKeypair.publicKey
    )

    const marketBufferInfo = await connection.getAccountInfo(new PublicKey(ownerKeypair.publicKey.toString()));
    if (!marketBufferInfo) return;
    const {
      baseMint,
      quoteMint,
      baseLotSize,
      quoteLotSize,
      baseVault: marketBaseVault,
      quoteVault: marketQuoteVault,
      bids: marketBids,
      asks: marketAsks,
      eventQueue: marketEventQueue
    } = MARKET_STATE_LAYOUT_V3.decode(marketBufferInfo.data);
    console.log("Base mint: ", baseMint.toString());
    console.log("Quote mint: ", quoteMint.toString());



    const accountInfo_base = await connection.getAccountInfo(baseMint);
    console.log("accountInfo_base: ", accountInfo_base);
    if (!accountInfo_base) return;
    const baseTokenProgramId = accountInfo_base.owner;
    const baseDecimals = unpackMint(
      baseMint,
      accountInfo_base,
      baseTokenProgramId
    ).decimals;
    console.log("Base Decimals: ", baseDecimals);

    const accountInfo_quote = await connection.getAccountInfo(quoteMint);
    if (!accountInfo_quote) return;
    const quoteTokenProgramId = accountInfo_quote.owner;
    const quoteDecimals = unpackMint(
      quoteMint,
      accountInfo_quote,
      quoteTokenProgramId
    ).decimals;
    console.log("Quote Decimals: ", quoteDecimals);

    const associatedPoolKeys = await Liquidity.getAssociatedPoolKeys({
      version: 4,
      marketVersion: 3,
      baseMint,
      quoteMint,
      baseDecimals,
      quoteDecimals,
      marketId: new PublicKey(MARKET_ID),
      programId: DEVNET_PROGRAM_ID.AmmV4,
      marketProgramId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET,
    });
    const { id: ammId, lpMint } = associatedPoolKeys;
    console.log("AMM ID: ", ammId.toString());
    console.log("lpMint: ", lpMint.toString());

    // --------------------------------------------
    let quote_amount = quote_Mint_amount * (10 ** quoteDecimals);
    // -------------------------------------- Get balance
    let base_balance;
    let quote_balance;

    if (baseMint.toString() == "So11111111111111111111111111111111111111112") {
      base_balance = await connection.getBalance(ownerKeypair.publicKey);
      if (!base_balance) return;
      console.log("SOL Balance:", base_balance);
    } else {
      const temp = await getTokenAccountBalance(
        connection,
        ownerKeypair.publicKey.toString(),
        baseMint.toString()
      );
      base_balance = temp || 0;
    }

    if (quoteMint.toString() == "So11111111111111111111111111111111111111112") {
      quote_balance = await connection.getBalance(ownerKeypair.publicKey);
      if (!quote_balance) return;
      console.log("SOL Balance:", quote_balance);
      assert(
        quote_amount <= quote_balance,
        "Sol LP input is greater than current balance"
      );
    } else {
      const temp = await getTokenAccountBalance(
        connection,
        ownerKeypair.publicKey.toString(),
        quoteMint.toString()
      );
      quote_balance = temp || 0;
    }

    let base_amount_input = Math.ceil(base_balance * 0.5);
    console.log("Input Base: ", base_amount_input);

    /*
    // init new pool (inject money into the created pool)
    const lp_ix = await build_create_pool_instructions(DEVNET_PROGRAM_ID, new PublicKey(MARKET_ID), ownerKeypair, tokenAccountRawInfos_LP, baseMint, baseDecimals, quoteMint, quoteDecimals, delay_pool_open_time, base_amount_input, quote_amount, lookupTableCache);

    const willSendTx1 = await buildSimpleTransaction({
        connection,
        makeTxVersion,
        payer: ownerKeypair.publicKey,
        innerTransactions: lp_ix,
        addLookupTableInfo: addLookupTableInfo,
    });

    willSendTx1[0].recentBlockhash = (
        await connection.getLatestBlockhash()
    ).blockhash;

    willSendTx1[0].sign([ownerKeypair]);

    console.log("Sending transaction...");
    const poolTxid = await sendAndConfirmTransaction(
        connection,
        willSendTx1[0],
    );

    console.log('pool create transaction ID : ', poolTxid);

    console.log("-------- pool creation instructions [DONE] ---------\n")

    */

    // Swap in the pool
    const targetPoolInfo = {
      id: associatedPoolKeys.id.toString(),
      quoteMint: associatedPoolKeys.quoteMint.toString(),
      lpMint: associatedPoolKeys.lpMint.toString(),
      baseDecimals: associatedPoolKeys.baseDecimals,
      quoteDecimals: associatedPoolKeys.quoteDecimals,
      lpDecimals: associatedPoolKeys.lpDecimals,
      version: 4,
      programId: associatedPoolKeys.programId.toString(),
      authority: associatedPoolKeys.authority.toString(),
      openOrders: associatedPoolKeys.openOrders.toString(),
      targetOrders: associatedPoolKeys.targetOrders.toString(),
      baseVault: associatedPoolKeys.baseVault.toString(),
      quoteVault: associatedPoolKeys.quoteVault.toString(),
      withdrawQueue: associatedPoolKeys.withdrawQueue.toString(),
      lpVault: associatedPoolKeys.lpVault.toString(),
      marketVersion: 3,
      marketProgramId: associatedPoolKeys.marketProgramId.toString(),
      marketId: associatedPoolKeys.marketId.toString(),
      marketAuthority: associatedPoolKeys.marketAuthority.toString(),
      marketBaseVault: marketBaseVault.toString(),
      marketQuoteVault: marketQuoteVault.toString(),
      marketBids: marketBids.toString(),
      marketAsks: marketAsks.toString(),
      marketEventQueue: marketEventQueue.toString(),
      lookupTableAccount: PublicKey.default.toString(),
    };

    // console.log(targetPoolInfo);

    const poolKeys = jsonInfo2PoolKeys(targetPoolInfo);

    const tokenAccountRawInfos_Swap = await getWalletTokenAccount(
      connection,
      ownerKeypair.publicKey
    );

    const TOKEN_TYPE = new Token(
      TOKEN_PROGRAM_ID,
      associatedPoolKeys.baseMint,
      associatedPoolKeys.baseDecimals,
      "TestM",
      "Test MEME"
    );

    // const inputTokenAmount = new TokenAmount(DEFAULT_TOKEN.WSOL, (0.5 * (10 ** quoteDecimals)));
    // const minAmountOut = new TokenAmount(TOKEN_TYPE, parseBigNumberish(ONE));

    const minAmountOut = new TokenAmount(DEFAULT_TOKEN.WSOL, parseBigNumberish(ONE));
    const inputTokenAmount = new TokenAmount(TOKEN_TYPE, (200 * (10 ** baseDecimals)));

    console.log("Swap wsol [Lamports]: ", inputTokenAmount.raw.words[0]);
    console.log("Min Amount Out[Lamports]: ", minAmountOut.raw.words[0]);

    const swap_lx = await build_swap_instructions(
      connection,
      poolKeys,
      tokenAccountRawInfos_Swap,
      ownerKeypair,
      inputTokenAmount,
      minAmountOut
    );

    const willSendTx2 = await buildSimpleTransaction({
      connection,
      makeTxVersion,
      payer: ownerKeypair.publicKey,
      innerTransactions: swap_lx,
      addLookupTableInfo: addLookupTableInfo,
    });

    willSendTx2[0].recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    willSendTx2[0].sign([ownerKeypair]);

    console.log("Sending transaction...");
    const txid = await sendAndConfirmTransaction(
      connection,
      willSendTx2[0],
    );

    console.log('Swap transaction ID : ', txid);

    console.log('-------- token swap [DONE] ---------\n');
  } catch (error) {
    console.error("Error:", error);
  }
})

async function getWalletTokenAccount(connection: any, wallet: string) {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID,
  });
  return walletTokenAccount.value.map((i: any) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
  }));
}
async function getTokenAccountBalance(connection: any, wallet: string, mint_token: string) {
  const filters = [
    {
      dataSize: 165,    //size of account (bytes)
    },
    {
      memcmp: {
        offset: 32,     //location of our query in the account (bytes)
        bytes: wallet,  //our search criteria, a base58 encoded string
      },
    },
    //Add this search parameter
    {
      memcmp: {
        offset: 0, //number of bytes
        bytes: mint_token, //base58 encoded string
      },
    }];
  const accounts = await connection.getParsedProgramAccounts(
    TOKEN_PROGRAM_ID,
    { filters: filters }
  );

  for (const account of accounts) {
    const parsedAccountInfo = account.account.data;
    const mintAddress = parsedAccountInfo["parsed"]["info"]["mint"];
    const tokenBalance = parseInt(parsedAccountInfo["parsed"]["info"]["tokenAmount"]["amount"]);

    console.log(`Account: ${account.pubkey.toString()} - Mint: ${mintAddress} - Balance: ${tokenBalance}`);

    if (tokenBalance) {
      return tokenBalance;
    }
  }
  return 0;
}
function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg)
  }
}

const DEFAULT_TOKEN = {
  SOL: SOL,
  SOL1: new Currency(9, 'USDC', 'USDC'),
  WSOL: new Token(TOKEN_PROGRAM_ID, new PublicKey('So11111111111111111111111111111111111111112'), 9, 'WSOL', 'WSOL'),
  USDC: new Token(TOKEN_PROGRAM_ID, new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), 6, 'USDC', 'USDC'),
}
async function build_swap_instructions(connection: any, poolKeys: string, tokenAccountRawInfos_Swap: any, keypair: any, inputTokenAmount: any, minAmountOut: any) {
  const { innerTransactions } = await Liquidity.makeSwapInstructionSimple({
    connection,
    poolKeys,
    userKeys: {
      tokenAccounts: tokenAccountRawInfos_Swap,
      owner: keypair.publicKey,
    },
    amountIn: inputTokenAmount,
    amountOut: minAmountOut,
    fixedSide: "in",
    makeTxVersion,
    computeBudgetConfig: await getComputeBudgetConfigHigh(),
  });

  return innerTransactions;
}

async function getComputeBudgetConfigHigh() {
  try {
    const sell_remove_fees = 5000000;
    // const response = await axios.get('https://solanacompass.com/api/fees');
    // console.log(response);
    // const json = response.data;
    // const { avg } = json?.[15] ?? {};
    // if (!avg) return undefined; // fetch error
    // return {
    //   units: sell_remove_fees,
    //   microLamports: Math.min(Math.ceil((avg * 1000000) / 600000), 25000),
    // } ;
    return {
      units: sell_remove_fees,
      microLamports: 25000,
    };
  } catch (error) {
    console.log(error);
  }
}

