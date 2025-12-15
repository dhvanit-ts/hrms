import { createAgent, tool } from "langchain";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { loadEnv } from "@/config/env";
import * as z from "zod";

const runAgent = async () => {
  try {
    const env = loadEnv()
    const getWeather = tool(
      (input) => `It's always sunny in ${input.city}!`,
      {
        name: "get_weather",
        description: "Get the weather for a given city",
        schema: z.object({
          city: z.string().describe("The city to get the weather for"),
        }),
      }
    );

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash-lite",
      temperature: 0,
      apiKey: env.GEMINI_API_KEY,
    });

    const agent = createAgent({
      model,
      tools: [getWeather],
    });

    const response = await agent.invoke({
      messages: [{ role: "user", content: "What's the weather in Tokyo?" }],
    })

    const parsed = response.messages

    console.log(parsed)
    console.log(parsed[parsed.length - 1]);
  } catch (error) {
    console.error(error);
  }
};

runAgent();