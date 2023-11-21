import { html } from './html.js';
import { AWAIT_SYMBOL, COMPONENT_SYMBOL } from './symbol.js';

async function getValueFromReadableStream (readableStream) {
	const textDecoder = new TextDecoder();
	let response = '';
	for await(const chunk of readableStream) {
		response += textDecoder.decode(chunk);
	}

	return response;
}

async function* serializeChunk (chunk, promiseArray) {
	if (typeof chunk === 'string' || typeof chunk === 'boolean' || typeof chunk === 'number') {
		yield chunk;
	} else if (Array.isArray(chunk)) {
		yield* processTemplate(chunk, promiseArray);
	} else if (chunk?.kind === COMPONENT_SYMBOL && chunk?.fn.kind === AWAIT_SYMBOL) {
		const { promise } = chunk.props;
		const { template } = chunk.fn({ children: chunk.children });
		const id = promiseArray.length;
		promiseArray.push(
			promise()
				.then((data) => {
					return { id, template: template({ success: true, error: false, pending: false }, data, null) };
				})
				.catch((error) => {
					return { id, template: template({ success: false, error: true, pending: false }, null, error)};
				})
		);
		yield* processTemplate(html`<awaiting-promise style="display:contents" data-id="${String(id)}">${template({ success: false, error: false, pending: true }, null, null)}</awaiting-promise>`, promiseArray);
	} else if (chunk?.kind === COMPONENT_SYMBOL) {
		yield* serializeChunk(chunk.fn({ children: chunk.children, ...chunk.props }), promiseArray);
	} else if (chunk[Symbol.iterator] || chunk[Symbol.asyncIterator]) {
		yield* processTemplate(chunk, promiseArray);
	} else if (String(chunk) === '[object Response]') {
		yield await getValueFromReadableStream(chunk.body);
	} else {
		const stringifiedChunk = chunk.toString();
		yield stringifiedChunk === '[object Object]' ? JSON.stringify(chunk) : stringifiedChunk;
	}
}

async function* processTemplate (html, promiseArray) {
	for await(const chunk of html) {
		yield* serializeChunk(chunk, promiseArray); 
	}
}

export async function* render (parsedData) {
	const promiseArray = [];
	yield* processTemplate(parsedData, promiseArray);

	while (promiseArray.length > 0) {
		const { id, template } = await Promise.race(promiseArray);
		promiseArray.splice(id, 1);
		yield* render(html`
        <template data-id="${String(id)}">${template}</template>
        <script>
        {
            const currElem = document.querySelector('awaiting-promise[data-id="${String(id)}"]');
            const newElem = document.querySelector('template[data-id="${String(id)}"]').content.cloneNode(true);
            currElem.replaceWith(newElem);
        }
        </script>
        `);
	}
}

export async function renderToString(renderResult) {
	let result = '';
	for await (const string of render(renderResult)) {
		result += string;
	}
  
	return result;
}
