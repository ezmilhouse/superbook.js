$(function() {

    $(document).on('click', 'a.sample-1', function(evt) {

        evt.preventDefault();

        superbook
            .create('Facebook')
            .id('xxx') // your `appId`
            .end();

        superbook
            .connect('Facebook')
            .on('ok', function(err, user, FB) {
                alert('Hi, ' + user.first_name);
            })
            .on('cancel', function(err, user, FB) {
                alert('Oh no ...');
            })
            .end();

    });

    // ---

    $(document).on('click', 'a.sample-2', function(evt) {

        evt.preventDefault();

        superbook
            .create('Facebook')
            .id('xxx') // your `appId`
            .end();

        superbook
            .connect('Facebook')
            .on('all', function(err, user, FB) {
                if (user.authResponse) {
                    alert('Hi, ' + user.first_name);
                } else {
                    alert('Oh no ...');
                }
            })
            .end();

    });

    // --- onDocumentReady

    superbook
        .create('Facebook')
        .id('xxx') // your `appId`
        .end();

    superbook
        .connect('Facebook')
        .on('ok', function(err, user, FB) {
            alert('Hi, ' + user.first_name);
        })
        .on('cancel', function(err, user, FB) {
            alert('Oh no ...');
        })
        .end();


});

console.log('Superbook.js', superbook.version);