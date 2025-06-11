import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { okx } from "./okx.js";




  
const cryptoInfoSchema = z.object({
    instId: z.string().describe("加密货币交易对，例如 BTC-USDT")
});

export const cryptoInfoTool = tool(
    async ({ instId }) => {
        const result = await okx.getCryptoInfo(instId);
        return JSON.stringify(result);
    },
    {
        name: "get_crypto_info",
        description: "获取加密货币的市场信息，包括当前价格、移动平均线、交易量等数据",
        schema: cryptoInfoSchema
    }
);

export const toolsByName={
    [cryptoInfoTool.name]:cryptoInfoTool
}

export const tools={cryptoInfoTool}