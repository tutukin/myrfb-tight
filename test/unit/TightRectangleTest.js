var test = require('../support/test');
var expect = test.expect;

describe('TightRectangle(rectHead)', function () {
    beforeEach(function (done) {
        this.head = {
            xPosition:  101,
            yPosition:  102,
            width:      103,
            height:     104,
            encodingType: 7
        };

        this.Tight = test.proxyquire('../../src/TightRectangle.js', {});
        this.tight = new this.Tight(this.head);
        done();
    });

    it('should be a function', function (done) {
        expect(this.Tight).to.be.a('function');
        done();
    });

    it('should set #head to rectHead', function (done) {
        expect(this.tight.head).to.equal(this.head);
        done();
    });

    it('should initialize #data', function (done) {
        expect(this.tight.data).to.be.instanceof(Array);
        done();
    });

    it('should initialize #_state as [compType]', function (done) {
        expect(this.tight._state).to.equal('compType');
        done();
    });


    describe('#encodingType()', function () {
        it('should be an instance method and return "tight"', function (done) {
            expect(this.tight.encodingType).to.be.a('function');
            expect(this.tight.encodingType()).to.equal('tight');
            done();
        });
    });




    describe('#requiredLength()', function () {
        beforeEach(function (done) {
            this.checkInState = function (state, result) {
                this.tight._state = state;
                expect(this.tight.requiredLength()).to.equal(result);
            };
            done();
        });

        it('should be an instance method', function (done) {
            expect(this.tight.requiredLength).to.be.a('function');
            done();
        });

        it('[compType]: should return 1', function (done) {
            this.checkInState('compType', 1);
            done();
        });

        it('[fill]: should return 3', function (done) {
            // fixme: fb.depth / 8 ?
            this.checkInState('fill', 3);
            done();
        });

        it('[png|jpeg]: should return 1', function (done) {
            this.checkInState('jpeg', 1);
            this.checkInState('png', 1);
            done();
        });

        it('[(jpeg|png).data]: should return #_clength', function (done) {
            this.tight._clength = 555;
            this.checkInState('jpeg.data', this.tight._clength);
            this.tight._clength = 456;
            this.checkInState('png.data', this.tight._clength);
            done();
        });

        it('[filter]: should return 1', function (done) {
            this.tight._compressionType = 6;
            this.checkInState('filter', 1);
            done();
        });

        it('[ready]: should return 0', function (done) {
            this.checkInState('ready', 0);
            done();
        });
        
        it('[palet]: should return 1', function (done) {
            this.checkInState('palet', 1);
            done();
        });
        
        it('[palet.colors]: should return 3*#_paletSize', function (done) {
            this.tight._paletSize = 3;
            this.checkInState('palet.colors', 3*this.tight._paletSize);
            done();
        });
        
        it('[basic]: should return w*h*3', function (done) {
            var t = this.tight;
            this.checkInState('basic', t.head.width*t.head.height*3);
            done();
        });
        
        it('[basic.zlib]: should return 1', function (done) {
            this.checkInState('basic.zlib', 1);
            done();
        });
        
        it('[basic.zlib.data]: should return #_clength', function (done) {
            this.tight._clength = 444;
            this.checkInState('basic.zlib.data', this.tight._clength);
            done();
        });
    });



    describe('#addChunk(chunk)', function () {
        it('should be an instance method', function (done) {
            expect(this.tight.addChunk).to.be.a('function');
            done();
        });

        it('[compType]: should set #_compressionType and move to [fill] if ct === 8', function (done) {
            var chunk = new Buffer(1);
            chunk.writeUInt8(0x83, 0);
            this.tight.addChunk(chunk);

            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('fill');
            expect(this.tight._compressionType).to.equal(0x8);
            done();
        });

        it('[compType]: should set #_compressionType and move to [jpeg] if ct === 9', function (done) {
            var chunk = new Buffer(1);
            chunk.writeUInt8(0x93, 0);
            this.tight.addChunk(chunk);

            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('jpeg');
            expect(this.tight._compressionType).to.equal(0x9);
            done();
        });

        it('[compType]: should set #_compressionType and move to [png] if ct === 10', function (done) {
            var chunk = new Buffer(1);
            chunk.writeUInt8(0xa3, 0);
            this.tight.addChunk(chunk);

            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('png');
            expect(this.tight._compressionType).to.equal(0xa);
            done();
        });

        it('[compType]: should set #_compressionType and move to [basic] if ct < 8 && !(ct&0x4)', function (done) {
            var chunk = new Buffer(1);
            chunk.writeUInt8(0x35, 0);
            this.tight.addChunk(chunk);

            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('basic');
            expect(this.tight._compressionType).to.equal(0x3);
            done();
        });
        
        it('[compType]: should set #_compressionType and move to [filter] if ct < 8 && !!(ct&0x4)', function (done) {
            var chunk = new Buffer(1);
            chunk.writeUInt8(0x75, 0);
            this.tight.addChunk(chunk);

            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('filter');
            expect(this.tight._compressionType).to.equal(0x7);
            done();
        });

        it('[compType]: should throw and move to [fill] if ct > 1f', function (done) {
            var tgt = this.tight;
            var chunk = new Buffer(1);
            chunk.writeUInt8(0xb0, 0);

            expect( function () {
                tgt.addChunk(chunk);
            }).to.throw('compression type');

            done();
        });

        it('[fill]: should add chunk and move to [ready]', function (done) {
            var chunk = new Buffer(3);
            this.tight._state = 'fill';

            this.tight.addChunk(chunk);

            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('ready');
            done();
        });

        it('[jpeg|png]: should add chunk and update #_clength for multibyte clength (0)', function (done) {
            var chunk = new Buffer(1);
            chunk.writeUInt8(0x83, 0); // 0xHM0

            this.tight._state = 'png';
            this.tight._cshift = undefined; // first byte of the compact
            this.tight._clength = undefined;

            this.tight.addChunk(chunk);

            expect(this.tight._state).to.equal('png');
            expect(this.tight._cshift).to.equal(7);
            expect(this.tight._clength).to.equal(3);
            done();
        });

        it('[jpeg|png]: should add chunk and update clength for multibyte clength (1)', function (done) {
            var chunk = new Buffer(1);
            chunk.writeUInt8(0x85, 0); // 640 + _clength

            this.tight._state = 'jpeg';
            this.tight._cshift = 7; // first byte of the compact
            this.tight._clength = 3;

            this.tight.addChunk(chunk);

            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('jpeg');
            expect(this.tight._cshift).to.equal(14);
            expect(this.tight._clength).to.equal(640+3);
            done();
        });

        it('[jpeg|png]: should add chunk and update clength for multibyte clength (2) and translate to [(jpeg|png).data]', function (done) {
            var chunk = new Buffer(1);
            chunk.writeUInt8(0x1, 0); // 0xHM0

            this.tight._state = 'png';
            this.tight._cshift = 14; // first byte of the compact
            this.tight._clength = 643;

            this.tight.addChunk(chunk);

            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('png.data');
            expect(this.tight._cshift).to.be.undefined;
            expect(this.tight._clength).to.equal(17027);
            done();
        });

        it('[jpeg|png]: should add chunk and update clength for  1 byte clength in and move to [(jpeg|png).data]', function (done) {
            var chunk = new Buffer(1);
            chunk.writeUInt8(0x7f, 0); // 0xHM0

            this.tight._state = 'jpeg';
            this.tight._cshift = undefined; // first byte of the compact
            this.tight._clength = undefined;

            this.tight.addChunk(chunk);

            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('jpeg.data');
            expect(this.tight._cshift).to.be.undefined;
            expect(this.tight._clength).to.equal(0x7f);
            done();
        });

        it('[jpeg|png]: should add chunk and update clength for  2 byte clength and move to [(jpeg|png).data]', function (done) {
            var chunk = new Buffer(1);
            chunk.writeUInt8(0x80, 0); // 0xHM0

            this.tight._state = 'jpeg';
            this.tight._cshift = undefined; // first byte of the compact
            this.tight._clength = undefined;

            this.tight.addChunk(chunk);

            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('jpeg');
            expect(this.tight._cshift).to.equal(7);
            expect(this.tight._clength).to.equal(0);

            chunk = new Buffer(1);
            chunk.writeUInt8(0x1, 0);

            this.tight.addChunk(chunk);

            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('jpeg.data');
            expect(this.tight._cshift).to.be.undefined;
            expect(this.tight._clength).to.equal(128);
            done();
        });

        it('[(jpeg|png).data]: should add chunk and move to [ready]', function (done) {
            var tgt = this.tight;
            'jpeg,png'.split(',').forEach( function (mode) {
                tgt._state = mode + '.data';
                tgt._clength = mode.length;
                var chunk = new Buffer(tgt._clength);

                tgt.addChunk(chunk);

                expect(tgt.data).to.contain(chunk);
                expect(tgt._state).to.equal('ready');
            });
            done();
        });

        
        it('[filter]: should throw if filter id is unknown', function (done) {
            this.tight._state = 'filter';
            this.tight._compressionType = 6;

            var chunk = new Buffer(1);
            chunk.writeUInt8(3, 0);

            expect( function () {
                this.tight.addChunk(chunk);
            }.bind(this)).to.throw('filter ID');
            done();
        });
        
        it('[filter]: should move according to filter type', function (done) {
            var tgt = this.tight;
            
            ['basic', 'palet', 'basic'].forEach( function (nextState, filterID) {
                tgt._state = 'filter';
                tgt._compressionType = 6;
                
                var chunk = new Buffer(1);
                chunk.writeUInt8(filterID, 0);
                
                tgt.addChunk(chunk);
                
                expect(tgt._state).to.equal(nextState);
                expect(tgt.data).to.contain(chunk);
            });
            done();
        });
        
        it('[palet]: should set #_paletSize and move to [palet.colors]', function (done) {
            var paletSize = 250;
            var chunk = new Buffer(1);
            this.tight._state = 'palet';
            chunk.writeUInt8(paletSize-1, 0);
            
            this.tight.addChunk(chunk);
            
            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._paletSize).to.equal(paletSize);
            expect(this.tight._state).to.equal('palet.colors');
            done();
        });
        
        it('[palet.colors]: should add chunk to data and move to [basic.zlib]', function (done) {
            var chunk = new Buffer(300);
            this.tight._state = 'palet.colors';
            
            this.tight.addChunk(chunk);
            
            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('basic.zlib');
            done();
        });
        
        it('[palet.colors]: should add chunk to data and move to [basic] if rectangle data are shorter than 12', function (done) {
            var chunk = new Buffer(9);
            
            var head = {
                xPosition:  101,
                yPosition:  102,
                width:      1,
                height:     3,
                encodingType: 7
            };

            var tight = new this.Tight(head);

            
            tight._state = 'palet.colors';

            tight.addChunk(chunk);

            expect(tight.data).to.contain(chunk);
            expect(tight._state).to.equal('basic');
            done();
        });
        
        
        it('[basic]: should add chunk and move to [ready]', function (done) {
            var chunk = new Buffer(111);
            this.tight._state = 'basic';
            
            this.tight.addChunk(chunk);
            
            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('ready');
            
            done();
        });
        
        it('[basic.zlib]: should read #_clength add chunks and move to [basic.zlib.data]', function (done) {
            var chunk;
            
            this.tight._state = 'basic.zlib';
            chunk = new Buffer(1);
            chunk.writeUInt8(0x81, 0);
            
            this.tight.addChunk(chunk);
            
            expect(this.tight._state).to.equal('basic.zlib');
            expect(this.tight._clength).to.equal(1);
            
            chunk = new Buffer(1);
            chunk.writeUInt8(0x81, 0);

            this.tight.addChunk(chunk);

            expect(this.tight._state).to.equal('basic.zlib');
            expect(this.tight._clength).to.equal(129);
            
            chunk = new Buffer(1);
            chunk.writeUInt8(0x1, 0);

            this.tight.addChunk(chunk);

            expect(this.tight._state).to.equal('basic.zlib.data');
            expect(this.tight._clength).to.equal(129+16384);

            done();
        });
        
        it('[basic.zlib.data]: should add chunk and move to [ready]', function (done) {
            var chunk = new Buffer(333);
            
            this.tight._state = 'basic.zlib.data';
            
            this.tight.addChunk(chunk);
            
            expect(this.tight.data).to.contain(chunk);
            expect(this.tight._state).to.equal('ready');
            
            done();
        });
        
    });
});
