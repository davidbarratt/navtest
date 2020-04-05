import React from 'react';
import { Router } from 'service-worker-router';
import { renderToStaticMarkup } from 'react-dom/server';

const router = new Router();

function App({
  title,
  children
}) {
  return (
    <html>
      <head>
        <title>{title}</title>
      </head>
      <body>
        <h1>{title}</h1>
        {children}
      </body>
    </html>
  );
}

function Form({
  action,
  num,
  children,
}) {
  return (
    <form action={action} method="post">
      <h2>{num}</h2>
      <button type="submit" name="action" value="increment">+</button><button type="submit" name="action" value="decrement">-</button>
      {children}
    </form>
  );
}

function createHTMLResponse(html) {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
};

async function indexPage() {
  return createHTMLResponse(
    renderToStaticMarkup(
      <App title="Navigation Test">
        <ul>
          <li><a href="/post">Post</a></li>
          <li><a href="/post-redirect-get">Post/Redirect/Get</a></li>
        </ul>
      </App>
    )
  );
}

async function postNavigation({ method, request, url, }) {
  let num = 0;
  if (method === 'POST') {
    const data = await request.formData();
    num = parseInt(data.get('num'), 10);
    switch (data.get('action')) {
      case 'increment':
        num = num + 1;
        break;
      case 'decrement':
        num = num - 1;
        break;
    }
  }

  return createHTMLResponse(
    renderToStaticMarkup(
      <App title="Post">
        <Form action="/post" num={num}>
          <input type="hidden" name="num" value={num} />
        </Form>
      </App>
    )
  );
}

async function getNavigation({
  params: { num }
}) {
  const value = num ? parseInt(num, 10) : 0;
  return createHTMLResponse(
    renderToStaticMarkup(
      <App title="Post/Redirect/Get">
        <Form action="" num={value} />
      </App>
    )
  );
}

async function handlePost({
  request,
  url,
  params: { num }
}) {
  let value = num ? parseInt(num, 10) : 0;
  const data = await request.formData();
  switch (data.get('action')) {
    case 'increment':
      value = value + 1;
      break;
    case 'decrement':
      value = value - 1;
      break;
  }

  return new Response(undefined, {
    status: 302,
    headers: {
      'Location': (new URL(`/post-redirect-get/${value}`, url)).toString(),
    },
  })
}


// Define routes and their handlers
router.all('/post', postNavigation);
router.get('/post-redirect-get/:num', getNavigation);
router.get('/post-redirect-get', getNavigation);
router.post('/post-redirect-get/:num', handlePost);
router.post('/post-redirect-get', handlePost);
router.get('/', indexPage);

// Set up service worker event listener
addEventListener('fetch', event => {
  // Will test event.request against the defined routes
  // and use event.respondWith(handler) when a route matches
  router.handleEvent(event);
});

