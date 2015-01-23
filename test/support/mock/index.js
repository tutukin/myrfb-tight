var mocks = require('require-directory')(module);

module.exports = function (mockName, options) {
    if ( typeof mockName !== 'string' || mockName.length < 1 ) {
        throw Error('Incorrect mock name');
    }
    
    if ( typeof mocks[mockName] !== 'function' ) {
        throw Error('No such a mock "'+mockName+'"');
    }
    
    return mocks[mockName](options);
};