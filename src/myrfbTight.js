var TightRectangle = require('./TightRectangle');

module.exports = function (myrfb) {
    myrfb.addRectangle(7, TightRectangle);
    myrfb.addRectangle(-260, TightRectangle);
};