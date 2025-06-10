import { generateMessage,sendNtfyMessage} from "./ntfy";
export async function scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {

    for (const coin of env.coreCoin) {
        const message=await generateMessage(coin)
        await env.KV.put(`加密货币${coin}信息日报`, message)
        await sendNtfyMessage(message);
    }
}