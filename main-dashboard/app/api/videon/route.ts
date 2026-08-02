import { handleProcessRequest } from "@videon/sdk"


export async function POST(request:Request) {
    return handleProcessRequest({
        request,
        apiKey: process.env.VIDEON_API_KEY!,
    })
}
