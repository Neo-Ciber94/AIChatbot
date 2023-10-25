import { type Stream } from "openai/streaming.mjs";
import {
  createParser,
  type ParsedEvent,
  type ReconnectInterval,
} from "eventsource-parser";
import { type ChatCompletionChunk } from "openai/resources/index.mjs";

export function OpenAIStream(response: Stream<ChatCompletionChunk>) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const responseStream = response.toReadableStream();

  const stream = new ReadableStream({
    async start(controller) {
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === "event") {
          const data = event.data;
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data) as ChatCompletionChunk;
            const text = json.choices[0].delta.content as string;
            // if (counter < 2 && (text.match(/\n/) || []).length) {
            //   return;
            // }
            const queue = encoder.encode(text);
            controller.enqueue(queue);
            //counter++;
          } catch (e) {
            controller.error(e);
          }
        }
      }

      // stream response (SSE) from OpenAI may be fragmented into multiple chunks
      // this ensures we properly read chunks & invoke an event for each SSE event stream
      const parser = createParser(onParse);

      // https://web.dev/streams/#asynchronous-iteration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const chunk of responseStream as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
}
