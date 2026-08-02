import crypto from "crypto";
import { appConfig } from "../config";

const REDIS_KEY_SECRET = appConfig.redisKeySecret;

export function digest(plain: string) {
    return crypto.createHmac("sha256", REDIS_KEY_SECRET)
        .update(plain)
        .digest("hex");
}
