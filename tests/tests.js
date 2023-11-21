import assert from 'node:assert';
import { describe, it } from 'node:test';
import { html } from '../html.js';
import { renderToString } from '../render.js';
import { COMPONENT_SYMBOL } from "../symbol.js";
import { HtmlPage } from '../HtmlPage/index.js';
import { Await, when } from '../await.js';

function Foo() {}
function Bar({ children }) {
  return html`<div><h2>bar</h2>${children}</div>`;
}
function Baz() {
  return html`<h2>baz</h2>`;
}

function unwrap(generator) {
  const result = [];

  let next = generator.next();
  while(!next.done) {
    const val = next.value;
    // console.log(next);
    result.push(val);
    next = generator.next();
  }

  return result;
}

describe('parsing', () => {
  it('handles html', () => {
    const result = unwrap(html`<h1>hello</h1>`);
    assert.deepStrictEqual(result[0], `<h1>hello</h1>`);
  });

  it('handles expressions', () => {
    const result = unwrap(html`<h1>hello</h1>${1}`);
    assert.deepStrictEqual(result[0], `<h1>hello</h1>`);
    assert.deepStrictEqual(result[1], 1);
  });

  it('handles falsey expressions', () => {
    const result = unwrap(html`<h1>hello</h1>${0}`);
    assert.deepStrictEqual(result[1], 0);
  });

  it('handles falsey expressions', () => {
    const result = unwrap(html`<h1>hello</h1>${false}`);
    assert.deepStrictEqual(result[1], false);
  });

  it('handles arrays', () => {
    const result = unwrap(html`<h1>${[1,2]}</h1>`);
    // console.log(result);

    assert.deepStrictEqual(result[0], `<h1>`);
    assert.deepStrictEqual(result[1], [1,2]);
  });

  it('handles components', () => {
    const result = unwrap(html`<h1>hello</h1><${Foo}/>`);
    assert.deepStrictEqual(result[0], `<h1>hello</h1>`);
    assert.deepStrictEqual(result[1].fn, Foo);
  });

  it('handles html after components', () => {
    const result = unwrap(html`<h1>hello</h1><${Foo}/><h2>bye</h2>`);

    assert.deepStrictEqual(result[0], `<h1>hello</h1>`);
    assert.equal(result[1].fn, Foo);
    assert.deepStrictEqual(result[2], `<h2>bye</h2>`);
  });

  it('handles components with props and expressions', () => {
    const result = unwrap(html`<${Foo} a=${1}/>${2}`);
    assert.equal(result[0].fn, Foo);
    assert.equal(result[1], 2);
  });
});

describe('props', () => {
  it('strings double quote', () => {
    const result = unwrap(html`<${Foo} bar="1"/>`);
    assert.deepStrictEqual(result[0].props, { bar: "1" });
  });

  it('strings single quote', () => {
    const result = unwrap(html`<${Foo} bar='1'/>`);
    assert.deepStrictEqual(result[0].props, { bar: '1'});
  });

  it('without quotes', () => {
    const result = unwrap(html`<${Foo} bar=1/>`);
    assert.deepStrictEqual(result[0].props, { bar: '1'});
  });

  it('dynamic expressions with double quotes', () => {
    const result = unwrap(html`<${Foo} bar="${1}"/>`);
    assert.deepStrictEqual(result[0].props, { bar: 1});
  });

  it('dynamic expressions with single quotes', () => {
    const result = unwrap(html`<${Foo} bar='${1}'/>`);
    assert.deepStrictEqual(result[0].props, { bar: 1});
  });

  it('dynamic expressions without quotes', () => {
    const result = unwrap(html`<${Foo} bar=${1}/>`);
    assert.deepStrictEqual(result[0].props, { bar: 1});
  });

  it('boolean', () => {
    const result = unwrap(html`<${Foo} bar/>`);
    assert.deepStrictEqual(result[0].props, { bar: true});
  });

  it('boolean', () => {
    const result = unwrap(html`<${Foo} bar><//>`);
    assert.deepStrictEqual(result[0].props, { bar: true});
  });

  it('spread', () => {
    const result = unwrap(html`<${Foo} ...${{a: 1, b: 2}}/>`);
    assert.deepStrictEqual(result[0].props, {a: 1, b: 2});
  });

  it('spread and regular string', () => {
    const result = unwrap(html`<${Foo} ...${{a: 1, b: 2}} bar="baz"/>`);
    assert.deepStrictEqual(result[0].props, {a: 1, b: 2, bar: 'baz'});
  });

  describe('multiple', () => {
    it('strings double quote', () => {
      const result = unwrap(html`<${Foo} bar="1" foo="2"/>`);
      assert.deepStrictEqual(result[0].props, {bar: '1', foo: '2' });
    });

    it('strings single quote', () => {
      const result = unwrap(html`<${Foo} bar='1' foo='2'/>`);
      assert.deepStrictEqual(result[0].props, {bar: '1', foo: '2' });
    });

    it('without quotes', () => {
      const result = unwrap(html`<${Foo} bar=1 foo=2/>`);
      assert.deepStrictEqual(result[0].props, {bar: '1', foo: '2' });
    });

    it('without quotes dynamic static', () => {
      const result = unwrap(html`<${Foo} bar=${1} foo=2/>`);
      assert.deepStrictEqual(result[0].props, {bar: 1, foo: '2' });
    });

    it('without quotes static dynamic', () => {
      const result = unwrap(html`<${Foo} bar=1 foo=${2}/>`);
      assert.deepStrictEqual(result[0].props, {bar: '1', foo: 2 });
    });

    it('with quotes static dynamic', () => {
      const result = unwrap(html`<${Foo} bar="1" foo="${2}"/>`);
      assert.deepStrictEqual(result[0].props, {bar: '1', foo: 2 });
    });

    it('with quotes dynamic static', () => {
      const result = unwrap(html`<${Foo} bar="${1}" foo="2"/>`);
      assert.deepStrictEqual(result[0].props, {bar: 1, foo: '2' });
    });
  });
});

describe('children', () => {
  it('handles expression children', () => {
    const template = unwrap(html`<${Foo}>${1}<//>`);
    assert.deepStrictEqual(template[0].children, [1]);
  });

  it('handles string children', () => {
    const template = unwrap(html`<${Foo}><h1>hi</h1><//>`);
    assert.deepStrictEqual(template[0].children, ['<h1>hi</h1>']);
  });

  it('handles string children', () => {
    const template = unwrap(html`<${Foo}><h1>hi</h1><//>`);
    assert.deepStrictEqual(template[0].children, ['<h1>hi</h1>']);
  });

  it('handles string children with expressions', () => {
    const template = unwrap(html`<${Foo}><h1>hi ${2}</h1><//>`);
    assert.deepStrictEqual(template[0].children, ['<h1>hi ', 2, '</h1>']);
  });

  it('handles string children with expressions', () => {
    const template = unwrap(html`<${Foo}><h1>hi ${2}</h1><//>`);
    assert.deepStrictEqual(template[0].children, ['<h1>hi ', 2, '</h1>']);
  });

  it('handles falsey expressions in children', () => {
    const template = unwrap(html`<${Foo}><h1>hi ${0}</h1><//>`);
    assert.deepStrictEqual(template[0].children, ['<h1>hi ', 0, '</h1>']);
  });

  it('handles falsey expressions as last dynamic value', () => {
    const template = unwrap(html`<${Foo}/>${false}`);
    assert.deepStrictEqual(template[1], false);
  });

  it('handles Component children', () => {
    const template = unwrap(html`<${Foo}><${Bar}/><//>`);
    assert.deepStrictEqual(template[0].children, 
      [
        {
          fn: Bar,
          props: {},
          children: [],
          kind: COMPONENT_SYMBOL
        }
      ]);
  });

  it('handles Component children with closing tag', () => {
    const template = unwrap(html`<${Foo}><${Bar}><//><//>`);
    assert.deepStrictEqual(template[0].children, 
      [
        {
          fn: Bar,
          props: {},
          children: [],
          kind: COMPONENT_SYMBOL
        }
      ]);
  });

  it('handles sibling Component children', () => {
    const template = unwrap(html`<${Foo}><${Bar}/><${Baz}/><//>`);
    assert.deepStrictEqual(template[0].children, 
      [
        {
          fn: Bar,
          props: {},
          children: [],
          kind: COMPONENT_SYMBOL
        },
        {
          fn: Baz,
          props: {},
          children: [],
          kind: COMPONENT_SYMBOL
        },
      ]);
  });

  it('handles multiple Component children', () => {
    const template = unwrap(html`<${Foo}>
      <${Bar}/>
      <${Baz}/>
    <//>`);
    assert.deepStrictEqual(template.find(i => i.kind === COMPONENT_SYMBOL).children.filter(c => c.kind === COMPONENT_SYMBOL), 
      [
        {
          fn: Bar,
          props: {},
          children: [],
          kind: COMPONENT_SYMBOL
        },
        {
          fn: Baz,
          props: {},
          children: [],
          kind: COMPONENT_SYMBOL
        },
      ]);
  });
});

describe('renderToString', () => {
  function Foo() {
    return html`<h1>foo</h1>`
  }

  function Bar({children}) {
    return html`<h1>${children}</h1>`
  }

  function Baz({children}) {
    return html`<h2>${children}</h2>`
  }

  it('basic', async () => {
    const result = await renderToString(html`<h1>hello</h1>`);
    assert.equal(result, '<h1>hello</h1>');
  });

  it('expressions', async () => {
    const result = await renderToString(html`<h1>hello ${1}</h1>`);
    assert.equal(result, '<h1>hello 1</h1>');
  });

  it('components', async () => {
    const result = await renderToString(html`<${Foo}/>`);
    assert.equal(result, '<h1>foo</h1>');
  });

  it('components children', async () => {
    const result = await renderToString(html`<${Bar}>bar<//>`);
    assert.equal(result, '<h1>bar</h1>');
  });

  it('falsey values', async () => {
    const result = await renderToString(html`<h1>${0}${false}</h1>`);
    assert.equal(result, '<h1>0false</h1>');
  });

  it('objects', async () => {
    const result = await renderToString(html`<h1>${{a: 2}}</h1>`);
    assert.equal(result, '<h1>{"a":2}</h1>');
  });
  
  it('components nested children', async () => {
    const result = await renderToString(html`<h1><Hello</h1><${Bar}><h1>Hello</h1><${Baz}>baz<//><//>`);
    assert.equal(result, '<h1><Hello</h1><h1><h1>Hello</h1><h2>baz</h2></h1>');
  });

  it('generator', async () => {
    function* generator() {
      yield* html`<li>1</li>`;
      yield* html`<li>2</li>`;
    }

    const result = await renderToString(html`<ul>${generator()}</ul>`);
    assert.equal(result, '<ul><li>1</li><li>2</li></ul>');
  });

  it('stream', async () => {
    const stream = new ReadableStream({
      start(controller) {
        ['a', 'b', 'c'].forEach(s => controller.enqueue(s));
        controller.close();
      }
    });
    const result = await renderToString(html`<ul>${stream}</ul>`);
    assert.equal(result, '<ul>abc</ul>');
  });

  it('response', async () => {
    const response = new Response('<h1>hello</h1>');
    const result = await renderToString(html`<main>${response}</main>`);
    assert.equal(result, '<main><h1>hello</h1></main>');
  });

  it('Component returning response', async () => {
    function Foo() {
      return new Response('hi');
    }
    const result = await renderToString(html`<main><${Foo}/></main>`);
    assert.equal(result, '<main>hi</main>');
  });

  it('Async', async () => {
    const result = await renderToString(html`<${Await} promise=${() => new Promise(r => setTimeout(() => r({foo: 'bar'}), 100))}>
    ${({ pending, success }, data) => html`
        ${when(pending, () => html`[PENDING]`)}
        ${when(success, () => html`[RESOLVED] ${data.foo}`)}
      `}
    <//>`);
    assert.equal(result, `<awaiting-promise style="display: contents;" data-id="0">
    [PENDING]
    
  </awaiting-promise>
  <template data-id="0">
    
    [RESOLVED] bar
  </template>
  <script>
    {
      let currElem = document.querySelector('awaiting-promise[data-id="0"]');
      const newElem = document.querySelector('template[data-id="0"]').content.cloneNode(true);
      currElem.replaceWith(template);
    }
  </script>`);
  });

  // it('kitchensink', async () => {
  //   function Html({children}) {
  //     return html`<html><body>${children}</body></html>`;
  //   }

  //   function Foo({bar, baz}) {
  //     return html`<h2>foo ${bar} ${baz}</h2>`
  //   }

  //   const result = await renderToString(html`<${Html}><h1>welcome ${1}</h1><${Foo} bar=${1} baz="2"/><footer>copyright</footer><//>`)
  //   assert.equal(result, '<html><body><h1>welcome 1</h1><h2>foo 1 2</h2><footer>copyright</footer></body></html>');
  // });

  // it('test code of components nested', async () => {
  //   const htmlPage = html`<${HtmlPage} title="Home">
  //   <h1>Home</h1>
  //   <nav>
  //     <${BreadCrumbs} path=${request.url.pathname}/>
  //   </nav>
  //   <ul>
  //     ${['foo', 'bar', 'baz'].map(i => html`<li>${i}</li>`)}
  //   </ul>
  //   <${Footer}/>
  // <//>`
  // console.log(renderToString(htmlPage));
  // })
});