$(function() {

    superbook
        .create('SomeApp')
        .id('xxx') // your `appId`
        .end();

    superbook
        .use('SomeApp', function(err, FB) {

            // Run your FB app here ...
            alert('Used apiKey: ' + FB._apiKey);

        })
        .end();

});

console.log('Superbook.js', superbook.version);