# sp2010-rest [![Build Status](https://secure.travis-ci.org/TheWebShop/sp2010-rest.png?branch=master)](http://travis-ci.org/TheWebShop/sp2010-rest)

> Connect middleware that simulates the SharePoint 2010 RESTful interface.

## Getting Started
1. Install the module with: `npm install sp2010-rest`
2. Create a static `.json` file with a sample REST output the list you'd like to emulate.
3. Pass `sp2010-rest` into an Express server as middleware, telling it where to find those `.json` files.

```javascript
var connect = require('connect');
var sp2010rest = require('sp2010-rest');

var app = connect()
  .use(sp2010rest(connect, 'lists')) // prioritise REST emulation above your other routes
  .use(connect.static('public'))
  .listen(3000);
```

Here's a [gist](https://gist.github.com/Sinetheta/6003037) showing how you might use sp2010-rest with Grunt in a Yeoman project.

## License
Copyright (c) 2013 Kevin Attfield. Licensed under the MIT license.
