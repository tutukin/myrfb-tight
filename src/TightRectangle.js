var util = require('util');
var F = util.format;

// FIXME: tight rectangle implements only true colour mode!
function TightRectangle (rectHead) {
    this.head = rectHead;
    this.data = [];
    this._state = 'compType';
}

var p = TightRectangle.prototype;

p.encodingType = function encodingType () {
    return 'tight';
};



p.requiredLength = function requiredLength () {
    var len;
    switch (this._state) {
        case 'ready':
            len = 0;
            break;
        case 'compType':
        case 'jpeg':
        case 'png':
        case 'palet':
        case 'filter':
        case 'basic.zlib':
            len = 1;
            break;
        case 'fill':
            len = 3;
            break;
        case 'jpeg.data':
        case 'png.data':
        case 'basic.zlib.data':
            len = this._clength;
            break;
        case 'palet.colors':
            // fixme: paletSize * fb.depth / 8 ?
            len = 3 * this._paletSize;
            break;
        case 'basic':
            // fixme: w * h * fb.depth / 8 ?
            len = this.head.width * this.head.height * 3;
            break;
        default:
            // todo: throw!
            break;
    }

    return len;
};




p.addChunk = function addChunk (chunk) {
    this.data.push(chunk);

    switch (this._state) {
        case 'compType':
            this._setCompressionType(chunk);
            break;
        case 'fill':
        case 'jpeg.data':
        case 'png.data':
        case 'basic':
        case 'basic.zlib.data':
            this._state = 'ready';
            break;
        case 'jpeg':
        case 'png':
        case 'basic.zlib':
            this._setCLength(chunk);
            break;
        case 'filter':
            this._setFilterType(chunk);
            break;
        case 'palet':
            this._setPaletSize(chunk);
            break;
        case 'palet.colors':
            // FIXME:  h * w * depth/8
            this._state = this.head.width * this.head.height * 3 < 12 ? 'basic' : 'basic.zlib';
            break;
        default:
            // todo: throw
            break;
    }
};


p._setCompressionType = function _setCompressionType (chunk) {
    var ct = chunk.readUInt8(0);
    this._compressionType = ct >> 4;
    
    if ( this._compressionType > 10 ) {
        throw Error(F('Unsupported compression type %d', this._compressionType));
    }
    
    switch (this._compressionType) {
        case 8:
            this._state = 'fill';
            break;
        case 9:
            this._state = 'jpeg';
            break;
        case 10:
            this._state = 'png';
            break;
        default:
            this._state = !!( this._compressionType & 0x4) ? 'filter' : 'basic';
            break;
    }
};


p._setCLength = function _setCLength (chunk) {
    var n = chunk.readUInt8(0);
    var haveNext = !! (n & 0x80);
    
    if ( ! this._cshift ) {
        this._clength = n & 0x7f;
        this._cshift = 7;
    }
    else {
        this._clength |= (n & 0x7f) << this._cshift;
        this._cshift += 7;
    }
    
    if ( ! haveNext ) {
        this._cshift = undefined;
        this._state += '.data';
    }
};


p._setFilterType = function _setFilterType (chunk) {
    var id = chunk.readUInt8(0);
    var states = ['basic', 'palet', 'basic'];
    
    if ( id >= states.length ) {
        throw Error(F('unknown filter ID %d', id));
    };
    
    this._state = states[id];
};

p._setPaletSize = function _setPaletSize (chunk) {
    this._paletSize = chunk.readUInt8(0) + 1;
    this._state = 'palet.colors';
};

module.exports = TightRectangle;