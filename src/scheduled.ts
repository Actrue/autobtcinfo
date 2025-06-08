import { generateMessage,sendNtfyMessage} from "./ntfy";
import { appEnv } from "./appEnv";
export async function scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const coin of appEnv.coreCoin) {
        await sendNtfyMessage(await generateMessage(coin,env));
    }
}