export function render (html) {
    const textEncoder = new TextEncoder();
    const byteHtml = textEncoder.encode(html);
    const readAbleStream = new ReadableStream({
        pull: (controller) => {
            controller.enqueue(byteHtml);
            controller.close();
        }
    });
    const headers = { 
        'Content-Type': 'text/html'
    };
    const response = new Response(readAbleStream, { headers })
    return response;
};
