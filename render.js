import { COMPONENT_SYMBOL } from "./symbol.js";

async function getValueFromReadableStream (readableStream) {
    const textDecoder = new TextDecoder();
    let response = '';
    for await(const chunk of readableStream) {
        response += textDecoder.decode(chunk);
    }

    return response;
}

async function* serializeChunk (chunk) {
    if (typeof chunk === 'string' || typeof chunk === 'boolean' || typeof chunk === 'number') {
        yield chunk
    } else if (Array.isArray(chunk)) {
        yield* await render(chunk);
    } else if (chunk?.kind === COMPONENT_SYMBOL) {
        yield* await serializeChunk(chunk.fn({ children: chunk.children, ...chunk.props }));
    } else if (chunk[Symbol.iterator] || chunk[Symbol.asyncIterator]) {
        yield* await render(chunk);
    } else if (String(chunk) === '[object Response]') {
        yield await getValueFromReadableStream(chunk.body);
    } else {
        const stringifiedChunk = chunk.toString();
        yield stringifiedChunk === '[object Object]' ? JSON.stringify(chunk) : stringifiedChunk;
    }
}

export async function* render (html) {
    for await(const chunk of html) {
        yield* await serializeChunk(chunk); 
    }
};

export async function renderToString(renderResult) {
    let result = "";
    for await (const string of render(renderResult)) {
        result += string;
    }
  
    return result;
  }
