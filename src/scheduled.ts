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
                let message:string[]=[]
                if(cryptoDataInfo.data){
                    const deviation = cryptoDataInfo.data.deviationPercent
                    if(Math.abs(deviation) > 5){
                        const direction = deviation > 0 ? '高于' : '低于'
                        message.push(`【${coin}价格预警】\n`)
                        message.push(`当前价格: ${cryptoDataInfo.data.currentPrice} USDT\n`)
                        message.push(`5日均价: ${cryptoDataInfo.data.ma5} USDT\n`)
                        message.push(`偏离幅度: ${Math.abs(deviation).toFixed(2)}% ${direction}5日均值`)
                    }
                }
                if(message.length > 0) await sendNtfyMessage(message.toString());
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