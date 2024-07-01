import SettingBuy from '../models/schema/settingBuySchema';

export const webhook = async () => {
    await deleteWebhook()
    // getAllWebhooks()
    try {
        const wallet = await SettingBuy.find();
        const tokenAddresses = wallet.filter(obj => obj.status === true).map(obj => obj.tokenAddress ? obj.tokenAddress : obj.walletAddress);
        // console.log(tokenAddresses);
        const response = await fetch(
            // "https://mainnet.helius-rpc.com/v0/webhooks?api-key=d973a2d5-0d39-464d-9bc0-ed372343bd53",
            "https://api.helius.xyz/v0/webhooks?api-key=d973a2d5-0d39-464d-9bc0-ed372343bd53",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    webhookURL: "https://4186-91-239-130-102.ngrok-free.app/api/v0/webhooks",
                    transactionTypes: ["Any"],
                    accountAddresses: tokenAddresses,
                    webhookType: "enhanced", // "enhancedDevnet"
                }),
            }
        );

        const data = await response.json();
        console.log("-------CREATE------", data);
    } catch (err) {
        console.log(err);
    }
}

export const getAllWebhooks = async () => {
    try {
        const response = await fetch(
            "https://api.helius.xyz/v0/webhooks?api-key=d973a2d5-0d39-464d-9bc0-ed372343bd53",
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );
        const result = await response.json();
        console.log("-----GettingALL--------", { result });
        return result;

    } catch (e) {
        console.error("error", e);
    }
};

export const deleteWebhook = async (): Promise<void> => {

    try {
        const result: any = await getAllWebhooks();

        if (result && result.length > 0) {
            // Create an array of deletion promises
            const deletionPromises = result.map(async (obj: any) => {
                const response = await fetch(
                    `https://api.helius.xyz/v0/webhooks/${obj.webhookID}?api-key=d973a2d5-0d39-464d-9bc0-ed372343bd53`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
                console.log("Successfully deleted")
                // const data = await response.json();
                // console.log("--delete--", { data });
            });

            // Wait for all deletions to complete
            await Promise.all(deletionPromises);
        }

    } catch (e) {
        console.error("error", e);
    }
};