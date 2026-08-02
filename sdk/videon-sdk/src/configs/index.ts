export interface EnvConfig {
    baseUrl: string;
}


export const getEnvConfig = (): EnvConfig => {
return{
    baseUrl: process.env.VIDEON_BASE_URL || "http://localhost:8000/api/v1"
}
}
