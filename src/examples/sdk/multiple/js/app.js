$(function() {

    superbook
        .create('SomeApp')
        .id('xxx') // your `appId`
        .is('status', false)
        .is('logging', true)
        .end();


    superbook
        .create('AnotherApp')
        .id('xxx') // your `appId`
        .is('status', true)
        .is('logging', false)
        .is('xfbml', true)
        .end();

    superbook
        .use('SomeApp', function(err, FB) {

            // Run your FB app here ...
            alert('Used apiKey: ' + FB._apiKey);

        })
        .end();

    superbook
        .use('AnotherApp', function(err, FB) {

            // Run your FB app here ...
            alert('Used apiKey: ' + FB._apiKey);

        })
        .end();

});

console.log('Superbook.js', superbook.version);