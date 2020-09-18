import { createServer } from 'http';
import { parse as queryStringParse } from 'querystring';
import { parse as urlParse } from 'url';
import { readFileSync } from 'fs';

// HOST is set in heroku and not set locally
// use http locally, https on Heroku
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || `http://0.0.0.0:8000`;

function embed_from_data_query_param(data) {
  // for debugging for now, read file each time request received
  const embedScript = readFileSync('./script.js', 'utf-8');
  console.log('got data:', data);
  const escapedData = `var mix = ${decodeURI(data)}`;
  console.log(escapedData);
  const embedWithData = embedScript.replace(
    /\/\/ START TEMPLATE TARGET([\s\S]*?)END TEMPLATE TARGET/,
    escapedData
  );
  return embedWithData;
}

function example() {
  return `<html>
  <head>
    <link rel="stylesheet" type="text/css" href="/static/embed.css"/>
  </head>
  <body>
    <h1>Example</h1>
    <h2>Example of /embed route</h2>
    <script src="${HOST}/embed"></script>
  </body>`;
}

// We don't need all of these, but I thought it might be nice to have them all just in case
var mime = {
  html: 'text/html',
  txt: 'text/plain',
  css: 'text/css',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  js: 'application/javascript',
};

const routeRequest = async (method, path, query, response) => {
  console.log('ROUTE REQUEST:', method, path, JSON.stringify(query));
  if (method !== 'GET') {
    // Throw Error
    return;
  }
  let fileName = path.slice(1);
  let fileExtension = path.slice(-4);
  if (path.match(/^\/static\/.*/)) {
    console.log('FILENAME', fileName);
    if (fileExtension == '.png') {
      response.setHeader('Content-Type', 'image/png');
      response.end(readFileSync(fileName), 'binary');
    } else if (fileExtension == '.css') {
      response.setHeader('Content-Type', 'text/css');
      return readFileSync(fileName, 'utf-8');
    } else if (fileExtension == 'html') {
      response.setHeader('Content-Type', 'text/html');
      return readFileSync(fileName, 'utf-8');
    }
  } else if (path.match(/^\/embed/g)) {
    const { data } = query;
    response.setHeader('Content-Type', 'text/javascript');
    return await embed_from_data_query_param(data);
  } else if (path.match(/^\/example/g)) {
    response.setHeader('Content-Type', 'text/html');
    return example();
  } else if (path.match(/^\//g)) {
    response.setHeader('Content-Type', 'text/html');
    return '<html><head></head><body>Embed sections of audio</body></html>';
  }
  // TODO return 404 here
  throw new Error('unknown route');
};

async function onRequest(request, response) {
  const { path, search: queryString } = urlParse(request.url);
  const query = queryStringParse(queryString ? queryString.slice(1) : '');

  const responseBody = await routeRequest(
    request.method,
    path,
    query,
    response
  );
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.statusCode = 200;
  response.end(responseBody + '\n');
}

const server = createServer(onRequest);

server.listen(PORT, '0.0.0.0');
