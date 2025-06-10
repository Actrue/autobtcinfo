import OpenAI from "openai";
import { okx } from "./okx";
import { env } from "cloudflare:workers";
const systemPromp=`
你是一个市场情绪分析师，你将获得以下市场数据
                coinType:instId,             // 币种类型
                timestamp: latestTimestamp,  // 最新数据的时间戳(毫秒)
                utc8Time,                   // UTC+8时间格式(YYYY-MM-DD HH:MM:SS)
                currentPrice,               // 当前价格(最新收盘价)
                maxPrice,                   // 6期数据中的最高价
                minPrice,                   // 6期数据中的最低价
                ma5,                        // 5期移动平均(旧数据)
                deviationPercent,           // 当前价格相对于MA5的偏移百分比
                volumeDeviationPercent,      // 前一日交易量相对于5日平均的偏移百分比
                以及仅五日的日k线数据
            你需要根据以上数据判断市场的情绪。
            你的回复格式是
            ## 市场情绪分析
            ## 根据市场情绪预计市场走向
`

export async function ai(coinType: string) {
    const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: env.deepseek_api_key,
    });
    const cryptoDataInfo = await okx.getCryptoInfo(coinType)
    if (!cryptoDataInfo.states) {
        console.log(cryptoDataInfo)
        throw new Error('获取数据失败')

    }
    const cryptoData = cryptoDataInfo.data!
    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: systemPromp }, { role: "user", content: JSON.stringify(cryptoData) }],
        model: "deepseek-chat",
        stream: false,
    });

   
    if(!completion.choices[0].message.content){
        console.log('获取ai数据失败')
        throw new Error('获取ai数据失败')
    }
   
    return completion.choices[0].message.content;
}

