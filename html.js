import { COMPONENT_SYMBOL } from "./symbol.js";

const TRAVERSAL_MODE = {
    DATA: 'DATA',
    COMPONENT: 'COMPONENT'
};

const LEVEL = {
    PARENT: 'PARENT',
    CHILD: 'CHILD'
};

function getProps (i, j, statics, dynamics) {
    const props = {};
    let property = '';
    let value = '';
    let isValue = false;
    let isKey = false;
    
    while (statics[i][j] && statics[i][j] !== '>') {
        const isEmptyString = statics[i][j].trim() === '';
        const isEquals = statics[i][j] === '=';
        const isSingleInvertedComma = statics[i][j] === "'";
        const isDoubleInvertedComma = statics[i][j] === '"';
        const isForwardSlash = statics[i][j] === '/';
        const isCurrentCharPeriod = statics[i][j] === '.';
        const isCurrentIndexEndOfStatics = j === statics[i].length - 1;
        const isNextIndexEndOfStatics = j === statics[i].length - 2;
        const isNextCharSingleInvertedComma = statics[i][j+1] === "'";
        const isNextCharDoubleInvertedComma = statics[i][j+1] === '"';
        const isDestructuringProps = statics[i].slice(j, j+4) === '...' && j === statics[i].length - 3;

        if (!isKey && !isValue && isCurrentCharPeriod && isDestructuringProps) {
            Object.keys(dynamics[i]).forEach(propKey => {
                props[propKey] = dynamics[i][propKey];
            });
            i++;
            j = 0;
        } else if (!isValue && !isKey && !isEmptyString && !isDoubleInvertedComma && !isSingleInvertedComma && !isForwardSlash) {
            isKey = true;
            property += statics[i][j];
        } else if (isKey && !isValue && isEquals && (isCurrentIndexEndOfStatics || (isNextIndexEndOfStatics && (isNextCharSingleInvertedComma || isNextCharDoubleInvertedComma))) && dynamics[i] != null ) {
            props[property] = dynamics[i];
            property = '';
            isKey = false;
            isValue = false;
            i++;
            j = 0;
            continue;
        } else if (isKey && !isValue && isEquals) {
            isKey = false;
            isValue = true;
            if (isNextCharDoubleInvertedComma || isNextCharSingleInvertedComma) {
                j++;
            }
        } else if (isKey && !isValue && property && (isEmptyString || isForwardSlash)) {
            props[property] = true;
            property = '';
            isKey = false;
        } else if (isKey && !isValue) {
            property += statics[i][j];
        } else if (isValue && !isKey && !isEquals && !isDoubleInvertedComma && !isSingleInvertedComma && !isForwardSlash && !isEmptyString) {
            value += statics[i][j];
        } else if (isValue && !isKey && (isEmptyString || isForwardSlash || isDoubleInvertedComma || isSingleInvertedComma)) {
            props[property] = value;
            property = '';
            value = '';
            isValue = false;
            isKey = false;
        }

        j++;
    }

    if (property) {
        props[property] = value ? value : true;
    }
    const isComponentClosed = statics[i][j - 1] === '/';

    return { props, isComponentClosed, updatedIndexes: [i,j] };
}

export function* html (statics, ...dynamics) {
    if (dynamics.length === 0) {
        yield* statics
    }
    const isComponentPresent = dynamics.some(dynamicValue => typeof dynamicValue === 'function');
    if (!isComponentPresent) {
        yield* statics.reduce((acc, curr, index) => {
            return [...acc, curr, ...(dynamics[index] != null ? [dynamics[index]] : [])]
        }, []);
    }

    let currentTraversalMode = TRAVERSAL_MODE.DATA;
    let currentLevel = LEVEL.PARENT;
    let htmlString = '';
    const componentStack = [];
    for(let i = 0; i < statics.length; i++) {
        for(let j = 0; j <statics[i].length; j ++) {
            if (currentTraversalMode === TRAVERSAL_MODE.DATA) {
                if (j === statics[i].length - 1 && statics[i][j] === '<') {
                    if (htmlString) {
                        yield htmlString;
                        htmlString = '';
                    }
                    const component = { fn: dynamics[i], children: [], kind: COMPONENT_SYMBOL };;
                    i += 1;
                    j = 0;
                    const { props, isComponentClosed, updatedIndexes } = getProps(i, j, statics, dynamics);
                    [i, j] = updatedIndexes;
                    component.props = props;
                    if (currentLevel === LEVEL.CHILD) {
                        componentStack[componentStack.length - 1].children.push(component);
                        if (!isComponentClosed) {
                            componentStack.push(component);
                        }
                    } else if (!isComponentClosed) {
                        componentStack.push(component);
                        currentLevel = LEVEL.CHILD;
                        currentTraversalMode = TRAVERSAL_MODE.COMPONENT;
                        if (j === statics[i].length - 1 && dynamics[i] != null ) {
                            component.children.push(dynamics[i]);
                            continue;
                        }
                    } else {
                        yield component;
                    }
                } else if (j === statics[i].length - 1 && dynamics[i] != null ) {
                    yield* [htmlString + statics[i][j], dynamics[i]];
                    htmlString = ''
                } else {
                    htmlString += statics[i][j];
                }
                if (j === statics[i].length - 1 && dynamics[i] != null ) {
                    if (htmlString) {
                        yield htmlString;
                        htmlString = ''
                    }
                    yield dynamics[i];
                }
            } else if (currentTraversalMode === TRAVERSAL_MODE.COMPONENT) {
                // component encountered
                if (j === statics[i].length - 1 && statics[i][j] === '<') {
                    if (htmlString) {
                        yield htmlString;
                        htmlString = '';
                    }
                    const component = { fn: dynamics[i], children: [], kind: COMPONENT_SYMBOL };;
                    i += 1;
                    j = 0;
                    const { props, isComponentClosed, updatedIndexes } = getProps(i, j, statics, dynamics);
                    [i, j] = updatedIndexes;
                    component.props = props;
                    componentStack[componentStack.length - 1].children.push(component);
                    if (!isComponentClosed) {
                        componentStack.push(component);
                    }
                    
                    if (j === statics[i].length - 1 && dynamics[i] != null ) {
                        component.children.push(dynamics[i]);
                    }
                    // component closing tag encountered
                } else if (statics[i][j] === '<' && statics[i][j+1] === '/' && statics[i][j + 2] === '/') {
                    const component = componentStack.pop();
                    if (htmlString) {
                        component.children.push(htmlString);
                        htmlString = '';
                    }
                    if (componentStack.length === 0) {
                        yield component;
                        currentLevel = LEVEL.PARENT;
                        currentTraversalMode = TRAVERSAL_MODE.DATA;
                    }
                    j+= 3;
                } else if (j === statics[i].length - 1 && dynamics[i] != null ) {
                    componentStack[componentStack.length - 1].children.push(htmlString + statics[i][j], dynamics[i]);
                    htmlString = '';
                } else {
                    htmlString += statics[i][j];
                }
            }
        }
    }
    if (htmlString) {
        yield htmlString;
    }
}
