import { ChatDeepSeek } from "@langchain/deepseek";
import { env } from "cloudflare:workers";
import { HumanMessage } from "@langchain/core/messages";
import {  toolsByName,tools } from "./tools.js";
import { SystemMessage } from "@langchain/core/messages";

const llm = new ChatDeepSeek({
    apiKey: env.deepseek_api_key,
    temperature: 0.6,
    model: "deepseek-chat",
});


const llmWithTools = llm.bindTools([tools.cryptoInfoTool]);

async function ai(coinType: string) {
    const systemMessage = `
你是一个市场情绪分析师，
            你需要调用工具获得市场数据，然后进行分析。
            你的回复格式是
            ## 市场情绪分析
            ## 根据市场情绪预计市场走向
`

    const messages = [new SystemMessage(systemMessage),new HumanMessage(`分析${coinType}的市场情绪`)]
    console.log("huamanmessages:",messages[0],messages[1])

    const aimessage = await llmWithTools.invoke(messages);

    console.log("aimessage:",aimessage.tool_calls)
    messages.push(aimessage)
    if (aimessage.tool_calls) {
 
        
        
        for (const toolCall of aimessage.tool_calls) {
            const selectedTool = toolsByName[toolCall.name];
            
            const toolMessage = await selectedTool.invoke(toolCall);
            console.log("toolMessage:",toolMessage)
            messages.push(toolMessage);
        }
        // 将工具结果推送给模型获取最终响应
        const finalResponse = await llmWithTools.invoke(messages);
        console.log("finalResponse:",finalResponse)
        return {
            states: true,
            message: '分析完成',
            data: finalResponse.content
        }
    }

    return {
        states: false,
        message: '未调用任何工具',
        data: null
    }
}

export const langchain = {
    ai
}



