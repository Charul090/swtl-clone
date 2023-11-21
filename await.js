import { AWAIT_SYMBOL } from './symbol.js';

export function Await ({ children }) {
	const template = children.find(element => typeof element === 'function');
	return {
		template
	};
}

Await.kind = AWAIT_SYMBOL;

export const when = (condition, template) => {
	return (condition ? template() : '');
};
