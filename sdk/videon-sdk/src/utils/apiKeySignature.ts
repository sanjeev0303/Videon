export async function verifyApiKeySignature(plainKey: string){
    if(!plainKey || !plainKey.startsWith("VMX_")) return false;
    const parts = plainKey.split("_");
    if(parts.length < 3) return false;
    const keyId = parts[1];
    if(!/^[a-f0-9]{32}$/i.test(keyId)) return false;
    return true;
}
