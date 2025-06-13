import { generateMessage, sendNtfyMessage } from "./ntfy";
import { okx } from "./okx";

const coreCoin = ["BTC-USDT", 
    "ETH-USDT", 
    "SOL-USDT", 
    "OKB-USDT",
    "DOGE-USDT",
    "XRP-USDT",
    "BNB-USDT",
    "TRX-USDT",
    "ADA-USDT",
    "STETH-USDT"]

export async function scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    switch (controller.cron) {

        case "*/15 * * * *":
            // 执行15分钟的定时任务
            for (const coin of coreCoin) {
                const cryptoDataInfo = await okx.getCryptoInfo(coin)
                if(cryptoDataInfo.data){
                    if(Math.abs(cryptoDataInfo.data.deviationPercent) > 5){}
                    const message = `注意${coin},当前价格相比于5日均值偏离${cryptoDataInfo.data?.deviationPercent}%`
                    
                    await sendNtfyMessage(message);
                }
            }
            

        
            
          
            break;

        default:
            // 默认执行原有加密货币信息处理
            for (const coin of coreCoin) {
                const message = await generateMessage(coin);
                await env.KV.put(`加密货币${coin}信息日报`, message);
                await sendNtfyMessage(message);
            }
    }
    console.log("cron processed");
}