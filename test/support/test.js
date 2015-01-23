var proxyquire = require('proxyquire').noCallThru();
var sinon = require('sinon');
var chai = require('chai');
chai.use( require('sinon-chai') );

var mock = require('./mock');


function findCallWith(spy, arg) {
    var i, c;
    var spyCall = null;
    
    for ( i = 0; i < spy.callCount; i++ ) {
        c = spy.getCall(i);
        if ( c.args[0] === arg ) {
            spyCall = c;
            break;
        }
    }
    
    return spyCall;
}


module.exports = {
    chai:   chai,
    expect: chai.expect,
    mock:   mock,
    sinon:  sinon,
    proxyquire: proxyquire,
    findCallWith: findCallWith
};