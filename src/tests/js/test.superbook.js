if (!chai) {
    var chai = require('../../');
}

var should = chai.should();

function err(fn, msg) {
    try {
        fn();
        throw new chai.AssertionError({ message: 'Expected an error' });
    } catch (err) {
        should.equal(msg, err.message);
    }
}

suite('superbook', function() {

    test('.version', function(){
        superbook.version.should.match(/^\d+\.\d+\.\d+$/);
    });

});