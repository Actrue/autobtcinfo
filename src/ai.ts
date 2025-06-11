import OpenAI from "openai";
import { okx } from "./okx";
import { env } from "cloudflare:workers";

const systemPromp=`
你是一个市场情绪分析师，你将获得以下市场数据
${okx.CrypotoPrompt}
            你需要根据以上数据判断市场的情绪。
            主要关注市场在超买和超卖时的回调现象
            你的回复格式是
            ## 市场情绪分析
            ## 根据市场情绪预计市场走向
            ## 根据市场情绪的策略建议
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

