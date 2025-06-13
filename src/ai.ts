import { okx } from "./okx";
import { env } from "cloudflare:workers";
import { ChatDeepSeek } from "@langchain/deepseek";
import { HumanMessage } from "@langchain/core/messages";
import { SystemMessage } from "@langchain/core/messages";

const llm = new ChatDeepSeek({
    apiKey: env.deepseek_api_key,
    temperature: 0.6,
    model: "deepseek-chat",
});


export async function ai(coinType: string) {
    const systemPromp = `
你是一个市场情绪分析师，你将获得以下市场数据
${okx.CrypotoPrompt}
            你需要根据以上数据判断市场的情绪。
            主要关注市场在超买和超卖时的回调现象
            你的回复格式是
            ## 市场情绪分析
            ## 根据市场情绪预计市场走向
            ## 根据市场情绪的策略建议
`

    const cryptoDataInfo = await okx.getCryptoInfo(coinType)

    if (!cryptoDataInfo.states) {
        console.log(cryptoDataInfo)
        throw new Error('获取数据失败')

    }
    let message = [new SystemMessage(systemPromp),new HumanMessage(`分析${coinType}的市场情绪,${JSON.stringify(cryptoDataInfo.data)}`)];
    
    const completion = await llm.invoke(message);

    if (!completion.content) {
        console.log('获取ai数据失败')
        throw new Error('获取ai数据失败')
    }

    return completion.content
}

