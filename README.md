# Superbook.js
a convenient wrapper for Facebook JavaScript SDK

## Motivation
I wanted to have a dead-simple way to start work on the Facebook API using
their Javascript SDK. Superbook.js offers a simple API to load/init the
Facebook SDK and work within the context of one or multiple Apps.

It also covers the `connect` process.

## Quickstart

* init FB SDK

```js


    superbook
        .create('myApp')
        .id('12345 ...') // your FB AppId
        .end();


```

* work in app context

```js


    superbook
        .use('myApp', function(err, FB) {
            // put your App code here ...
        })
        .end();


```

* connect to Facebook app

```js


    superbook
        .connect('myApp')
        .on('ok', function(err, user, FB) {
            alert('Hi, ' + user.first_name)
        })
        .end();


```