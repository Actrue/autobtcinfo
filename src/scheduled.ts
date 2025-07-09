import { generateMessage, sendNtfyMessage } from "./ntfy";
import { env } from "cloudflare:workers";
import { okx } from "./okx";


const coreCoin = [
    "XRP-USDT",
    "BTC-USDT", 
    "ETH-USDT", 
    "SOL-USDT", 
    "OKB-USDT",
    "DOGE-USDT",
    "TRUMP-USDT",
    "BCH-USDT",
    "TRX-USDT",
   
    ]

export async function scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    switch (controller.cron) {

        case "*/15 * * * *":
            // 执行15分钟的定时任务
            for (const coin of coreCoin) {
                const cryptoDataInfo = await okx.getCryptoInfo(coin)
                let message:string[]=[]
                if(cryptoDataInfo.data){
                    const deviation = cryptoDataInfo.data.deviationPercent
                    if(Math.abs(deviation) > 2){
                        const direction = deviation > 0 ? '高于' : '低于'
                        message.push(`【${coin}价格预警,市场超卖超买\n`)
                       
                    }
                }
                if(message.length > 0) {
                    const cacheKey = `cache_${coin}_price_alert`;
                    const cachedMessage = await env.KV.get(cacheKey);
                    const currentMessage = message.join('');
                    
                    if(cachedMessage !== currentMessage) {
                        await env.KV.put(cacheKey, currentMessage,{expirationTtl: 60 * 60 * 5});
                        await sendNtfyMessage(currentMessage);
                    }
                }
            }
            const 上班信号=await okx.上班信号()
            if(上班信号.states && 上班信号.signal){
                const cacheKey = 'cache_work_signal';
                const cachedSignal = await env.KV.get(cacheKey);
                if(!cachedSignal){
                    await env.KV.put(cacheKey, 'sent', {expirationTtl: 60 * 60 * 5});
                    await sendNtfyMessage(上班信号.msg);
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
 
}