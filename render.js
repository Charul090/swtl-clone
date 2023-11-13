import { COMPONENT_SYMBOL } from "./symbol.js";

function* serializeChunk (chunk) {
    if (typeof chunk === 'string' || typeof chunk === 'boolean' || typeof chunk === 'number') {
        yield chunk
    } else if (Array.isArray(chunk)) {
        yield* render(chunk);
    } else if (chunk?.kind === COMPONENT_SYMBOL) {
        yield* serializeChunk(chunk.fn({ children: chunk.children, ...chunk.props }));
    } else if (chunk[Symbol.iterator] || chunk[Symbol.asyncIterator]) {
        yield* render(chunk);
    } else {
        const stringifiedChunk = chunk.toString();
        yield stringifiedChunk === '[object Object]' ? JSON.stringify(chunk) : stringifiedChunk;
    }
}

export function* render (html) {
    for(const chunk of html) {
        yield* serializeChunk(chunk); 
    }
};

export async function renderToString(renderResult) {
    let result = "";
    for (const string of render(renderResult)) {
        result += string;
    }
  
    return result;
  }
