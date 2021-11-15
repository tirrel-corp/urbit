(function (global, factory) {
            typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
            typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (global = global || self, factory(global['urbit-ob'] = {}));
}(this, function (exports) { 'use strict';

            var global$1 = (typeof global !== "undefined" ? global :
                        typeof self !== "undefined" ? self :
                        typeof window !== "undefined" ? window : {});

            var lookup = [];
            var revLookup = [];
            var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
            var inited = false;
            function init () {
              inited = true;
              var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
              for (var i = 0, len = code.length; i < len; ++i) {
                lookup[i] = code[i];
                revLookup[code.charCodeAt(i)] = i;
              }

              revLookup['-'.charCodeAt(0)] = 62;
              revLookup['_'.charCodeAt(0)] = 63;
            }

            function toByteArray (b64) {
              if (!inited) {
                init();
              }
              var i, j, l, tmp, placeHolders, arr;
              var len = b64.length;

              if (len % 4 > 0) {
                throw new Error('Invalid string. Length must be a multiple of 4')
              }

              // the number of equal signs (place holders)
              // if there are two placeholders, than the two characters before it
              // represent one byte
              // if there is only one, then the three characters before it represent 2 bytes
              // this is just a cheap hack to not do indexOf twice
              placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

              // base64 is 4/3 + up to two characters of the original data
              arr = new Arr(len * 3 / 4 - placeHolders);

              // if there are placeholders, only get up to the last complete 4 chars
              l = placeHolders > 0 ? len - 4 : len;

              var L = 0;

              for (i = 0, j = 0; i < l; i += 4, j += 3) {
                tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
                arr[L++] = (tmp >> 16) & 0xFF;
                arr[L++] = (tmp >> 8) & 0xFF;
                arr[L++] = tmp & 0xFF;
              }

              if (placeHolders === 2) {
                tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
                arr[L++] = tmp & 0xFF;
              } else if (placeHolders === 1) {
                tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
                arr[L++] = (tmp >> 8) & 0xFF;
                arr[L++] = tmp & 0xFF;
              }

              return arr
            }

            function tripletToBase64 (num) {
              return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
            }

            function encodeChunk (uint8, start, end) {
              var tmp;
              var output = [];
              for (var i = start; i < end; i += 3) {
                tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
                output.push(tripletToBase64(tmp));
              }
              return output.join('')
            }

            function fromByteArray (uint8) {
              if (!inited) {
                init();
              }
              var tmp;
              var len = uint8.length;
              var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
              var output = '';
              var parts = [];
              var maxChunkLength = 16383; // must be multiple of 3

              // go through the array every three bytes, we'll deal with trailing stuff later
              for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
                parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
              }

              // pad the end with zeros, but make sure to not forget the extra bytes
              if (extraBytes === 1) {
                tmp = uint8[len - 1];
                output += lookup[tmp >> 2];
                output += lookup[(tmp << 4) & 0x3F];
                output += '==';
              } else if (extraBytes === 2) {
                tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
                output += lookup[tmp >> 10];
                output += lookup[(tmp >> 4) & 0x3F];
                output += lookup[(tmp << 2) & 0x3F];
                output += '=';
              }

              parts.push(output);

              return parts.join('')
            }

            function read (buffer, offset, isLE, mLen, nBytes) {
              var e, m;
              var eLen = nBytes * 8 - mLen - 1;
              var eMax = (1 << eLen) - 1;
              var eBias = eMax >> 1;
              var nBits = -7;
              var i = isLE ? (nBytes - 1) : 0;
              var d = isLE ? -1 : 1;
              var s = buffer[offset + i];

              i += d;

              e = s & ((1 << (-nBits)) - 1);
              s >>= (-nBits);
              nBits += eLen;
              for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

              m = e & ((1 << (-nBits)) - 1);
              e >>= (-nBits);
              nBits += mLen;
              for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

              if (e === 0) {
                e = 1 - eBias;
              } else if (e === eMax) {
                return m ? NaN : ((s ? -1 : 1) * Infinity)
              } else {
                m = m + Math.pow(2, mLen);
                e = e - eBias;
              }
              return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
            }

            function write (buffer, value, offset, isLE, mLen, nBytes) {
              var e, m, c;
              var eLen = nBytes * 8 - mLen - 1;
              var eMax = (1 << eLen) - 1;
              var eBias = eMax >> 1;
              var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
              var i = isLE ? 0 : (nBytes - 1);
              var d = isLE ? 1 : -1;
              var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

              value = Math.abs(value);

              if (isNaN(value) || value === Infinity) {
                m = isNaN(value) ? 1 : 0;
                e = eMax;
              } else {
                e = Math.floor(Math.log(value) / Math.LN2);
                if (value * (c = Math.pow(2, -e)) < 1) {
                  e--;
                  c *= 2;
                }
                if (e + eBias >= 1) {
                  value += rt / c;
                } else {
                  value += rt * Math.pow(2, 1 - eBias);
                }
                if (value * c >= 2) {
                  e++;
                  c /= 2;
                }

                if (e + eBias >= eMax) {
                  m = 0;
                  e = eMax;
                } else if (e + eBias >= 1) {
                  m = (value * c - 1) * Math.pow(2, mLen);
                  e = e + eBias;
                } else {
                  m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
                  e = 0;
                }
              }

              for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

              e = (e << mLen) | m;
              eLen += mLen;
              for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

              buffer[offset + i - d] |= s * 128;
            }

            var toString = {}.toString;

            var isArray = Array.isArray || function (arr) {
              return toString.call(arr) == '[object Array]';
            };

            var INSPECT_MAX_BYTES = 50;

            /**
             * If `Buffer.TYPED_ARRAY_SUPPORT`:
             *   === true    Use Uint8Array implementation (fastest)
             *   === false   Use Object implementation (most compatible, even IE6)
             *
             * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
             * Opera 11.6+, iOS 4.2+.
             *
             * Due to various browser bugs, sometimes the Object implementation will be used even
             * when the browser supports typed arrays.
             *
             * Note:
             *
             *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
             *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
             *
             *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
             *
             *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
             *     incorrect length in some situations.

             * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
             * get the Object implementation, which is slower but behaves correctly.
             */
            Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
              ? global$1.TYPED_ARRAY_SUPPORT
              : true;

            /*
             * Export kMaxLength after typed array support is determined.
             */
            var _kMaxLength = kMaxLength();

            function kMaxLength () {
              return Buffer.TYPED_ARRAY_SUPPORT
                ? 0x7fffffff
                : 0x3fffffff
            }

            function createBuffer (that, length) {
              if (kMaxLength() < length) {
                throw new RangeError('Invalid typed array length')
              }
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                // Return an augmented `Uint8Array` instance, for best performance
                that = new Uint8Array(length);
                that.__proto__ = Buffer.prototype;
              } else {
                // Fallback: Return an object instance of the Buffer class
                if (that === null) {
                  that = new Buffer(length);
                }
                that.length = length;
              }

              return that
            }

            /**
             * The Buffer constructor returns instances of `Uint8Array` that have their
             * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
             * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
             * and the `Uint8Array` methods. Square bracket notation works as expected -- it
             * returns a single octet.
             *
             * The `Uint8Array` prototype remains unmodified.
             */

            function Buffer (arg, encodingOrOffset, length) {
              if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
                return new Buffer(arg, encodingOrOffset, length)
              }

              // Common case.
              if (typeof arg === 'number') {
                if (typeof encodingOrOffset === 'string') {
                  throw new Error(
                    'If encoding is specified then the first argument must be a string'
                  )
                }
                return allocUnsafe(this, arg)
              }
              return from(this, arg, encodingOrOffset, length)
            }

            Buffer.poolSize = 8192; // not used by this implementation

            // TODO: Legacy, not needed anymore. Remove in next major version.
            Buffer._augment = function (arr) {
              arr.__proto__ = Buffer.prototype;
              return arr
            };

            function from (that, value, encodingOrOffset, length) {
              if (typeof value === 'number') {
                throw new TypeError('"value" argument must not be a number')
              }

              if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
                return fromArrayBuffer(that, value, encodingOrOffset, length)
              }

              if (typeof value === 'string') {
                return fromString(that, value, encodingOrOffset)
              }

              return fromObject(that, value)
            }

            /**
             * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
             * if value is a number.
             * Buffer.from(str[, encoding])
             * Buffer.from(array)
             * Buffer.from(buffer)
             * Buffer.from(arrayBuffer[, byteOffset[, length]])
             **/
            Buffer.from = function (value, encodingOrOffset, length) {
              return from(null, value, encodingOrOffset, length)
            };

            if (Buffer.TYPED_ARRAY_SUPPORT) {
              Buffer.prototype.__proto__ = Uint8Array.prototype;
              Buffer.__proto__ = Uint8Array;
            }

            function assertSize (size) {
              if (typeof size !== 'number') {
                throw new TypeError('"size" argument must be a number')
              } else if (size < 0) {
                throw new RangeError('"size" argument must not be negative')
              }
            }

            function alloc (that, size, fill, encoding) {
              assertSize(size);
              if (size <= 0) {
                return createBuffer(that, size)
              }
              if (fill !== undefined) {
                // Only pay attention to encoding if it's a string. This
                // prevents accidentally sending in a number that would
                // be interpretted as a start offset.
                return typeof encoding === 'string'
                  ? createBuffer(that, size).fill(fill, encoding)
                  : createBuffer(that, size).fill(fill)
              }
              return createBuffer(that, size)
            }

            /**
             * Creates a new filled Buffer instance.
             * alloc(size[, fill[, encoding]])
             **/
            Buffer.alloc = function (size, fill, encoding) {
              return alloc(null, size, fill, encoding)
            };

            function allocUnsafe (that, size) {
              assertSize(size);
              that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
              if (!Buffer.TYPED_ARRAY_SUPPORT) {
                for (var i = 0; i < size; ++i) {
                  that[i] = 0;
                }
              }
              return that
            }

            /**
             * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
             * */
            Buffer.allocUnsafe = function (size) {
              return allocUnsafe(null, size)
            };
            /**
             * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
             */
            Buffer.allocUnsafeSlow = function (size) {
              return allocUnsafe(null, size)
            };

            function fromString (that, string, encoding) {
              if (typeof encoding !== 'string' || encoding === '') {
                encoding = 'utf8';
              }

              if (!Buffer.isEncoding(encoding)) {
                throw new TypeError('"encoding" must be a valid string encoding')
              }

              var length = byteLength(string, encoding) | 0;
              that = createBuffer(that, length);

              var actual = that.write(string, encoding);

              if (actual !== length) {
                // Writing a hex string, for example, that contains invalid characters will
                // cause everything after the first invalid character to be ignored. (e.g.
                // 'abxxcd' will be treated as 'ab')
                that = that.slice(0, actual);
              }

              return that
            }

            function fromArrayLike (that, array) {
              var length = array.length < 0 ? 0 : checked(array.length) | 0;
              that = createBuffer(that, length);
              for (var i = 0; i < length; i += 1) {
                that[i] = array[i] & 255;
              }
              return that
            }

            function fromArrayBuffer (that, array, byteOffset, length) {
              array.byteLength; // this throws if `array` is not a valid ArrayBuffer

              if (byteOffset < 0 || array.byteLength < byteOffset) {
                throw new RangeError('\'offset\' is out of bounds')
              }

              if (array.byteLength < byteOffset + (length || 0)) {
                throw new RangeError('\'length\' is out of bounds')
              }

              if (byteOffset === undefined && length === undefined) {
                array = new Uint8Array(array);
              } else if (length === undefined) {
                array = new Uint8Array(array, byteOffset);
              } else {
                array = new Uint8Array(array, byteOffset, length);
              }

              if (Buffer.TYPED_ARRAY_SUPPORT) {
                // Return an augmented `Uint8Array` instance, for best performance
                that = array;
                that.__proto__ = Buffer.prototype;
              } else {
                // Fallback: Return an object instance of the Buffer class
                that = fromArrayLike(that, array);
              }
              return that
            }

            function fromObject (that, obj) {
              if (internalIsBuffer(obj)) {
                var len = checked(obj.length) | 0;
                that = createBuffer(that, len);

                if (that.length === 0) {
                  return that
                }

                obj.copy(that, 0, 0, len);
                return that
              }

              if (obj) {
                if ((typeof ArrayBuffer !== 'undefined' &&
                    obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
                  if (typeof obj.length !== 'number' || isnan(obj.length)) {
                    return createBuffer(that, 0)
                  }
                  return fromArrayLike(that, obj)
                }

                if (obj.type === 'Buffer' && isArray(obj.data)) {
                  return fromArrayLike(that, obj.data)
                }
              }

              throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
            }

            function checked (length) {
              // Note: cannot use `length < kMaxLength()` here because that fails when
              // length is NaN (which is otherwise coerced to zero.)
              if (length >= kMaxLength()) {
                throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                                     'size: 0x' + kMaxLength().toString(16) + ' bytes')
              }
              return length | 0
            }

            function SlowBuffer (length) {
              if (+length != length) { // eslint-disable-line eqeqeq
                length = 0;
              }
              return Buffer.alloc(+length)
            }
            Buffer.isBuffer = isBuffer;
            function internalIsBuffer (b) {
              return !!(b != null && b._isBuffer)
            }

            Buffer.compare = function compare (a, b) {
              if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
                throw new TypeError('Arguments must be Buffers')
              }

              if (a === b) return 0

              var x = a.length;
              var y = b.length;

              for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                if (a[i] !== b[i]) {
                  x = a[i];
                  y = b[i];
                  break
                }
              }

              if (x < y) return -1
              if (y < x) return 1
              return 0
            };

            Buffer.isEncoding = function isEncoding (encoding) {
              switch (String(encoding).toLowerCase()) {
                case 'hex':
                case 'utf8':
                case 'utf-8':
                case 'ascii':
                case 'latin1':
                case 'binary':
                case 'base64':
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return true
                default:
                  return false
              }
            };

            Buffer.concat = function concat (list, length) {
              if (!isArray(list)) {
                throw new TypeError('"list" argument must be an Array of Buffers')
              }

              if (list.length === 0) {
                return Buffer.alloc(0)
              }

              var i;
              if (length === undefined) {
                length = 0;
                for (i = 0; i < list.length; ++i) {
                  length += list[i].length;
                }
              }

              var buffer = Buffer.allocUnsafe(length);
              var pos = 0;
              for (i = 0; i < list.length; ++i) {
                var buf = list[i];
                if (!internalIsBuffer(buf)) {
                  throw new TypeError('"list" argument must be an Array of Buffers')
                }
                buf.copy(buffer, pos);
                pos += buf.length;
              }
              return buffer
            };

            function byteLength (string, encoding) {
              if (internalIsBuffer(string)) {
                return string.length
              }
              if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
                  (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
                return string.byteLength
              }
              if (typeof string !== 'string') {
                string = '' + string;
              }

              var len = string.length;
              if (len === 0) return 0

              // Use a for loop to avoid recursion
              var loweredCase = false;
              for (;;) {
                switch (encoding) {
                  case 'ascii':
                  case 'latin1':
                  case 'binary':
                    return len
                  case 'utf8':
                  case 'utf-8':
                  case undefined:
                    return utf8ToBytes(string).length
                  case 'ucs2':
                  case 'ucs-2':
                  case 'utf16le':
                  case 'utf-16le':
                    return len * 2
                  case 'hex':
                    return len >>> 1
                  case 'base64':
                    return base64ToBytes(string).length
                  default:
                    if (loweredCase) return utf8ToBytes(string).length // assume utf8
                    encoding = ('' + encoding).toLowerCase();
                    loweredCase = true;
                }
              }
            }
            Buffer.byteLength = byteLength;

            function slowToString (encoding, start, end) {
              var loweredCase = false;

              // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
              // property of a typed array.

              // This behaves neither like String nor Uint8Array in that we set start/end
              // to their upper/lower bounds if the value passed is out of range.
              // undefined is handled specially as per ECMA-262 6th Edition,
              // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
              if (start === undefined || start < 0) {
                start = 0;
              }
              // Return early if start > this.length. Done here to prevent potential uint32
              // coercion fail below.
              if (start > this.length) {
                return ''
              }

              if (end === undefined || end > this.length) {
                end = this.length;
              }

              if (end <= 0) {
                return ''
              }

              // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
              end >>>= 0;
              start >>>= 0;

              if (end <= start) {
                return ''
              }

              if (!encoding) encoding = 'utf8';

              while (true) {
                switch (encoding) {
                  case 'hex':
                    return hexSlice(this, start, end)

                  case 'utf8':
                  case 'utf-8':
                    return utf8Slice(this, start, end)

                  case 'ascii':
                    return asciiSlice(this, start, end)

                  case 'latin1':
                  case 'binary':
                    return latin1Slice(this, start, end)

                  case 'base64':
                    return base64Slice(this, start, end)

                  case 'ucs2':
                  case 'ucs-2':
                  case 'utf16le':
                  case 'utf-16le':
                    return utf16leSlice(this, start, end)

                  default:
                    if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                    encoding = (encoding + '').toLowerCase();
                    loweredCase = true;
                }
              }
            }

            // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
            // Buffer instances.
            Buffer.prototype._isBuffer = true;

            function swap (b, n, m) {
              var i = b[n];
              b[n] = b[m];
              b[m] = i;
            }

            Buffer.prototype.swap16 = function swap16 () {
              var len = this.length;
              if (len % 2 !== 0) {
                throw new RangeError('Buffer size must be a multiple of 16-bits')
              }
              for (var i = 0; i < len; i += 2) {
                swap(this, i, i + 1);
              }
              return this
            };

            Buffer.prototype.swap32 = function swap32 () {
              var len = this.length;
              if (len % 4 !== 0) {
                throw new RangeError('Buffer size must be a multiple of 32-bits')
              }
              for (var i = 0; i < len; i += 4) {
                swap(this, i, i + 3);
                swap(this, i + 1, i + 2);
              }
              return this
            };

            Buffer.prototype.swap64 = function swap64 () {
              var len = this.length;
              if (len % 8 !== 0) {
                throw new RangeError('Buffer size must be a multiple of 64-bits')
              }
              for (var i = 0; i < len; i += 8) {
                swap(this, i, i + 7);
                swap(this, i + 1, i + 6);
                swap(this, i + 2, i + 5);
                swap(this, i + 3, i + 4);
              }
              return this
            };

            Buffer.prototype.toString = function toString () {
              var length = this.length | 0;
              if (length === 0) return ''
              if (arguments.length === 0) return utf8Slice(this, 0, length)
              return slowToString.apply(this, arguments)
            };

            Buffer.prototype.equals = function equals (b) {
              if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
              if (this === b) return true
              return Buffer.compare(this, b) === 0
            };

            Buffer.prototype.inspect = function inspect () {
              var str = '';
              var max = INSPECT_MAX_BYTES;
              if (this.length > 0) {
                str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
                if (this.length > max) str += ' ... ';
              }
              return '<Buffer ' + str + '>'
            };

            Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
              if (!internalIsBuffer(target)) {
                throw new TypeError('Argument must be a Buffer')
              }

              if (start === undefined) {
                start = 0;
              }
              if (end === undefined) {
                end = target ? target.length : 0;
              }
              if (thisStart === undefined) {
                thisStart = 0;
              }
              if (thisEnd === undefined) {
                thisEnd = this.length;
              }

              if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
                throw new RangeError('out of range index')
              }

              if (thisStart >= thisEnd && start >= end) {
                return 0
              }
              if (thisStart >= thisEnd) {
                return -1
              }
              if (start >= end) {
                return 1
              }

              start >>>= 0;
              end >>>= 0;
              thisStart >>>= 0;
              thisEnd >>>= 0;

              if (this === target) return 0

              var x = thisEnd - thisStart;
              var y = end - start;
              var len = Math.min(x, y);

              var thisCopy = this.slice(thisStart, thisEnd);
              var targetCopy = target.slice(start, end);

              for (var i = 0; i < len; ++i) {
                if (thisCopy[i] !== targetCopy[i]) {
                  x = thisCopy[i];
                  y = targetCopy[i];
                  break
                }
              }

              if (x < y) return -1
              if (y < x) return 1
              return 0
            };

            // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
            // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
            //
            // Arguments:
            // - buffer - a Buffer to search
            // - val - a string, Buffer, or number
            // - byteOffset - an index into `buffer`; will be clamped to an int32
            // - encoding - an optional encoding, relevant is val is a string
            // - dir - true for indexOf, false for lastIndexOf
            function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
              // Empty buffer means no match
              if (buffer.length === 0) return -1

              // Normalize byteOffset
              if (typeof byteOffset === 'string') {
                encoding = byteOffset;
                byteOffset = 0;
              } else if (byteOffset > 0x7fffffff) {
                byteOffset = 0x7fffffff;
              } else if (byteOffset < -0x80000000) {
                byteOffset = -0x80000000;
              }
              byteOffset = +byteOffset;  // Coerce to Number.
              if (isNaN(byteOffset)) {
                // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
                byteOffset = dir ? 0 : (buffer.length - 1);
              }

              // Normalize byteOffset: negative offsets start from the end of the buffer
              if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
              if (byteOffset >= buffer.length) {
                if (dir) return -1
                else byteOffset = buffer.length - 1;
              } else if (byteOffset < 0) {
                if (dir) byteOffset = 0;
                else return -1
              }

              // Normalize val
              if (typeof val === 'string') {
                val = Buffer.from(val, encoding);
              }

              // Finally, search either indexOf (if dir is true) or lastIndexOf
              if (internalIsBuffer(val)) {
                // Special case: looking for empty string/buffer always fails
                if (val.length === 0) {
                  return -1
                }
                return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
              } else if (typeof val === 'number') {
                val = val & 0xFF; // Search for a byte value [0-255]
                if (Buffer.TYPED_ARRAY_SUPPORT &&
                    typeof Uint8Array.prototype.indexOf === 'function') {
                  if (dir) {
                    return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
                  } else {
                    return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
                  }
                }
                return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
              }

              throw new TypeError('val must be string, number or Buffer')
            }

            function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
              var indexSize = 1;
              var arrLength = arr.length;
              var valLength = val.length;

              if (encoding !== undefined) {
                encoding = String(encoding).toLowerCase();
                if (encoding === 'ucs2' || encoding === 'ucs-2' ||
                    encoding === 'utf16le' || encoding === 'utf-16le') {
                  if (arr.length < 2 || val.length < 2) {
                    return -1
                  }
                  indexSize = 2;
                  arrLength /= 2;
                  valLength /= 2;
                  byteOffset /= 2;
                }
              }

              function read (buf, i) {
                if (indexSize === 1) {
                  return buf[i]
                } else {
                  return buf.readUInt16BE(i * indexSize)
                }
              }

              var i;
              if (dir) {
                var foundIndex = -1;
                for (i = byteOffset; i < arrLength; i++) {
                  if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                    if (foundIndex === -1) foundIndex = i;
                    if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
                  } else {
                    if (foundIndex !== -1) i -= i - foundIndex;
                    foundIndex = -1;
                  }
                }
              } else {
                if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
                for (i = byteOffset; i >= 0; i--) {
                  var found = true;
                  for (var j = 0; j < valLength; j++) {
                    if (read(arr, i + j) !== read(val, j)) {
                      found = false;
                      break
                    }
                  }
                  if (found) return i
                }
              }

              return -1
            }

            Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
              return this.indexOf(val, byteOffset, encoding) !== -1
            };

            Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
              return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
            };

            Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
              return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
            };

            function hexWrite (buf, string, offset, length) {
              offset = Number(offset) || 0;
              var remaining = buf.length - offset;
              if (!length) {
                length = remaining;
              } else {
                length = Number(length);
                if (length > remaining) {
                  length = remaining;
                }
              }

              // must be an even number of digits
              var strLen = string.length;
              if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

              if (length > strLen / 2) {
                length = strLen / 2;
              }
              for (var i = 0; i < length; ++i) {
                var parsed = parseInt(string.substr(i * 2, 2), 16);
                if (isNaN(parsed)) return i
                buf[offset + i] = parsed;
              }
              return i
            }

            function utf8Write (buf, string, offset, length) {
              return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
            }

            function asciiWrite (buf, string, offset, length) {
              return blitBuffer(asciiToBytes(string), buf, offset, length)
            }

            function latin1Write (buf, string, offset, length) {
              return asciiWrite(buf, string, offset, length)
            }

            function base64Write (buf, string, offset, length) {
              return blitBuffer(base64ToBytes(string), buf, offset, length)
            }

            function ucs2Write (buf, string, offset, length) {
              return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
            }

            Buffer.prototype.write = function write (string, offset, length, encoding) {
              // Buffer#write(string)
              if (offset === undefined) {
                encoding = 'utf8';
                length = this.length;
                offset = 0;
              // Buffer#write(string, encoding)
              } else if (length === undefined && typeof offset === 'string') {
                encoding = offset;
                length = this.length;
                offset = 0;
              // Buffer#write(string, offset[, length][, encoding])
              } else if (isFinite(offset)) {
                offset = offset | 0;
                if (isFinite(length)) {
                  length = length | 0;
                  if (encoding === undefined) encoding = 'utf8';
                } else {
                  encoding = length;
                  length = undefined;
                }
              // legacy write(string, encoding, offset, length) - remove in v0.13
              } else {
                throw new Error(
                  'Buffer.write(string, encoding, offset[, length]) is no longer supported'
                )
              }

              var remaining = this.length - offset;
              if (length === undefined || length > remaining) length = remaining;

              if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
                throw new RangeError('Attempt to write outside buffer bounds')
              }

              if (!encoding) encoding = 'utf8';

              var loweredCase = false;
              for (;;) {
                switch (encoding) {
                  case 'hex':
                    return hexWrite(this, string, offset, length)

                  case 'utf8':
                  case 'utf-8':
                    return utf8Write(this, string, offset, length)

                  case 'ascii':
                    return asciiWrite(this, string, offset, length)

                  case 'latin1':
                  case 'binary':
                    return latin1Write(this, string, offset, length)

                  case 'base64':
                    // Warning: maxLength not taken into account in base64Write
                    return base64Write(this, string, offset, length)

                  case 'ucs2':
                  case 'ucs-2':
                  case 'utf16le':
                  case 'utf-16le':
                    return ucs2Write(this, string, offset, length)

                  default:
                    if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                    encoding = ('' + encoding).toLowerCase();
                    loweredCase = true;
                }
              }
            };

            Buffer.prototype.toJSON = function toJSON () {
              return {
                type: 'Buffer',
                data: Array.prototype.slice.call(this._arr || this, 0)
              }
            };

            function base64Slice (buf, start, end) {
              if (start === 0 && end === buf.length) {
                return fromByteArray(buf)
              } else {
                return fromByteArray(buf.slice(start, end))
              }
            }

            function utf8Slice (buf, start, end) {
              end = Math.min(buf.length, end);
              var res = [];

              var i = start;
              while (i < end) {
                var firstByte = buf[i];
                var codePoint = null;
                var bytesPerSequence = (firstByte > 0xEF) ? 4
                  : (firstByte > 0xDF) ? 3
                  : (firstByte > 0xBF) ? 2
                  : 1;

                if (i + bytesPerSequence <= end) {
                  var secondByte, thirdByte, fourthByte, tempCodePoint;

                  switch (bytesPerSequence) {
                    case 1:
                      if (firstByte < 0x80) {
                        codePoint = firstByte;
                      }
                      break
                    case 2:
                      secondByte = buf[i + 1];
                      if ((secondByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
                        if (tempCodePoint > 0x7F) {
                          codePoint = tempCodePoint;
                        }
                      }
                      break
                    case 3:
                      secondByte = buf[i + 1];
                      thirdByte = buf[i + 2];
                      if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
                        if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                          codePoint = tempCodePoint;
                        }
                      }
                      break
                    case 4:
                      secondByte = buf[i + 1];
                      thirdByte = buf[i + 2];
                      fourthByte = buf[i + 3];
                      if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
                        if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                          codePoint = tempCodePoint;
                        }
                      }
                  }
                }

                if (codePoint === null) {
                  // we did not generate a valid codePoint so insert a
                  // replacement char (U+FFFD) and advance only 1 byte
                  codePoint = 0xFFFD;
                  bytesPerSequence = 1;
                } else if (codePoint > 0xFFFF) {
                  // encode to utf16 (surrogate pair dance)
                  codePoint -= 0x10000;
                  res.push(codePoint >>> 10 & 0x3FF | 0xD800);
                  codePoint = 0xDC00 | codePoint & 0x3FF;
                }

                res.push(codePoint);
                i += bytesPerSequence;
              }

              return decodeCodePointsArray(res)
            }

            // Based on http://stackoverflow.com/a/22747272/680742, the browser with
            // the lowest limit is Chrome, with 0x10000 args.
            // We go 1 magnitude less, for safety
            var MAX_ARGUMENTS_LENGTH = 0x1000;

            function decodeCodePointsArray (codePoints) {
              var len = codePoints.length;
              if (len <= MAX_ARGUMENTS_LENGTH) {
                return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
              }

              // Decode in chunks to avoid "call stack size exceeded".
              var res = '';
              var i = 0;
              while (i < len) {
                res += String.fromCharCode.apply(
                  String,
                  codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
                );
              }
              return res
            }

            function asciiSlice (buf, start, end) {
              var ret = '';
              end = Math.min(buf.length, end);

              for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i] & 0x7F);
              }
              return ret
            }

            function latin1Slice (buf, start, end) {
              var ret = '';
              end = Math.min(buf.length, end);

              for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i]);
              }
              return ret
            }

            function hexSlice (buf, start, end) {
              var len = buf.length;

              if (!start || start < 0) start = 0;
              if (!end || end < 0 || end > len) end = len;

              var out = '';
              for (var i = start; i < end; ++i) {
                out += toHex(buf[i]);
              }
              return out
            }

            function utf16leSlice (buf, start, end) {
              var bytes = buf.slice(start, end);
              var res = '';
              for (var i = 0; i < bytes.length; i += 2) {
                res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
              }
              return res
            }

            Buffer.prototype.slice = function slice (start, end) {
              var len = this.length;
              start = ~~start;
              end = end === undefined ? len : ~~end;

              if (start < 0) {
                start += len;
                if (start < 0) start = 0;
              } else if (start > len) {
                start = len;
              }

              if (end < 0) {
                end += len;
                if (end < 0) end = 0;
              } else if (end > len) {
                end = len;
              }

              if (end < start) end = start;

              var newBuf;
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                newBuf = this.subarray(start, end);
                newBuf.__proto__ = Buffer.prototype;
              } else {
                var sliceLen = end - start;
                newBuf = new Buffer(sliceLen, undefined);
                for (var i = 0; i < sliceLen; ++i) {
                  newBuf[i] = this[i + start];
                }
              }

              return newBuf
            };

            /*
             * Need to make sure that buffer isn't trying to write out of bounds.
             */
            function checkOffset (offset, ext, length) {
              if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
              if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
            }

            Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
              offset = offset | 0;
              byteLength = byteLength | 0;
              if (!noAssert) checkOffset(offset, byteLength, this.length);

              var val = this[offset];
              var mul = 1;
              var i = 0;
              while (++i < byteLength && (mul *= 0x100)) {
                val += this[offset + i] * mul;
              }

              return val
            };

            Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
              offset = offset | 0;
              byteLength = byteLength | 0;
              if (!noAssert) {
                checkOffset(offset, byteLength, this.length);
              }

              var val = this[offset + --byteLength];
              var mul = 1;
              while (byteLength > 0 && (mul *= 0x100)) {
                val += this[offset + --byteLength] * mul;
              }

              return val
            };

            Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 1, this.length);
              return this[offset]
            };

            Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 2, this.length);
              return this[offset] | (this[offset + 1] << 8)
            };

            Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 2, this.length);
              return (this[offset] << 8) | this[offset + 1]
            };

            Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 4, this.length);

              return ((this[offset]) |
                  (this[offset + 1] << 8) |
                  (this[offset + 2] << 16)) +
                  (this[offset + 3] * 0x1000000)
            };

            Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (this[offset] * 0x1000000) +
                ((this[offset + 1] << 16) |
                (this[offset + 2] << 8) |
                this[offset + 3])
            };

            Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
              offset = offset | 0;
              byteLength = byteLength | 0;
              if (!noAssert) checkOffset(offset, byteLength, this.length);

              var val = this[offset];
              var mul = 1;
              var i = 0;
              while (++i < byteLength && (mul *= 0x100)) {
                val += this[offset + i] * mul;
              }
              mul *= 0x80;

              if (val >= mul) val -= Math.pow(2, 8 * byteLength);

              return val
            };

            Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
              offset = offset | 0;
              byteLength = byteLength | 0;
              if (!noAssert) checkOffset(offset, byteLength, this.length);

              var i = byteLength;
              var mul = 1;
              var val = this[offset + --i];
              while (i > 0 && (mul *= 0x100)) {
                val += this[offset + --i] * mul;
              }
              mul *= 0x80;

              if (val >= mul) val -= Math.pow(2, 8 * byteLength);

              return val
            };

            Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 1, this.length);
              if (!(this[offset] & 0x80)) return (this[offset])
              return ((0xff - this[offset] + 1) * -1)
            };

            Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 2, this.length);
              var val = this[offset] | (this[offset + 1] << 8);
              return (val & 0x8000) ? val | 0xFFFF0000 : val
            };

            Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 2, this.length);
              var val = this[offset + 1] | (this[offset] << 8);
              return (val & 0x8000) ? val | 0xFFFF0000 : val
            };

            Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (this[offset]) |
                (this[offset + 1] << 8) |
                (this[offset + 2] << 16) |
                (this[offset + 3] << 24)
            };

            Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (this[offset] << 24) |
                (this[offset + 1] << 16) |
                (this[offset + 2] << 8) |
                (this[offset + 3])
            };

            Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 4, this.length);
              return read(this, offset, true, 23, 4)
            };

            Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 4, this.length);
              return read(this, offset, false, 23, 4)
            };

            Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 8, this.length);
              return read(this, offset, true, 52, 8)
            };

            Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 8, this.length);
              return read(this, offset, false, 52, 8)
            };

            function checkInt (buf, value, offset, ext, max, min) {
              if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
              if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
              if (offset + ext > buf.length) throw new RangeError('Index out of range')
            }

            Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
              value = +value;
              offset = offset | 0;
              byteLength = byteLength | 0;
              if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                checkInt(this, value, offset, byteLength, maxBytes, 0);
              }

              var mul = 1;
              var i = 0;
              this[offset] = value & 0xFF;
              while (++i < byteLength && (mul *= 0x100)) {
                this[offset + i] = (value / mul) & 0xFF;
              }

              return offset + byteLength
            };

            Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
              value = +value;
              offset = offset | 0;
              byteLength = byteLength | 0;
              if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                checkInt(this, value, offset, byteLength, maxBytes, 0);
              }

              var i = byteLength - 1;
              var mul = 1;
              this[offset + i] = value & 0xFF;
              while (--i >= 0 && (mul *= 0x100)) {
                this[offset + i] = (value / mul) & 0xFF;
              }

              return offset + byteLength
            };

            Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
              if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
              this[offset] = (value & 0xff);
              return offset + 1
            };

            function objectWriteUInt16 (buf, value, offset, littleEndian) {
              if (value < 0) value = 0xffff + value + 1;
              for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
                buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
                  (littleEndian ? i : 1 - i) * 8;
              }
            }

            Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value & 0xff);
                this[offset + 1] = (value >>> 8);
              } else {
                objectWriteUInt16(this, value, offset, true);
              }
              return offset + 2
            };

            Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value >>> 8);
                this[offset + 1] = (value & 0xff);
              } else {
                objectWriteUInt16(this, value, offset, false);
              }
              return offset + 2
            };

            function objectWriteUInt32 (buf, value, offset, littleEndian) {
              if (value < 0) value = 0xffffffff + value + 1;
              for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
                buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
              }
            }

            Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset + 3] = (value >>> 24);
                this[offset + 2] = (value >>> 16);
                this[offset + 1] = (value >>> 8);
                this[offset] = (value & 0xff);
              } else {
                objectWriteUInt32(this, value, offset, true);
              }
              return offset + 4
            };

            Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value >>> 24);
                this[offset + 1] = (value >>> 16);
                this[offset + 2] = (value >>> 8);
                this[offset + 3] = (value & 0xff);
              } else {
                objectWriteUInt32(this, value, offset, false);
              }
              return offset + 4
            };

            Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) {
                var limit = Math.pow(2, 8 * byteLength - 1);

                checkInt(this, value, offset, byteLength, limit - 1, -limit);
              }

              var i = 0;
              var mul = 1;
              var sub = 0;
              this[offset] = value & 0xFF;
              while (++i < byteLength && (mul *= 0x100)) {
                if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                  sub = 1;
                }
                this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
              }

              return offset + byteLength
            };

            Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) {
                var limit = Math.pow(2, 8 * byteLength - 1);

                checkInt(this, value, offset, byteLength, limit - 1, -limit);
              }

              var i = byteLength - 1;
              var mul = 1;
              var sub = 0;
              this[offset + i] = value & 0xFF;
              while (--i >= 0 && (mul *= 0x100)) {
                if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                  sub = 1;
                }
                this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
              }

              return offset + byteLength
            };

            Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
              if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
              if (value < 0) value = 0xff + value + 1;
              this[offset] = (value & 0xff);
              return offset + 1
            };

            Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value & 0xff);
                this[offset + 1] = (value >>> 8);
              } else {
                objectWriteUInt16(this, value, offset, true);
              }
              return offset + 2
            };

            Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value >>> 8);
                this[offset + 1] = (value & 0xff);
              } else {
                objectWriteUInt16(this, value, offset, false);
              }
              return offset + 2
            };

            Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value & 0xff);
                this[offset + 1] = (value >>> 8);
                this[offset + 2] = (value >>> 16);
                this[offset + 3] = (value >>> 24);
              } else {
                objectWriteUInt32(this, value, offset, true);
              }
              return offset + 4
            };

            Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
              if (value < 0) value = 0xffffffff + value + 1;
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value >>> 24);
                this[offset + 1] = (value >>> 16);
                this[offset + 2] = (value >>> 8);
                this[offset + 3] = (value & 0xff);
              } else {
                objectWriteUInt32(this, value, offset, false);
              }
              return offset + 4
            };

            function checkIEEE754 (buf, value, offset, ext, max, min) {
              if (offset + ext > buf.length) throw new RangeError('Index out of range')
              if (offset < 0) throw new RangeError('Index out of range')
            }

            function writeFloat (buf, value, offset, littleEndian, noAssert) {
              if (!noAssert) {
                checkIEEE754(buf, value, offset, 4);
              }
              write(buf, value, offset, littleEndian, 23, 4);
              return offset + 4
            }

            Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
              return writeFloat(this, value, offset, true, noAssert)
            };

            Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
              return writeFloat(this, value, offset, false, noAssert)
            };

            function writeDouble (buf, value, offset, littleEndian, noAssert) {
              if (!noAssert) {
                checkIEEE754(buf, value, offset, 8);
              }
              write(buf, value, offset, littleEndian, 52, 8);
              return offset + 8
            }

            Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
              return writeDouble(this, value, offset, true, noAssert)
            };

            Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
              return writeDouble(this, value, offset, false, noAssert)
            };

            // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
            Buffer.prototype.copy = function copy (target, targetStart, start, end) {
              if (!start) start = 0;
              if (!end && end !== 0) end = this.length;
              if (targetStart >= target.length) targetStart = target.length;
              if (!targetStart) targetStart = 0;
              if (end > 0 && end < start) end = start;

              // Copy 0 bytes; we're done
              if (end === start) return 0
              if (target.length === 0 || this.length === 0) return 0

              // Fatal error conditions
              if (targetStart < 0) {
                throw new RangeError('targetStart out of bounds')
              }
              if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
              if (end < 0) throw new RangeError('sourceEnd out of bounds')

              // Are we oob?
              if (end > this.length) end = this.length;
              if (target.length - targetStart < end - start) {
                end = target.length - targetStart + start;
              }

              var len = end - start;
              var i;

              if (this === target && start < targetStart && targetStart < end) {
                // descending copy from end
                for (i = len - 1; i >= 0; --i) {
                  target[i + targetStart] = this[i + start];
                }
              } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
                // ascending copy from start
                for (i = 0; i < len; ++i) {
                  target[i + targetStart] = this[i + start];
                }
              } else {
                Uint8Array.prototype.set.call(
                  target,
                  this.subarray(start, start + len),
                  targetStart
                );
              }

              return len
            };

            // Usage:
            //    buffer.fill(number[, offset[, end]])
            //    buffer.fill(buffer[, offset[, end]])
            //    buffer.fill(string[, offset[, end]][, encoding])
            Buffer.prototype.fill = function fill (val, start, end, encoding) {
              // Handle string cases:
              if (typeof val === 'string') {
                if (typeof start === 'string') {
                  encoding = start;
                  start = 0;
                  end = this.length;
                } else if (typeof end === 'string') {
                  encoding = end;
                  end = this.length;
                }
                if (val.length === 1) {
                  var code = val.charCodeAt(0);
                  if (code < 256) {
                    val = code;
                  }
                }
                if (encoding !== undefined && typeof encoding !== 'string') {
                  throw new TypeError('encoding must be a string')
                }
                if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
                  throw new TypeError('Unknown encoding: ' + encoding)
                }
              } else if (typeof val === 'number') {
                val = val & 255;
              }

              // Invalid ranges are not set to a default, so can range check early.
              if (start < 0 || this.length < start || this.length < end) {
                throw new RangeError('Out of range index')
              }

              if (end <= start) {
                return this
              }

              start = start >>> 0;
              end = end === undefined ? this.length : end >>> 0;

              if (!val) val = 0;

              var i;
              if (typeof val === 'number') {
                for (i = start; i < end; ++i) {
                  this[i] = val;
                }
              } else {
                var bytes = internalIsBuffer(val)
                  ? val
                  : utf8ToBytes(new Buffer(val, encoding).toString());
                var len = bytes.length;
                for (i = 0; i < end - start; ++i) {
                  this[i + start] = bytes[i % len];
                }
              }

              return this
            };

            // HELPER FUNCTIONS
            // ================

            var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

            function base64clean (str) {
              // Node strips out invalid characters like \n and \t from the string, base64-js does not
              str = stringtrim(str).replace(INVALID_BASE64_RE, '');
              // Node converts strings with length < 2 to ''
              if (str.length < 2) return ''
              // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
              while (str.length % 4 !== 0) {
                str = str + '=';
              }
              return str
            }

            function stringtrim (str) {
              if (str.trim) return str.trim()
              return str.replace(/^\s+|\s+$/g, '')
            }

            function toHex (n) {
              if (n < 16) return '0' + n.toString(16)
              return n.toString(16)
            }

            function utf8ToBytes (string, units) {
              units = units || Infinity;
              var codePoint;
              var length = string.length;
              var leadSurrogate = null;
              var bytes = [];

              for (var i = 0; i < length; ++i) {
                codePoint = string.charCodeAt(i);

                // is surrogate component
                if (codePoint > 0xD7FF && codePoint < 0xE000) {
                  // last char was a lead
                  if (!leadSurrogate) {
                    // no lead yet
                    if (codePoint > 0xDBFF) {
                      // unexpected trail
                      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                      continue
                    } else if (i + 1 === length) {
                      // unpaired lead
                      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                      continue
                    }

                    // valid lead
                    leadSurrogate = codePoint;

                    continue
                  }

                  // 2 leads in a row
                  if (codePoint < 0xDC00) {
                    if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                    leadSurrogate = codePoint;
                    continue
                  }

                  // valid surrogate pair
                  codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
                } else if (leadSurrogate) {
                  // valid bmp char, but last char was a lead
                  if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                }

                leadSurrogate = null;

                // encode utf8
                if (codePoint < 0x80) {
                  if ((units -= 1) < 0) break
                  bytes.push(codePoint);
                } else if (codePoint < 0x800) {
                  if ((units -= 2) < 0) break
                  bytes.push(
                    codePoint >> 0x6 | 0xC0,
                    codePoint & 0x3F | 0x80
                  );
                } else if (codePoint < 0x10000) {
                  if ((units -= 3) < 0) break
                  bytes.push(
                    codePoint >> 0xC | 0xE0,
                    codePoint >> 0x6 & 0x3F | 0x80,
                    codePoint & 0x3F | 0x80
                  );
                } else if (codePoint < 0x110000) {
                  if ((units -= 4) < 0) break
                  bytes.push(
                    codePoint >> 0x12 | 0xF0,
                    codePoint >> 0xC & 0x3F | 0x80,
                    codePoint >> 0x6 & 0x3F | 0x80,
                    codePoint & 0x3F | 0x80
                  );
                } else {
                  throw new Error('Invalid code point')
                }
              }

              return bytes
            }

            function asciiToBytes (str) {
              var byteArray = [];
              for (var i = 0; i < str.length; ++i) {
                // Node's code seems to be doing this and not & 0x7F..
                byteArray.push(str.charCodeAt(i) & 0xFF);
              }
              return byteArray
            }

            function utf16leToBytes (str, units) {
              var c, hi, lo;
              var byteArray = [];
              for (var i = 0; i < str.length; ++i) {
                if ((units -= 2) < 0) break

                c = str.charCodeAt(i);
                hi = c >> 8;
                lo = c % 256;
                byteArray.push(lo);
                byteArray.push(hi);
              }

              return byteArray
            }


            function base64ToBytes (str) {
              return toByteArray(base64clean(str))
            }

            function blitBuffer (src, dst, offset, length) {
              for (var i = 0; i < length; ++i) {
                if ((i + offset >= dst.length) || (i >= src.length)) break
                dst[i + offset] = src[i];
              }
              return i
            }

            function isnan (val) {
              return val !== val // eslint-disable-line no-self-compare
            }


            // the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
            // The _isBuffer check is for Safari 5-7 support, because it's missing
            // Object.prototype.constructor. Remove this eventually
            function isBuffer(obj) {
              return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
            }

            function isFastBuffer (obj) {
              return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
            }

            // For Node v0.10 support. Remove this eventually.
            function isSlowBuffer (obj) {
              return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
            }

            var bufferEs6 = /*#__PURE__*/Object.freeze({
                        INSPECT_MAX_BYTES: INSPECT_MAX_BYTES,
                        kMaxLength: _kMaxLength,
                        Buffer: Buffer,
                        SlowBuffer: SlowBuffer,
                        isBuffer: isBuffer
            });

            var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

            function createCommonjsModule(fn, module) {
            	return module = { exports: {} }, fn(module, module.exports), module.exports;
            }

            var bn = createCommonjsModule(function (module) {
            (function (module, exports) {

              // Utils
              function assert (val, msg) {
                if (!val) throw new Error(msg || 'Assertion failed');
              }

              // Could use `inherits` module, but don't want to move from single file
              // architecture yet.
              function inherits (ctor, superCtor) {
                ctor.super_ = superCtor;
                var TempCtor = function () {};
                TempCtor.prototype = superCtor.prototype;
                ctor.prototype = new TempCtor();
                ctor.prototype.constructor = ctor;
              }

              // BN

              function BN (number, base, endian) {
                if (BN.isBN(number)) {
                  return number;
                }

                this.negative = 0;
                this.words = null;
                this.length = 0;

                // Reduction context
                this.red = null;

                if (number !== null) {
                  if (base === 'le' || base === 'be') {
                    endian = base;
                    base = 10;
                  }

                  this._init(number || 0, base || 10, endian || 'be');
                }
              }
              if (typeof module === 'object') {
                module.exports = BN;
              } else {
                exports.BN = BN;
              }

              BN.BN = BN;
              BN.wordSize = 26;

              var Buffer;
              try {
                Buffer = bufferEs6.Buffer;
              } catch (e) {
              }

              BN.isBN = function isBN (num) {
                if (num instanceof BN) {
                  return true;
                }

                return num !== null && typeof num === 'object' &&
                  num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
              };

              BN.max = function max (left, right) {
                if (left.cmp(right) > 0) return left;
                return right;
              };

              BN.min = function min (left, right) {
                if (left.cmp(right) < 0) return left;
                return right;
              };

              BN.prototype._init = function init (number, base, endian) {
                if (typeof number === 'number') {
                  return this._initNumber(number, base, endian);
                }

                if (typeof number === 'object') {
                  return this._initArray(number, base, endian);
                }

                if (base === 'hex') {
                  base = 16;
                }
                assert(base === (base | 0) && base >= 2 && base <= 36);

                number = number.toString().replace(/\s+/g, '');
                var start = 0;
                if (number[0] === '-') {
                  start++;
                }

                if (base === 16) {
                  this._parseHex(number, start);
                } else {
                  this._parseBase(number, base, start);
                }

                if (number[0] === '-') {
                  this.negative = 1;
                }

                this.strip();

                if (endian !== 'le') return;

                this._initArray(this.toArray(), base, endian);
              };

              BN.prototype._initNumber = function _initNumber (number, base, endian) {
                if (number < 0) {
                  this.negative = 1;
                  number = -number;
                }
                if (number < 0x4000000) {
                  this.words = [ number & 0x3ffffff ];
                  this.length = 1;
                } else if (number < 0x10000000000000) {
                  this.words = [
                    number & 0x3ffffff,
                    (number / 0x4000000) & 0x3ffffff
                  ];
                  this.length = 2;
                } else {
                  assert(number < 0x20000000000000); // 2 ^ 53 (unsafe)
                  this.words = [
                    number & 0x3ffffff,
                    (number / 0x4000000) & 0x3ffffff,
                    1
                  ];
                  this.length = 3;
                }

                if (endian !== 'le') return;

                // Reverse the bytes
                this._initArray(this.toArray(), base, endian);
              };

              BN.prototype._initArray = function _initArray (number, base, endian) {
                // Perhaps a Uint8Array
                assert(typeof number.length === 'number');
                if (number.length <= 0) {
                  this.words = [ 0 ];
                  this.length = 1;
                  return this;
                }

                this.length = Math.ceil(number.length / 3);
                this.words = new Array(this.length);
                for (var i = 0; i < this.length; i++) {
                  this.words[i] = 0;
                }

                var j, w;
                var off = 0;
                if (endian === 'be') {
                  for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
                    w = number[i] | (number[i - 1] << 8) | (number[i - 2] << 16);
                    this.words[j] |= (w << off) & 0x3ffffff;
                    this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
                    off += 24;
                    if (off >= 26) {
                      off -= 26;
                      j++;
                    }
                  }
                } else if (endian === 'le') {
                  for (i = 0, j = 0; i < number.length; i += 3) {
                    w = number[i] | (number[i + 1] << 8) | (number[i + 2] << 16);
                    this.words[j] |= (w << off) & 0x3ffffff;
                    this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
                    off += 24;
                    if (off >= 26) {
                      off -= 26;
                      j++;
                    }
                  }
                }
                return this.strip();
              };

              function parseHex (str, start, end) {
                var r = 0;
                var len = Math.min(str.length, end);
                for (var i = start; i < len; i++) {
                  var c = str.charCodeAt(i) - 48;

                  r <<= 4;

                  // 'a' - 'f'
                  if (c >= 49 && c <= 54) {
                    r |= c - 49 + 0xa;

                  // 'A' - 'F'
                  } else if (c >= 17 && c <= 22) {
                    r |= c - 17 + 0xa;

                  // '0' - '9'
                  } else {
                    r |= c & 0xf;
                  }
                }
                return r;
              }

              BN.prototype._parseHex = function _parseHex (number, start) {
                // Create possibly bigger array to ensure that it fits the number
                this.length = Math.ceil((number.length - start) / 6);
                this.words = new Array(this.length);
                for (var i = 0; i < this.length; i++) {
                  this.words[i] = 0;
                }

                var j, w;
                // Scan 24-bit chunks and add them to the number
                var off = 0;
                for (i = number.length - 6, j = 0; i >= start; i -= 6) {
                  w = parseHex(number, i, i + 6);
                  this.words[j] |= (w << off) & 0x3ffffff;
                  // NOTE: `0x3fffff` is intentional here, 26bits max shift + 24bit hex limb
                  this.words[j + 1] |= w >>> (26 - off) & 0x3fffff;
                  off += 24;
                  if (off >= 26) {
                    off -= 26;
                    j++;
                  }
                }
                if (i + 6 !== start) {
                  w = parseHex(number, start, i + 6);
                  this.words[j] |= (w << off) & 0x3ffffff;
                  this.words[j + 1] |= w >>> (26 - off) & 0x3fffff;
                }
                this.strip();
              };

              function parseBase (str, start, end, mul) {
                var r = 0;
                var len = Math.min(str.length, end);
                for (var i = start; i < len; i++) {
                  var c = str.charCodeAt(i) - 48;

                  r *= mul;

                  // 'a'
                  if (c >= 49) {
                    r += c - 49 + 0xa;

                  // 'A'
                  } else if (c >= 17) {
                    r += c - 17 + 0xa;

                  // '0' - '9'
                  } else {
                    r += c;
                  }
                }
                return r;
              }

              BN.prototype._parseBase = function _parseBase (number, base, start) {
                // Initialize as zero
                this.words = [ 0 ];
                this.length = 1;

                // Find length of limb in base
                for (var limbLen = 0, limbPow = 1; limbPow <= 0x3ffffff; limbPow *= base) {
                  limbLen++;
                }
                limbLen--;
                limbPow = (limbPow / base) | 0;

                var total = number.length - start;
                var mod = total % limbLen;
                var end = Math.min(total, total - mod) + start;

                var word = 0;
                for (var i = start; i < end; i += limbLen) {
                  word = parseBase(number, i, i + limbLen, base);

                  this.imuln(limbPow);
                  if (this.words[0] + word < 0x4000000) {
                    this.words[0] += word;
                  } else {
                    this._iaddn(word);
                  }
                }

                if (mod !== 0) {
                  var pow = 1;
                  word = parseBase(number, i, number.length, base);

                  for (i = 0; i < mod; i++) {
                    pow *= base;
                  }

                  this.imuln(pow);
                  if (this.words[0] + word < 0x4000000) {
                    this.words[0] += word;
                  } else {
                    this._iaddn(word);
                  }
                }
              };

              BN.prototype.copy = function copy (dest) {
                dest.words = new Array(this.length);
                for (var i = 0; i < this.length; i++) {
                  dest.words[i] = this.words[i];
                }
                dest.length = this.length;
                dest.negative = this.negative;
                dest.red = this.red;
              };

              BN.prototype.clone = function clone () {
                var r = new BN(null);
                this.copy(r);
                return r;
              };

              BN.prototype._expand = function _expand (size) {
                while (this.length < size) {
                  this.words[this.length++] = 0;
                }
                return this;
              };

              // Remove leading `0` from `this`
              BN.prototype.strip = function strip () {
                while (this.length > 1 && this.words[this.length - 1] === 0) {
                  this.length--;
                }
                return this._normSign();
              };

              BN.prototype._normSign = function _normSign () {
                // -0 = 0
                if (this.length === 1 && this.words[0] === 0) {
                  this.negative = 0;
                }
                return this;
              };

              BN.prototype.inspect = function inspect () {
                return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>';
              };

              /*

              var zeros = [];
              var groupSizes = [];
              var groupBases = [];

              var s = '';
              var i = -1;
              while (++i < BN.wordSize) {
                zeros[i] = s;
                s += '0';
              }
              groupSizes[0] = 0;
              groupSizes[1] = 0;
              groupBases[0] = 0;
              groupBases[1] = 0;
              var base = 2 - 1;
              while (++base < 36 + 1) {
                var groupSize = 0;
                var groupBase = 1;
                while (groupBase < (1 << BN.wordSize) / base) {
                  groupBase *= base;
                  groupSize += 1;
                }
                groupSizes[base] = groupSize;
                groupBases[base] = groupBase;
              }

              */

              var zeros = [
                '',
                '0',
                '00',
                '000',
                '0000',
                '00000',
                '000000',
                '0000000',
                '00000000',
                '000000000',
                '0000000000',
                '00000000000',
                '000000000000',
                '0000000000000',
                '00000000000000',
                '000000000000000',
                '0000000000000000',
                '00000000000000000',
                '000000000000000000',
                '0000000000000000000',
                '00000000000000000000',
                '000000000000000000000',
                '0000000000000000000000',
                '00000000000000000000000',
                '000000000000000000000000',
                '0000000000000000000000000'
              ];

              var groupSizes = [
                0, 0,
                25, 16, 12, 11, 10, 9, 8,
                8, 7, 7, 7, 7, 6, 6,
                6, 6, 6, 6, 6, 5, 5,
                5, 5, 5, 5, 5, 5, 5,
                5, 5, 5, 5, 5, 5, 5
              ];

              var groupBases = [
                0, 0,
                33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216,
                43046721, 10000000, 19487171, 35831808, 62748517, 7529536, 11390625,
                16777216, 24137569, 34012224, 47045881, 64000000, 4084101, 5153632,
                6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149,
                24300000, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176
              ];

              BN.prototype.toString = function toString (base, padding) {
                base = base || 10;
                padding = padding | 0 || 1;

                var out;
                if (base === 16 || base === 'hex') {
                  out = '';
                  var off = 0;
                  var carry = 0;
                  for (var i = 0; i < this.length; i++) {
                    var w = this.words[i];
                    var word = (((w << off) | carry) & 0xffffff).toString(16);
                    carry = (w >>> (24 - off)) & 0xffffff;
                    if (carry !== 0 || i !== this.length - 1) {
                      out = zeros[6 - word.length] + word + out;
                    } else {
                      out = word + out;
                    }
                    off += 2;
                    if (off >= 26) {
                      off -= 26;
                      i--;
                    }
                  }
                  if (carry !== 0) {
                    out = carry.toString(16) + out;
                  }
                  while (out.length % padding !== 0) {
                    out = '0' + out;
                  }
                  if (this.negative !== 0) {
                    out = '-' + out;
                  }
                  return out;
                }

                if (base === (base | 0) && base >= 2 && base <= 36) {
                  // var groupSize = Math.floor(BN.wordSize * Math.LN2 / Math.log(base));
                  var groupSize = groupSizes[base];
                  // var groupBase = Math.pow(base, groupSize);
                  var groupBase = groupBases[base];
                  out = '';
                  var c = this.clone();
                  c.negative = 0;
                  while (!c.isZero()) {
                    var r = c.modn(groupBase).toString(base);
                    c = c.idivn(groupBase);

                    if (!c.isZero()) {
                      out = zeros[groupSize - r.length] + r + out;
                    } else {
                      out = r + out;
                    }
                  }
                  if (this.isZero()) {
                    out = '0' + out;
                  }
                  while (out.length % padding !== 0) {
                    out = '0' + out;
                  }
                  if (this.negative !== 0) {
                    out = '-' + out;
                  }
                  return out;
                }

                assert(false, 'Base should be between 2 and 36');
              };

              BN.prototype.toNumber = function toNumber () {
                var ret = this.words[0];
                if (this.length === 2) {
                  ret += this.words[1] * 0x4000000;
                } else if (this.length === 3 && this.words[2] === 0x01) {
                  // NOTE: at this stage it is known that the top bit is set
                  ret += 0x10000000000000 + (this.words[1] * 0x4000000);
                } else if (this.length > 2) {
                  assert(false, 'Number can only safely store up to 53 bits');
                }
                return (this.negative !== 0) ? -ret : ret;
              };

              BN.prototype.toJSON = function toJSON () {
                return this.toString(16);
              };

              BN.prototype.toBuffer = function toBuffer (endian, length) {
                assert(typeof Buffer !== 'undefined');
                return this.toArrayLike(Buffer, endian, length);
              };

              BN.prototype.toArray = function toArray (endian, length) {
                return this.toArrayLike(Array, endian, length);
              };

              BN.prototype.toArrayLike = function toArrayLike (ArrayType, endian, length) {
                var byteLength = this.byteLength();
                var reqLength = length || Math.max(1, byteLength);
                assert(byteLength <= reqLength, 'byte array longer than desired length');
                assert(reqLength > 0, 'Requested array length <= 0');

                this.strip();
                var littleEndian = endian === 'le';
                var res = new ArrayType(reqLength);

                var b, i;
                var q = this.clone();
                if (!littleEndian) {
                  // Assume big-endian
                  for (i = 0; i < reqLength - byteLength; i++) {
                    res[i] = 0;
                  }

                  for (i = 0; !q.isZero(); i++) {
                    b = q.andln(0xff);
                    q.iushrn(8);

                    res[reqLength - i - 1] = b;
                  }
                } else {
                  for (i = 0; !q.isZero(); i++) {
                    b = q.andln(0xff);
                    q.iushrn(8);

                    res[i] = b;
                  }

                  for (; i < reqLength; i++) {
                    res[i] = 0;
                  }
                }

                return res;
              };

              if (Math.clz32) {
                BN.prototype._countBits = function _countBits (w) {
                  return 32 - Math.clz32(w);
                };
              } else {
                BN.prototype._countBits = function _countBits (w) {
                  var t = w;
                  var r = 0;
                  if (t >= 0x1000) {
                    r += 13;
                    t >>>= 13;
                  }
                  if (t >= 0x40) {
                    r += 7;
                    t >>>= 7;
                  }
                  if (t >= 0x8) {
                    r += 4;
                    t >>>= 4;
                  }
                  if (t >= 0x02) {
                    r += 2;
                    t >>>= 2;
                  }
                  return r + t;
                };
              }

              BN.prototype._zeroBits = function _zeroBits (w) {
                // Short-cut
                if (w === 0) return 26;

                var t = w;
                var r = 0;
                if ((t & 0x1fff) === 0) {
                  r += 13;
                  t >>>= 13;
                }
                if ((t & 0x7f) === 0) {
                  r += 7;
                  t >>>= 7;
                }
                if ((t & 0xf) === 0) {
                  r += 4;
                  t >>>= 4;
                }
                if ((t & 0x3) === 0) {
                  r += 2;
                  t >>>= 2;
                }
                if ((t & 0x1) === 0) {
                  r++;
                }
                return r;
              };

              // Return number of used bits in a BN
              BN.prototype.bitLength = function bitLength () {
                var w = this.words[this.length - 1];
                var hi = this._countBits(w);
                return (this.length - 1) * 26 + hi;
              };

              function toBitArray (num) {
                var w = new Array(num.bitLength());

                for (var bit = 0; bit < w.length; bit++) {
                  var off = (bit / 26) | 0;
                  var wbit = bit % 26;

                  w[bit] = (num.words[off] & (1 << wbit)) >>> wbit;
                }

                return w;
              }

              // Number of trailing zero bits
              BN.prototype.zeroBits = function zeroBits () {
                if (this.isZero()) return 0;

                var r = 0;
                for (var i = 0; i < this.length; i++) {
                  var b = this._zeroBits(this.words[i]);
                  r += b;
                  if (b !== 26) break;
                }
                return r;
              };

              BN.prototype.byteLength = function byteLength () {
                return Math.ceil(this.bitLength() / 8);
              };

              BN.prototype.toTwos = function toTwos (width) {
                if (this.negative !== 0) {
                  return this.abs().inotn(width).iaddn(1);
                }
                return this.clone();
              };

              BN.prototype.fromTwos = function fromTwos (width) {
                if (this.testn(width - 1)) {
                  return this.notn(width).iaddn(1).ineg();
                }
                return this.clone();
              };

              BN.prototype.isNeg = function isNeg () {
                return this.negative !== 0;
              };

              // Return negative clone of `this`
              BN.prototype.neg = function neg () {
                return this.clone().ineg();
              };

              BN.prototype.ineg = function ineg () {
                if (!this.isZero()) {
                  this.negative ^= 1;
                }

                return this;
              };

              // Or `num` with `this` in-place
              BN.prototype.iuor = function iuor (num) {
                while (this.length < num.length) {
                  this.words[this.length++] = 0;
                }

                for (var i = 0; i < num.length; i++) {
                  this.words[i] = this.words[i] | num.words[i];
                }

                return this.strip();
              };

              BN.prototype.ior = function ior (num) {
                assert((this.negative | num.negative) === 0);
                return this.iuor(num);
              };

              // Or `num` with `this`
              BN.prototype.or = function or (num) {
                if (this.length > num.length) return this.clone().ior(num);
                return num.clone().ior(this);
              };

              BN.prototype.uor = function uor (num) {
                if (this.length > num.length) return this.clone().iuor(num);
                return num.clone().iuor(this);
              };

              // And `num` with `this` in-place
              BN.prototype.iuand = function iuand (num) {
                // b = min-length(num, this)
                var b;
                if (this.length > num.length) {
                  b = num;
                } else {
                  b = this;
                }

                for (var i = 0; i < b.length; i++) {
                  this.words[i] = this.words[i] & num.words[i];
                }

                this.length = b.length;

                return this.strip();
              };

              BN.prototype.iand = function iand (num) {
                assert((this.negative | num.negative) === 0);
                return this.iuand(num);
              };

              // And `num` with `this`
              BN.prototype.and = function and (num) {
                if (this.length > num.length) return this.clone().iand(num);
                return num.clone().iand(this);
              };

              BN.prototype.uand = function uand (num) {
                if (this.length > num.length) return this.clone().iuand(num);
                return num.clone().iuand(this);
              };

              // Xor `num` with `this` in-place
              BN.prototype.iuxor = function iuxor (num) {
                // a.length > b.length
                var a;
                var b;
                if (this.length > num.length) {
                  a = this;
                  b = num;
                } else {
                  a = num;
                  b = this;
                }

                for (var i = 0; i < b.length; i++) {
                  this.words[i] = a.words[i] ^ b.words[i];
                }

                if (this !== a) {
                  for (; i < a.length; i++) {
                    this.words[i] = a.words[i];
                  }
                }

                this.length = a.length;

                return this.strip();
              };

              BN.prototype.ixor = function ixor (num) {
                assert((this.negative | num.negative) === 0);
                return this.iuxor(num);
              };

              // Xor `num` with `this`
              BN.prototype.xor = function xor (num) {
                if (this.length > num.length) return this.clone().ixor(num);
                return num.clone().ixor(this);
              };

              BN.prototype.uxor = function uxor (num) {
                if (this.length > num.length) return this.clone().iuxor(num);
                return num.clone().iuxor(this);
              };

              // Not ``this`` with ``width`` bitwidth
              BN.prototype.inotn = function inotn (width) {
                assert(typeof width === 'number' && width >= 0);

                var bytesNeeded = Math.ceil(width / 26) | 0;
                var bitsLeft = width % 26;

                // Extend the buffer with leading zeroes
                this._expand(bytesNeeded);

                if (bitsLeft > 0) {
                  bytesNeeded--;
                }

                // Handle complete words
                for (var i = 0; i < bytesNeeded; i++) {
                  this.words[i] = ~this.words[i] & 0x3ffffff;
                }

                // Handle the residue
                if (bitsLeft > 0) {
                  this.words[i] = ~this.words[i] & (0x3ffffff >> (26 - bitsLeft));
                }

                // And remove leading zeroes
                return this.strip();
              };

              BN.prototype.notn = function notn (width) {
                return this.clone().inotn(width);
              };

              // Set `bit` of `this`
              BN.prototype.setn = function setn (bit, val) {
                assert(typeof bit === 'number' && bit >= 0);

                var off = (bit / 26) | 0;
                var wbit = bit % 26;

                this._expand(off + 1);

                if (val) {
                  this.words[off] = this.words[off] | (1 << wbit);
                } else {
                  this.words[off] = this.words[off] & ~(1 << wbit);
                }

                return this.strip();
              };

              // Add `num` to `this` in-place
              BN.prototype.iadd = function iadd (num) {
                var r;

                // negative + positive
                if (this.negative !== 0 && num.negative === 0) {
                  this.negative = 0;
                  r = this.isub(num);
                  this.negative ^= 1;
                  return this._normSign();

                // positive + negative
                } else if (this.negative === 0 && num.negative !== 0) {
                  num.negative = 0;
                  r = this.isub(num);
                  num.negative = 1;
                  return r._normSign();
                }

                // a.length > b.length
                var a, b;
                if (this.length > num.length) {
                  a = this;
                  b = num;
                } else {
                  a = num;
                  b = this;
                }

                var carry = 0;
                for (var i = 0; i < b.length; i++) {
                  r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
                  this.words[i] = r & 0x3ffffff;
                  carry = r >>> 26;
                }
                for (; carry !== 0 && i < a.length; i++) {
                  r = (a.words[i] | 0) + carry;
                  this.words[i] = r & 0x3ffffff;
                  carry = r >>> 26;
                }

                this.length = a.length;
                if (carry !== 0) {
                  this.words[this.length] = carry;
                  this.length++;
                // Copy the rest of the words
                } else if (a !== this) {
                  for (; i < a.length; i++) {
                    this.words[i] = a.words[i];
                  }
                }

                return this;
              };

              // Add `num` to `this`
              BN.prototype.add = function add (num) {
                var res;
                if (num.negative !== 0 && this.negative === 0) {
                  num.negative = 0;
                  res = this.sub(num);
                  num.negative ^= 1;
                  return res;
                } else if (num.negative === 0 && this.negative !== 0) {
                  this.negative = 0;
                  res = num.sub(this);
                  this.negative = 1;
                  return res;
                }

                if (this.length > num.length) return this.clone().iadd(num);

                return num.clone().iadd(this);
              };

              // Subtract `num` from `this` in-place
              BN.prototype.isub = function isub (num) {
                // this - (-num) = this + num
                if (num.negative !== 0) {
                  num.negative = 0;
                  var r = this.iadd(num);
                  num.negative = 1;
                  return r._normSign();

                // -this - num = -(this + num)
                } else if (this.negative !== 0) {
                  this.negative = 0;
                  this.iadd(num);
                  this.negative = 1;
                  return this._normSign();
                }

                // At this point both numbers are positive
                var cmp = this.cmp(num);

                // Optimization - zeroify
                if (cmp === 0) {
                  this.negative = 0;
                  this.length = 1;
                  this.words[0] = 0;
                  return this;
                }

                // a > b
                var a, b;
                if (cmp > 0) {
                  a = this;
                  b = num;
                } else {
                  a = num;
                  b = this;
                }

                var carry = 0;
                for (var i = 0; i < b.length; i++) {
                  r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
                  carry = r >> 26;
                  this.words[i] = r & 0x3ffffff;
                }
                for (; carry !== 0 && i < a.length; i++) {
                  r = (a.words[i] | 0) + carry;
                  carry = r >> 26;
                  this.words[i] = r & 0x3ffffff;
                }

                // Copy rest of the words
                if (carry === 0 && i < a.length && a !== this) {
                  for (; i < a.length; i++) {
                    this.words[i] = a.words[i];
                  }
                }

                this.length = Math.max(this.length, i);

                if (a !== this) {
                  this.negative = 1;
                }

                return this.strip();
              };

              // Subtract `num` from `this`
              BN.prototype.sub = function sub (num) {
                return this.clone().isub(num);
              };

              function smallMulTo (self, num, out) {
                out.negative = num.negative ^ self.negative;
                var len = (self.length + num.length) | 0;
                out.length = len;
                len = (len - 1) | 0;

                // Peel one iteration (compiler can't do it, because of code complexity)
                var a = self.words[0] | 0;
                var b = num.words[0] | 0;
                var r = a * b;

                var lo = r & 0x3ffffff;
                var carry = (r / 0x4000000) | 0;
                out.words[0] = lo;

                for (var k = 1; k < len; k++) {
                  // Sum all words with the same `i + j = k` and accumulate `ncarry`,
                  // note that ncarry could be >= 0x3ffffff
                  var ncarry = carry >>> 26;
                  var rword = carry & 0x3ffffff;
                  var maxJ = Math.min(k, num.length - 1);
                  for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
                    var i = (k - j) | 0;
                    a = self.words[i] | 0;
                    b = num.words[j] | 0;
                    r = a * b + rword;
                    ncarry += (r / 0x4000000) | 0;
                    rword = r & 0x3ffffff;
                  }
                  out.words[k] = rword | 0;
                  carry = ncarry | 0;
                }
                if (carry !== 0) {
                  out.words[k] = carry | 0;
                } else {
                  out.length--;
                }

                return out.strip();
              }

              // TODO(indutny): it may be reasonable to omit it for users who don't need
              // to work with 256-bit numbers, otherwise it gives 20% improvement for 256-bit
              // multiplication (like elliptic secp256k1).
              var comb10MulTo = function comb10MulTo (self, num, out) {
                var a = self.words;
                var b = num.words;
                var o = out.words;
                var c = 0;
                var lo;
                var mid;
                var hi;
                var a0 = a[0] | 0;
                var al0 = a0 & 0x1fff;
                var ah0 = a0 >>> 13;
                var a1 = a[1] | 0;
                var al1 = a1 & 0x1fff;
                var ah1 = a1 >>> 13;
                var a2 = a[2] | 0;
                var al2 = a2 & 0x1fff;
                var ah2 = a2 >>> 13;
                var a3 = a[3] | 0;
                var al3 = a3 & 0x1fff;
                var ah3 = a3 >>> 13;
                var a4 = a[4] | 0;
                var al4 = a4 & 0x1fff;
                var ah4 = a4 >>> 13;
                var a5 = a[5] | 0;
                var al5 = a5 & 0x1fff;
                var ah5 = a5 >>> 13;
                var a6 = a[6] | 0;
                var al6 = a6 & 0x1fff;
                var ah6 = a6 >>> 13;
                var a7 = a[7] | 0;
                var al7 = a7 & 0x1fff;
                var ah7 = a7 >>> 13;
                var a8 = a[8] | 0;
                var al8 = a8 & 0x1fff;
                var ah8 = a8 >>> 13;
                var a9 = a[9] | 0;
                var al9 = a9 & 0x1fff;
                var ah9 = a9 >>> 13;
                var b0 = b[0] | 0;
                var bl0 = b0 & 0x1fff;
                var bh0 = b0 >>> 13;
                var b1 = b[1] | 0;
                var bl1 = b1 & 0x1fff;
                var bh1 = b1 >>> 13;
                var b2 = b[2] | 0;
                var bl2 = b2 & 0x1fff;
                var bh2 = b2 >>> 13;
                var b3 = b[3] | 0;
                var bl3 = b3 & 0x1fff;
                var bh3 = b3 >>> 13;
                var b4 = b[4] | 0;
                var bl4 = b4 & 0x1fff;
                var bh4 = b4 >>> 13;
                var b5 = b[5] | 0;
                var bl5 = b5 & 0x1fff;
                var bh5 = b5 >>> 13;
                var b6 = b[6] | 0;
                var bl6 = b6 & 0x1fff;
                var bh6 = b6 >>> 13;
                var b7 = b[7] | 0;
                var bl7 = b7 & 0x1fff;
                var bh7 = b7 >>> 13;
                var b8 = b[8] | 0;
                var bl8 = b8 & 0x1fff;
                var bh8 = b8 >>> 13;
                var b9 = b[9] | 0;
                var bl9 = b9 & 0x1fff;
                var bh9 = b9 >>> 13;

                out.negative = self.negative ^ num.negative;
                out.length = 19;
                /* k = 0 */
                lo = Math.imul(al0, bl0);
                mid = Math.imul(al0, bh0);
                mid = (mid + Math.imul(ah0, bl0)) | 0;
                hi = Math.imul(ah0, bh0);
                var w0 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w0 >>> 26)) | 0;
                w0 &= 0x3ffffff;
                /* k = 1 */
                lo = Math.imul(al1, bl0);
                mid = Math.imul(al1, bh0);
                mid = (mid + Math.imul(ah1, bl0)) | 0;
                hi = Math.imul(ah1, bh0);
                lo = (lo + Math.imul(al0, bl1)) | 0;
                mid = (mid + Math.imul(al0, bh1)) | 0;
                mid = (mid + Math.imul(ah0, bl1)) | 0;
                hi = (hi + Math.imul(ah0, bh1)) | 0;
                var w1 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w1 >>> 26)) | 0;
                w1 &= 0x3ffffff;
                /* k = 2 */
                lo = Math.imul(al2, bl0);
                mid = Math.imul(al2, bh0);
                mid = (mid + Math.imul(ah2, bl0)) | 0;
                hi = Math.imul(ah2, bh0);
                lo = (lo + Math.imul(al1, bl1)) | 0;
                mid = (mid + Math.imul(al1, bh1)) | 0;
                mid = (mid + Math.imul(ah1, bl1)) | 0;
                hi = (hi + Math.imul(ah1, bh1)) | 0;
                lo = (lo + Math.imul(al0, bl2)) | 0;
                mid = (mid + Math.imul(al0, bh2)) | 0;
                mid = (mid + Math.imul(ah0, bl2)) | 0;
                hi = (hi + Math.imul(ah0, bh2)) | 0;
                var w2 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w2 >>> 26)) | 0;
                w2 &= 0x3ffffff;
                /* k = 3 */
                lo = Math.imul(al3, bl0);
                mid = Math.imul(al3, bh0);
                mid = (mid + Math.imul(ah3, bl0)) | 0;
                hi = Math.imul(ah3, bh0);
                lo = (lo + Math.imul(al2, bl1)) | 0;
                mid = (mid + Math.imul(al2, bh1)) | 0;
                mid = (mid + Math.imul(ah2, bl1)) | 0;
                hi = (hi + Math.imul(ah2, bh1)) | 0;
                lo = (lo + Math.imul(al1, bl2)) | 0;
                mid = (mid + Math.imul(al1, bh2)) | 0;
                mid = (mid + Math.imul(ah1, bl2)) | 0;
                hi = (hi + Math.imul(ah1, bh2)) | 0;
                lo = (lo + Math.imul(al0, bl3)) | 0;
                mid = (mid + Math.imul(al0, bh3)) | 0;
                mid = (mid + Math.imul(ah0, bl3)) | 0;
                hi = (hi + Math.imul(ah0, bh3)) | 0;
                var w3 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w3 >>> 26)) | 0;
                w3 &= 0x3ffffff;
                /* k = 4 */
                lo = Math.imul(al4, bl0);
                mid = Math.imul(al4, bh0);
                mid = (mid + Math.imul(ah4, bl0)) | 0;
                hi = Math.imul(ah4, bh0);
                lo = (lo + Math.imul(al3, bl1)) | 0;
                mid = (mid + Math.imul(al3, bh1)) | 0;
                mid = (mid + Math.imul(ah3, bl1)) | 0;
                hi = (hi + Math.imul(ah3, bh1)) | 0;
                lo = (lo + Math.imul(al2, bl2)) | 0;
                mid = (mid + Math.imul(al2, bh2)) | 0;
                mid = (mid + Math.imul(ah2, bl2)) | 0;
                hi = (hi + Math.imul(ah2, bh2)) | 0;
                lo = (lo + Math.imul(al1, bl3)) | 0;
                mid = (mid + Math.imul(al1, bh3)) | 0;
                mid = (mid + Math.imul(ah1, bl3)) | 0;
                hi = (hi + Math.imul(ah1, bh3)) | 0;
                lo = (lo + Math.imul(al0, bl4)) | 0;
                mid = (mid + Math.imul(al0, bh4)) | 0;
                mid = (mid + Math.imul(ah0, bl4)) | 0;
                hi = (hi + Math.imul(ah0, bh4)) | 0;
                var w4 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w4 >>> 26)) | 0;
                w4 &= 0x3ffffff;
                /* k = 5 */
                lo = Math.imul(al5, bl0);
                mid = Math.imul(al5, bh0);
                mid = (mid + Math.imul(ah5, bl0)) | 0;
                hi = Math.imul(ah5, bh0);
                lo = (lo + Math.imul(al4, bl1)) | 0;
                mid = (mid + Math.imul(al4, bh1)) | 0;
                mid = (mid + Math.imul(ah4, bl1)) | 0;
                hi = (hi + Math.imul(ah4, bh1)) | 0;
                lo = (lo + Math.imul(al3, bl2)) | 0;
                mid = (mid + Math.imul(al3, bh2)) | 0;
                mid = (mid + Math.imul(ah3, bl2)) | 0;
                hi = (hi + Math.imul(ah3, bh2)) | 0;
                lo = (lo + Math.imul(al2, bl3)) | 0;
                mid = (mid + Math.imul(al2, bh3)) | 0;
                mid = (mid + Math.imul(ah2, bl3)) | 0;
                hi = (hi + Math.imul(ah2, bh3)) | 0;
                lo = (lo + Math.imul(al1, bl4)) | 0;
                mid = (mid + Math.imul(al1, bh4)) | 0;
                mid = (mid + Math.imul(ah1, bl4)) | 0;
                hi = (hi + Math.imul(ah1, bh4)) | 0;
                lo = (lo + Math.imul(al0, bl5)) | 0;
                mid = (mid + Math.imul(al0, bh5)) | 0;
                mid = (mid + Math.imul(ah0, bl5)) | 0;
                hi = (hi + Math.imul(ah0, bh5)) | 0;
                var w5 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w5 >>> 26)) | 0;
                w5 &= 0x3ffffff;
                /* k = 6 */
                lo = Math.imul(al6, bl0);
                mid = Math.imul(al6, bh0);
                mid = (mid + Math.imul(ah6, bl0)) | 0;
                hi = Math.imul(ah6, bh0);
                lo = (lo + Math.imul(al5, bl1)) | 0;
                mid = (mid + Math.imul(al5, bh1)) | 0;
                mid = (mid + Math.imul(ah5, bl1)) | 0;
                hi = (hi + Math.imul(ah5, bh1)) | 0;
                lo = (lo + Math.imul(al4, bl2)) | 0;
                mid = (mid + Math.imul(al4, bh2)) | 0;
                mid = (mid + Math.imul(ah4, bl2)) | 0;
                hi = (hi + Math.imul(ah4, bh2)) | 0;
                lo = (lo + Math.imul(al3, bl3)) | 0;
                mid = (mid + Math.imul(al3, bh3)) | 0;
                mid = (mid + Math.imul(ah3, bl3)) | 0;
                hi = (hi + Math.imul(ah3, bh3)) | 0;
                lo = (lo + Math.imul(al2, bl4)) | 0;
                mid = (mid + Math.imul(al2, bh4)) | 0;
                mid = (mid + Math.imul(ah2, bl4)) | 0;
                hi = (hi + Math.imul(ah2, bh4)) | 0;
                lo = (lo + Math.imul(al1, bl5)) | 0;
                mid = (mid + Math.imul(al1, bh5)) | 0;
                mid = (mid + Math.imul(ah1, bl5)) | 0;
                hi = (hi + Math.imul(ah1, bh5)) | 0;
                lo = (lo + Math.imul(al0, bl6)) | 0;
                mid = (mid + Math.imul(al0, bh6)) | 0;
                mid = (mid + Math.imul(ah0, bl6)) | 0;
                hi = (hi + Math.imul(ah0, bh6)) | 0;
                var w6 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w6 >>> 26)) | 0;
                w6 &= 0x3ffffff;
                /* k = 7 */
                lo = Math.imul(al7, bl0);
                mid = Math.imul(al7, bh0);
                mid = (mid + Math.imul(ah7, bl0)) | 0;
                hi = Math.imul(ah7, bh0);
                lo = (lo + Math.imul(al6, bl1)) | 0;
                mid = (mid + Math.imul(al6, bh1)) | 0;
                mid = (mid + Math.imul(ah6, bl1)) | 0;
                hi = (hi + Math.imul(ah6, bh1)) | 0;
                lo = (lo + Math.imul(al5, bl2)) | 0;
                mid = (mid + Math.imul(al5, bh2)) | 0;
                mid = (mid + Math.imul(ah5, bl2)) | 0;
                hi = (hi + Math.imul(ah5, bh2)) | 0;
                lo = (lo + Math.imul(al4, bl3)) | 0;
                mid = (mid + Math.imul(al4, bh3)) | 0;
                mid = (mid + Math.imul(ah4, bl3)) | 0;
                hi = (hi + Math.imul(ah4, bh3)) | 0;
                lo = (lo + Math.imul(al3, bl4)) | 0;
                mid = (mid + Math.imul(al3, bh4)) | 0;
                mid = (mid + Math.imul(ah3, bl4)) | 0;
                hi = (hi + Math.imul(ah3, bh4)) | 0;
                lo = (lo + Math.imul(al2, bl5)) | 0;
                mid = (mid + Math.imul(al2, bh5)) | 0;
                mid = (mid + Math.imul(ah2, bl5)) | 0;
                hi = (hi + Math.imul(ah2, bh5)) | 0;
                lo = (lo + Math.imul(al1, bl6)) | 0;
                mid = (mid + Math.imul(al1, bh6)) | 0;
                mid = (mid + Math.imul(ah1, bl6)) | 0;
                hi = (hi + Math.imul(ah1, bh6)) | 0;
                lo = (lo + Math.imul(al0, bl7)) | 0;
                mid = (mid + Math.imul(al0, bh7)) | 0;
                mid = (mid + Math.imul(ah0, bl7)) | 0;
                hi = (hi + Math.imul(ah0, bh7)) | 0;
                var w7 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w7 >>> 26)) | 0;
                w7 &= 0x3ffffff;
                /* k = 8 */
                lo = Math.imul(al8, bl0);
                mid = Math.imul(al8, bh0);
                mid = (mid + Math.imul(ah8, bl0)) | 0;
                hi = Math.imul(ah8, bh0);
                lo = (lo + Math.imul(al7, bl1)) | 0;
                mid = (mid + Math.imul(al7, bh1)) | 0;
                mid = (mid + Math.imul(ah7, bl1)) | 0;
                hi = (hi + Math.imul(ah7, bh1)) | 0;
                lo = (lo + Math.imul(al6, bl2)) | 0;
                mid = (mid + Math.imul(al6, bh2)) | 0;
                mid = (mid + Math.imul(ah6, bl2)) | 0;
                hi = (hi + Math.imul(ah6, bh2)) | 0;
                lo = (lo + Math.imul(al5, bl3)) | 0;
                mid = (mid + Math.imul(al5, bh3)) | 0;
                mid = (mid + Math.imul(ah5, bl3)) | 0;
                hi = (hi + Math.imul(ah5, bh3)) | 0;
                lo = (lo + Math.imul(al4, bl4)) | 0;
                mid = (mid + Math.imul(al4, bh4)) | 0;
                mid = (mid + Math.imul(ah4, bl4)) | 0;
                hi = (hi + Math.imul(ah4, bh4)) | 0;
                lo = (lo + Math.imul(al3, bl5)) | 0;
                mid = (mid + Math.imul(al3, bh5)) | 0;
                mid = (mid + Math.imul(ah3, bl5)) | 0;
                hi = (hi + Math.imul(ah3, bh5)) | 0;
                lo = (lo + Math.imul(al2, bl6)) | 0;
                mid = (mid + Math.imul(al2, bh6)) | 0;
                mid = (mid + Math.imul(ah2, bl6)) | 0;
                hi = (hi + Math.imul(ah2, bh6)) | 0;
                lo = (lo + Math.imul(al1, bl7)) | 0;
                mid = (mid + Math.imul(al1, bh7)) | 0;
                mid = (mid + Math.imul(ah1, bl7)) | 0;
                hi = (hi + Math.imul(ah1, bh7)) | 0;
                lo = (lo + Math.imul(al0, bl8)) | 0;
                mid = (mid + Math.imul(al0, bh8)) | 0;
                mid = (mid + Math.imul(ah0, bl8)) | 0;
                hi = (hi + Math.imul(ah0, bh8)) | 0;
                var w8 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w8 >>> 26)) | 0;
                w8 &= 0x3ffffff;
                /* k = 9 */
                lo = Math.imul(al9, bl0);
                mid = Math.imul(al9, bh0);
                mid = (mid + Math.imul(ah9, bl0)) | 0;
                hi = Math.imul(ah9, bh0);
                lo = (lo + Math.imul(al8, bl1)) | 0;
                mid = (mid + Math.imul(al8, bh1)) | 0;
                mid = (mid + Math.imul(ah8, bl1)) | 0;
                hi = (hi + Math.imul(ah8, bh1)) | 0;
                lo = (lo + Math.imul(al7, bl2)) | 0;
                mid = (mid + Math.imul(al7, bh2)) | 0;
                mid = (mid + Math.imul(ah7, bl2)) | 0;
                hi = (hi + Math.imul(ah7, bh2)) | 0;
                lo = (lo + Math.imul(al6, bl3)) | 0;
                mid = (mid + Math.imul(al6, bh3)) | 0;
                mid = (mid + Math.imul(ah6, bl3)) | 0;
                hi = (hi + Math.imul(ah6, bh3)) | 0;
                lo = (lo + Math.imul(al5, bl4)) | 0;
                mid = (mid + Math.imul(al5, bh4)) | 0;
                mid = (mid + Math.imul(ah5, bl4)) | 0;
                hi = (hi + Math.imul(ah5, bh4)) | 0;
                lo = (lo + Math.imul(al4, bl5)) | 0;
                mid = (mid + Math.imul(al4, bh5)) | 0;
                mid = (mid + Math.imul(ah4, bl5)) | 0;
                hi = (hi + Math.imul(ah4, bh5)) | 0;
                lo = (lo + Math.imul(al3, bl6)) | 0;
                mid = (mid + Math.imul(al3, bh6)) | 0;
                mid = (mid + Math.imul(ah3, bl6)) | 0;
                hi = (hi + Math.imul(ah3, bh6)) | 0;
                lo = (lo + Math.imul(al2, bl7)) | 0;
                mid = (mid + Math.imul(al2, bh7)) | 0;
                mid = (mid + Math.imul(ah2, bl7)) | 0;
                hi = (hi + Math.imul(ah2, bh7)) | 0;
                lo = (lo + Math.imul(al1, bl8)) | 0;
                mid = (mid + Math.imul(al1, bh8)) | 0;
                mid = (mid + Math.imul(ah1, bl8)) | 0;
                hi = (hi + Math.imul(ah1, bh8)) | 0;
                lo = (lo + Math.imul(al0, bl9)) | 0;
                mid = (mid + Math.imul(al0, bh9)) | 0;
                mid = (mid + Math.imul(ah0, bl9)) | 0;
                hi = (hi + Math.imul(ah0, bh9)) | 0;
                var w9 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w9 >>> 26)) | 0;
                w9 &= 0x3ffffff;
                /* k = 10 */
                lo = Math.imul(al9, bl1);
                mid = Math.imul(al9, bh1);
                mid = (mid + Math.imul(ah9, bl1)) | 0;
                hi = Math.imul(ah9, bh1);
                lo = (lo + Math.imul(al8, bl2)) | 0;
                mid = (mid + Math.imul(al8, bh2)) | 0;
                mid = (mid + Math.imul(ah8, bl2)) | 0;
                hi = (hi + Math.imul(ah8, bh2)) | 0;
                lo = (lo + Math.imul(al7, bl3)) | 0;
                mid = (mid + Math.imul(al7, bh3)) | 0;
                mid = (mid + Math.imul(ah7, bl3)) | 0;
                hi = (hi + Math.imul(ah7, bh3)) | 0;
                lo = (lo + Math.imul(al6, bl4)) | 0;
                mid = (mid + Math.imul(al6, bh4)) | 0;
                mid = (mid + Math.imul(ah6, bl4)) | 0;
                hi = (hi + Math.imul(ah6, bh4)) | 0;
                lo = (lo + Math.imul(al5, bl5)) | 0;
                mid = (mid + Math.imul(al5, bh5)) | 0;
                mid = (mid + Math.imul(ah5, bl5)) | 0;
                hi = (hi + Math.imul(ah5, bh5)) | 0;
                lo = (lo + Math.imul(al4, bl6)) | 0;
                mid = (mid + Math.imul(al4, bh6)) | 0;
                mid = (mid + Math.imul(ah4, bl6)) | 0;
                hi = (hi + Math.imul(ah4, bh6)) | 0;
                lo = (lo + Math.imul(al3, bl7)) | 0;
                mid = (mid + Math.imul(al3, bh7)) | 0;
                mid = (mid + Math.imul(ah3, bl7)) | 0;
                hi = (hi + Math.imul(ah3, bh7)) | 0;
                lo = (lo + Math.imul(al2, bl8)) | 0;
                mid = (mid + Math.imul(al2, bh8)) | 0;
                mid = (mid + Math.imul(ah2, bl8)) | 0;
                hi = (hi + Math.imul(ah2, bh8)) | 0;
                lo = (lo + Math.imul(al1, bl9)) | 0;
                mid = (mid + Math.imul(al1, bh9)) | 0;
                mid = (mid + Math.imul(ah1, bl9)) | 0;
                hi = (hi + Math.imul(ah1, bh9)) | 0;
                var w10 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w10 >>> 26)) | 0;
                w10 &= 0x3ffffff;
                /* k = 11 */
                lo = Math.imul(al9, bl2);
                mid = Math.imul(al9, bh2);
                mid = (mid + Math.imul(ah9, bl2)) | 0;
                hi = Math.imul(ah9, bh2);
                lo = (lo + Math.imul(al8, bl3)) | 0;
                mid = (mid + Math.imul(al8, bh3)) | 0;
                mid = (mid + Math.imul(ah8, bl3)) | 0;
                hi = (hi + Math.imul(ah8, bh3)) | 0;
                lo = (lo + Math.imul(al7, bl4)) | 0;
                mid = (mid + Math.imul(al7, bh4)) | 0;
                mid = (mid + Math.imul(ah7, bl4)) | 0;
                hi = (hi + Math.imul(ah7, bh4)) | 0;
                lo = (lo + Math.imul(al6, bl5)) | 0;
                mid = (mid + Math.imul(al6, bh5)) | 0;
                mid = (mid + Math.imul(ah6, bl5)) | 0;
                hi = (hi + Math.imul(ah6, bh5)) | 0;
                lo = (lo + Math.imul(al5, bl6)) | 0;
                mid = (mid + Math.imul(al5, bh6)) | 0;
                mid = (mid + Math.imul(ah5, bl6)) | 0;
                hi = (hi + Math.imul(ah5, bh6)) | 0;
                lo = (lo + Math.imul(al4, bl7)) | 0;
                mid = (mid + Math.imul(al4, bh7)) | 0;
                mid = (mid + Math.imul(ah4, bl7)) | 0;
                hi = (hi + Math.imul(ah4, bh7)) | 0;
                lo = (lo + Math.imul(al3, bl8)) | 0;
                mid = (mid + Math.imul(al3, bh8)) | 0;
                mid = (mid + Math.imul(ah3, bl8)) | 0;
                hi = (hi + Math.imul(ah3, bh8)) | 0;
                lo = (lo + Math.imul(al2, bl9)) | 0;
                mid = (mid + Math.imul(al2, bh9)) | 0;
                mid = (mid + Math.imul(ah2, bl9)) | 0;
                hi = (hi + Math.imul(ah2, bh9)) | 0;
                var w11 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w11 >>> 26)) | 0;
                w11 &= 0x3ffffff;
                /* k = 12 */
                lo = Math.imul(al9, bl3);
                mid = Math.imul(al9, bh3);
                mid = (mid + Math.imul(ah9, bl3)) | 0;
                hi = Math.imul(ah9, bh3);
                lo = (lo + Math.imul(al8, bl4)) | 0;
                mid = (mid + Math.imul(al8, bh4)) | 0;
                mid = (mid + Math.imul(ah8, bl4)) | 0;
                hi = (hi + Math.imul(ah8, bh4)) | 0;
                lo = (lo + Math.imul(al7, bl5)) | 0;
                mid = (mid + Math.imul(al7, bh5)) | 0;
                mid = (mid + Math.imul(ah7, bl5)) | 0;
                hi = (hi + Math.imul(ah7, bh5)) | 0;
                lo = (lo + Math.imul(al6, bl6)) | 0;
                mid = (mid + Math.imul(al6, bh6)) | 0;
                mid = (mid + Math.imul(ah6, bl6)) | 0;
                hi = (hi + Math.imul(ah6, bh6)) | 0;
                lo = (lo + Math.imul(al5, bl7)) | 0;
                mid = (mid + Math.imul(al5, bh7)) | 0;
                mid = (mid + Math.imul(ah5, bl7)) | 0;
                hi = (hi + Math.imul(ah5, bh7)) | 0;
                lo = (lo + Math.imul(al4, bl8)) | 0;
                mid = (mid + Math.imul(al4, bh8)) | 0;
                mid = (mid + Math.imul(ah4, bl8)) | 0;
                hi = (hi + Math.imul(ah4, bh8)) | 0;
                lo = (lo + Math.imul(al3, bl9)) | 0;
                mid = (mid + Math.imul(al3, bh9)) | 0;
                mid = (mid + Math.imul(ah3, bl9)) | 0;
                hi = (hi + Math.imul(ah3, bh9)) | 0;
                var w12 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w12 >>> 26)) | 0;
                w12 &= 0x3ffffff;
                /* k = 13 */
                lo = Math.imul(al9, bl4);
                mid = Math.imul(al9, bh4);
                mid = (mid + Math.imul(ah9, bl4)) | 0;
                hi = Math.imul(ah9, bh4);
                lo = (lo + Math.imul(al8, bl5)) | 0;
                mid = (mid + Math.imul(al8, bh5)) | 0;
                mid = (mid + Math.imul(ah8, bl5)) | 0;
                hi = (hi + Math.imul(ah8, bh5)) | 0;
                lo = (lo + Math.imul(al7, bl6)) | 0;
                mid = (mid + Math.imul(al7, bh6)) | 0;
                mid = (mid + Math.imul(ah7, bl6)) | 0;
                hi = (hi + Math.imul(ah7, bh6)) | 0;
                lo = (lo + Math.imul(al6, bl7)) | 0;
                mid = (mid + Math.imul(al6, bh7)) | 0;
                mid = (mid + Math.imul(ah6, bl7)) | 0;
                hi = (hi + Math.imul(ah6, bh7)) | 0;
                lo = (lo + Math.imul(al5, bl8)) | 0;
                mid = (mid + Math.imul(al5, bh8)) | 0;
                mid = (mid + Math.imul(ah5, bl8)) | 0;
                hi = (hi + Math.imul(ah5, bh8)) | 0;
                lo = (lo + Math.imul(al4, bl9)) | 0;
                mid = (mid + Math.imul(al4, bh9)) | 0;
                mid = (mid + Math.imul(ah4, bl9)) | 0;
                hi = (hi + Math.imul(ah4, bh9)) | 0;
                var w13 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w13 >>> 26)) | 0;
                w13 &= 0x3ffffff;
                /* k = 14 */
                lo = Math.imul(al9, bl5);
                mid = Math.imul(al9, bh5);
                mid = (mid + Math.imul(ah9, bl5)) | 0;
                hi = Math.imul(ah9, bh5);
                lo = (lo + Math.imul(al8, bl6)) | 0;
                mid = (mid + Math.imul(al8, bh6)) | 0;
                mid = (mid + Math.imul(ah8, bl6)) | 0;
                hi = (hi + Math.imul(ah8, bh6)) | 0;
                lo = (lo + Math.imul(al7, bl7)) | 0;
                mid = (mid + Math.imul(al7, bh7)) | 0;
                mid = (mid + Math.imul(ah7, bl7)) | 0;
                hi = (hi + Math.imul(ah7, bh7)) | 0;
                lo = (lo + Math.imul(al6, bl8)) | 0;
                mid = (mid + Math.imul(al6, bh8)) | 0;
                mid = (mid + Math.imul(ah6, bl8)) | 0;
                hi = (hi + Math.imul(ah6, bh8)) | 0;
                lo = (lo + Math.imul(al5, bl9)) | 0;
                mid = (mid + Math.imul(al5, bh9)) | 0;
                mid = (mid + Math.imul(ah5, bl9)) | 0;
                hi = (hi + Math.imul(ah5, bh9)) | 0;
                var w14 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w14 >>> 26)) | 0;
                w14 &= 0x3ffffff;
                /* k = 15 */
                lo = Math.imul(al9, bl6);
                mid = Math.imul(al9, bh6);
                mid = (mid + Math.imul(ah9, bl6)) | 0;
                hi = Math.imul(ah9, bh6);
                lo = (lo + Math.imul(al8, bl7)) | 0;
                mid = (mid + Math.imul(al8, bh7)) | 0;
                mid = (mid + Math.imul(ah8, bl7)) | 0;
                hi = (hi + Math.imul(ah8, bh7)) | 0;
                lo = (lo + Math.imul(al7, bl8)) | 0;
                mid = (mid + Math.imul(al7, bh8)) | 0;
                mid = (mid + Math.imul(ah7, bl8)) | 0;
                hi = (hi + Math.imul(ah7, bh8)) | 0;
                lo = (lo + Math.imul(al6, bl9)) | 0;
                mid = (mid + Math.imul(al6, bh9)) | 0;
                mid = (mid + Math.imul(ah6, bl9)) | 0;
                hi = (hi + Math.imul(ah6, bh9)) | 0;
                var w15 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w15 >>> 26)) | 0;
                w15 &= 0x3ffffff;
                /* k = 16 */
                lo = Math.imul(al9, bl7);
                mid = Math.imul(al9, bh7);
                mid = (mid + Math.imul(ah9, bl7)) | 0;
                hi = Math.imul(ah9, bh7);
                lo = (lo + Math.imul(al8, bl8)) | 0;
                mid = (mid + Math.imul(al8, bh8)) | 0;
                mid = (mid + Math.imul(ah8, bl8)) | 0;
                hi = (hi + Math.imul(ah8, bh8)) | 0;
                lo = (lo + Math.imul(al7, bl9)) | 0;
                mid = (mid + Math.imul(al7, bh9)) | 0;
                mid = (mid + Math.imul(ah7, bl9)) | 0;
                hi = (hi + Math.imul(ah7, bh9)) | 0;
                var w16 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w16 >>> 26)) | 0;
                w16 &= 0x3ffffff;
                /* k = 17 */
                lo = Math.imul(al9, bl8);
                mid = Math.imul(al9, bh8);
                mid = (mid + Math.imul(ah9, bl8)) | 0;
                hi = Math.imul(ah9, bh8);
                lo = (lo + Math.imul(al8, bl9)) | 0;
                mid = (mid + Math.imul(al8, bh9)) | 0;
                mid = (mid + Math.imul(ah8, bl9)) | 0;
                hi = (hi + Math.imul(ah8, bh9)) | 0;
                var w17 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w17 >>> 26)) | 0;
                w17 &= 0x3ffffff;
                /* k = 18 */
                lo = Math.imul(al9, bl9);
                mid = Math.imul(al9, bh9);
                mid = (mid + Math.imul(ah9, bl9)) | 0;
                hi = Math.imul(ah9, bh9);
                var w18 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
                c = (((hi + (mid >>> 13)) | 0) + (w18 >>> 26)) | 0;
                w18 &= 0x3ffffff;
                o[0] = w0;
                o[1] = w1;
                o[2] = w2;
                o[3] = w3;
                o[4] = w4;
                o[5] = w5;
                o[6] = w6;
                o[7] = w7;
                o[8] = w8;
                o[9] = w9;
                o[10] = w10;
                o[11] = w11;
                o[12] = w12;
                o[13] = w13;
                o[14] = w14;
                o[15] = w15;
                o[16] = w16;
                o[17] = w17;
                o[18] = w18;
                if (c !== 0) {
                  o[19] = c;
                  out.length++;
                }
                return out;
              };

              // Polyfill comb
              if (!Math.imul) {
                comb10MulTo = smallMulTo;
              }

              function bigMulTo (self, num, out) {
                out.negative = num.negative ^ self.negative;
                out.length = self.length + num.length;

                var carry = 0;
                var hncarry = 0;
                for (var k = 0; k < out.length - 1; k++) {
                  // Sum all words with the same `i + j = k` and accumulate `ncarry`,
                  // note that ncarry could be >= 0x3ffffff
                  var ncarry = hncarry;
                  hncarry = 0;
                  var rword = carry & 0x3ffffff;
                  var maxJ = Math.min(k, num.length - 1);
                  for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
                    var i = k - j;
                    var a = self.words[i] | 0;
                    var b = num.words[j] | 0;
                    var r = a * b;

                    var lo = r & 0x3ffffff;
                    ncarry = (ncarry + ((r / 0x4000000) | 0)) | 0;
                    lo = (lo + rword) | 0;
                    rword = lo & 0x3ffffff;
                    ncarry = (ncarry + (lo >>> 26)) | 0;

                    hncarry += ncarry >>> 26;
                    ncarry &= 0x3ffffff;
                  }
                  out.words[k] = rword;
                  carry = ncarry;
                  ncarry = hncarry;
                }
                if (carry !== 0) {
                  out.words[k] = carry;
                } else {
                  out.length--;
                }

                return out.strip();
              }

              function jumboMulTo (self, num, out) {
                var fftm = new FFTM();
                return fftm.mulp(self, num, out);
              }

              BN.prototype.mulTo = function mulTo (num, out) {
                var res;
                var len = this.length + num.length;
                if (this.length === 10 && num.length === 10) {
                  res = comb10MulTo(this, num, out);
                } else if (len < 63) {
                  res = smallMulTo(this, num, out);
                } else if (len < 1024) {
                  res = bigMulTo(this, num, out);
                } else {
                  res = jumboMulTo(this, num, out);
                }

                return res;
              };

              // Cooley-Tukey algorithm for FFT
              // slightly revisited to rely on looping instead of recursion

              function FFTM (x, y) {
                this.x = x;
                this.y = y;
              }

              FFTM.prototype.makeRBT = function makeRBT (N) {
                var t = new Array(N);
                var l = BN.prototype._countBits(N) - 1;
                for (var i = 0; i < N; i++) {
                  t[i] = this.revBin(i, l, N);
                }

                return t;
              };

              // Returns binary-reversed representation of `x`
              FFTM.prototype.revBin = function revBin (x, l, N) {
                if (x === 0 || x === N - 1) return x;

                var rb = 0;
                for (var i = 0; i < l; i++) {
                  rb |= (x & 1) << (l - i - 1);
                  x >>= 1;
                }

                return rb;
              };

              // Performs "tweedling" phase, therefore 'emulating'
              // behaviour of the recursive algorithm
              FFTM.prototype.permute = function permute (rbt, rws, iws, rtws, itws, N) {
                for (var i = 0; i < N; i++) {
                  rtws[i] = rws[rbt[i]];
                  itws[i] = iws[rbt[i]];
                }
              };

              FFTM.prototype.transform = function transform (rws, iws, rtws, itws, N, rbt) {
                this.permute(rbt, rws, iws, rtws, itws, N);

                for (var s = 1; s < N; s <<= 1) {
                  var l = s << 1;

                  var rtwdf = Math.cos(2 * Math.PI / l);
                  var itwdf = Math.sin(2 * Math.PI / l);

                  for (var p = 0; p < N; p += l) {
                    var rtwdf_ = rtwdf;
                    var itwdf_ = itwdf;

                    for (var j = 0; j < s; j++) {
                      var re = rtws[p + j];
                      var ie = itws[p + j];

                      var ro = rtws[p + j + s];
                      var io = itws[p + j + s];

                      var rx = rtwdf_ * ro - itwdf_ * io;

                      io = rtwdf_ * io + itwdf_ * ro;
                      ro = rx;

                      rtws[p + j] = re + ro;
                      itws[p + j] = ie + io;

                      rtws[p + j + s] = re - ro;
                      itws[p + j + s] = ie - io;

                      /* jshint maxdepth : false */
                      if (j !== l) {
                        rx = rtwdf * rtwdf_ - itwdf * itwdf_;

                        itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
                        rtwdf_ = rx;
                      }
                    }
                  }
                }
              };

              FFTM.prototype.guessLen13b = function guessLen13b (n, m) {
                var N = Math.max(m, n) | 1;
                var odd = N & 1;
                var i = 0;
                for (N = N / 2 | 0; N; N = N >>> 1) {
                  i++;
                }

                return 1 << i + 1 + odd;
              };

              FFTM.prototype.conjugate = function conjugate (rws, iws, N) {
                if (N <= 1) return;

                for (var i = 0; i < N / 2; i++) {
                  var t = rws[i];

                  rws[i] = rws[N - i - 1];
                  rws[N - i - 1] = t;

                  t = iws[i];

                  iws[i] = -iws[N - i - 1];
                  iws[N - i - 1] = -t;
                }
              };

              FFTM.prototype.normalize13b = function normalize13b (ws, N) {
                var carry = 0;
                for (var i = 0; i < N / 2; i++) {
                  var w = Math.round(ws[2 * i + 1] / N) * 0x2000 +
                    Math.round(ws[2 * i] / N) +
                    carry;

                  ws[i] = w & 0x3ffffff;

                  if (w < 0x4000000) {
                    carry = 0;
                  } else {
                    carry = w / 0x4000000 | 0;
                  }
                }

                return ws;
              };

              FFTM.prototype.convert13b = function convert13b (ws, len, rws, N) {
                var carry = 0;
                for (var i = 0; i < len; i++) {
                  carry = carry + (ws[i] | 0);

                  rws[2 * i] = carry & 0x1fff; carry = carry >>> 13;
                  rws[2 * i + 1] = carry & 0x1fff; carry = carry >>> 13;
                }

                // Pad with zeroes
                for (i = 2 * len; i < N; ++i) {
                  rws[i] = 0;
                }

                assert(carry === 0);
                assert((carry & ~0x1fff) === 0);
              };

              FFTM.prototype.stub = function stub (N) {
                var ph = new Array(N);
                for (var i = 0; i < N; i++) {
                  ph[i] = 0;
                }

                return ph;
              };

              FFTM.prototype.mulp = function mulp (x, y, out) {
                var N = 2 * this.guessLen13b(x.length, y.length);

                var rbt = this.makeRBT(N);

                var _ = this.stub(N);

                var rws = new Array(N);
                var rwst = new Array(N);
                var iwst = new Array(N);

                var nrws = new Array(N);
                var nrwst = new Array(N);
                var niwst = new Array(N);

                var rmws = out.words;
                rmws.length = N;

                this.convert13b(x.words, x.length, rws, N);
                this.convert13b(y.words, y.length, nrws, N);

                this.transform(rws, _, rwst, iwst, N, rbt);
                this.transform(nrws, _, nrwst, niwst, N, rbt);

                for (var i = 0; i < N; i++) {
                  var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
                  iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
                  rwst[i] = rx;
                }

                this.conjugate(rwst, iwst, N);
                this.transform(rwst, iwst, rmws, _, N, rbt);
                this.conjugate(rmws, _, N);
                this.normalize13b(rmws, N);

                out.negative = x.negative ^ y.negative;
                out.length = x.length + y.length;
                return out.strip();
              };

              // Multiply `this` by `num`
              BN.prototype.mul = function mul (num) {
                var out = new BN(null);
                out.words = new Array(this.length + num.length);
                return this.mulTo(num, out);
              };

              // Multiply employing FFT
              BN.prototype.mulf = function mulf (num) {
                var out = new BN(null);
                out.words = new Array(this.length + num.length);
                return jumboMulTo(this, num, out);
              };

              // In-place Multiplication
              BN.prototype.imul = function imul (num) {
                return this.clone().mulTo(num, this);
              };

              BN.prototype.imuln = function imuln (num) {
                assert(typeof num === 'number');
                assert(num < 0x4000000);

                // Carry
                var carry = 0;
                for (var i = 0; i < this.length; i++) {
                  var w = (this.words[i] | 0) * num;
                  var lo = (w & 0x3ffffff) + (carry & 0x3ffffff);
                  carry >>= 26;
                  carry += (w / 0x4000000) | 0;
                  // NOTE: lo is 27bit maximum
                  carry += lo >>> 26;
                  this.words[i] = lo & 0x3ffffff;
                }

                if (carry !== 0) {
                  this.words[i] = carry;
                  this.length++;
                }

                return this;
              };

              BN.prototype.muln = function muln (num) {
                return this.clone().imuln(num);
              };

              // `this` * `this`
              BN.prototype.sqr = function sqr () {
                return this.mul(this);
              };

              // `this` * `this` in-place
              BN.prototype.isqr = function isqr () {
                return this.imul(this.clone());
              };

              // Math.pow(`this`, `num`)
              BN.prototype.pow = function pow (num) {
                var w = toBitArray(num);
                if (w.length === 0) return new BN(1);

                // Skip leading zeroes
                var res = this;
                for (var i = 0; i < w.length; i++, res = res.sqr()) {
                  if (w[i] !== 0) break;
                }

                if (++i < w.length) {
                  for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
                    if (w[i] === 0) continue;

                    res = res.mul(q);
                  }
                }

                return res;
              };

              // Shift-left in-place
              BN.prototype.iushln = function iushln (bits) {
                assert(typeof bits === 'number' && bits >= 0);
                var r = bits % 26;
                var s = (bits - r) / 26;
                var carryMask = (0x3ffffff >>> (26 - r)) << (26 - r);
                var i;

                if (r !== 0) {
                  var carry = 0;

                  for (i = 0; i < this.length; i++) {
                    var newCarry = this.words[i] & carryMask;
                    var c = ((this.words[i] | 0) - newCarry) << r;
                    this.words[i] = c | carry;
                    carry = newCarry >>> (26 - r);
                  }

                  if (carry) {
                    this.words[i] = carry;
                    this.length++;
                  }
                }

                if (s !== 0) {
                  for (i = this.length - 1; i >= 0; i--) {
                    this.words[i + s] = this.words[i];
                  }

                  for (i = 0; i < s; i++) {
                    this.words[i] = 0;
                  }

                  this.length += s;
                }

                return this.strip();
              };

              BN.prototype.ishln = function ishln (bits) {
                // TODO(indutny): implement me
                assert(this.negative === 0);
                return this.iushln(bits);
              };

              // Shift-right in-place
              // NOTE: `hint` is a lowest bit before trailing zeroes
              // NOTE: if `extended` is present - it will be filled with destroyed bits
              BN.prototype.iushrn = function iushrn (bits, hint, extended) {
                assert(typeof bits === 'number' && bits >= 0);
                var h;
                if (hint) {
                  h = (hint - (hint % 26)) / 26;
                } else {
                  h = 0;
                }

                var r = bits % 26;
                var s = Math.min((bits - r) / 26, this.length);
                var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
                var maskedWords = extended;

                h -= s;
                h = Math.max(0, h);

                // Extended mode, copy masked part
                if (maskedWords) {
                  for (var i = 0; i < s; i++) {
                    maskedWords.words[i] = this.words[i];
                  }
                  maskedWords.length = s;
                }

                if (s === 0) ; else if (this.length > s) {
                  this.length -= s;
                  for (i = 0; i < this.length; i++) {
                    this.words[i] = this.words[i + s];
                  }
                } else {
                  this.words[0] = 0;
                  this.length = 1;
                }

                var carry = 0;
                for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
                  var word = this.words[i] | 0;
                  this.words[i] = (carry << (26 - r)) | (word >>> r);
                  carry = word & mask;
                }

                // Push carried bits as a mask
                if (maskedWords && carry !== 0) {
                  maskedWords.words[maskedWords.length++] = carry;
                }

                if (this.length === 0) {
                  this.words[0] = 0;
                  this.length = 1;
                }

                return this.strip();
              };

              BN.prototype.ishrn = function ishrn (bits, hint, extended) {
                // TODO(indutny): implement me
                assert(this.negative === 0);
                return this.iushrn(bits, hint, extended);
              };

              // Shift-left
              BN.prototype.shln = function shln (bits) {
                return this.clone().ishln(bits);
              };

              BN.prototype.ushln = function ushln (bits) {
                return this.clone().iushln(bits);
              };

              // Shift-right
              BN.prototype.shrn = function shrn (bits) {
                return this.clone().ishrn(bits);
              };

              BN.prototype.ushrn = function ushrn (bits) {
                return this.clone().iushrn(bits);
              };

              // Test if n bit is set
              BN.prototype.testn = function testn (bit) {
                assert(typeof bit === 'number' && bit >= 0);
                var r = bit % 26;
                var s = (bit - r) / 26;
                var q = 1 << r;

                // Fast case: bit is much higher than all existing words
                if (this.length <= s) return false;

                // Check bit and return
                var w = this.words[s];

                return !!(w & q);
              };

              // Return only lowers bits of number (in-place)
              BN.prototype.imaskn = function imaskn (bits) {
                assert(typeof bits === 'number' && bits >= 0);
                var r = bits % 26;
                var s = (bits - r) / 26;

                assert(this.negative === 0, 'imaskn works only with positive numbers');

                if (this.length <= s) {
                  return this;
                }

                if (r !== 0) {
                  s++;
                }
                this.length = Math.min(s, this.length);

                if (r !== 0) {
                  var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
                  this.words[this.length - 1] &= mask;
                }

                return this.strip();
              };

              // Return only lowers bits of number
              BN.prototype.maskn = function maskn (bits) {
                return this.clone().imaskn(bits);
              };

              // Add plain number `num` to `this`
              BN.prototype.iaddn = function iaddn (num) {
                assert(typeof num === 'number');
                assert(num < 0x4000000);
                if (num < 0) return this.isubn(-num);

                // Possible sign change
                if (this.negative !== 0) {
                  if (this.length === 1 && (this.words[0] | 0) < num) {
                    this.words[0] = num - (this.words[0] | 0);
                    this.negative = 0;
                    return this;
                  }

                  this.negative = 0;
                  this.isubn(num);
                  this.negative = 1;
                  return this;
                }

                // Add without checks
                return this._iaddn(num);
              };

              BN.prototype._iaddn = function _iaddn (num) {
                this.words[0] += num;

                // Carry
                for (var i = 0; i < this.length && this.words[i] >= 0x4000000; i++) {
                  this.words[i] -= 0x4000000;
                  if (i === this.length - 1) {
                    this.words[i + 1] = 1;
                  } else {
                    this.words[i + 1]++;
                  }
                }
                this.length = Math.max(this.length, i + 1);

                return this;
              };

              // Subtract plain number `num` from `this`
              BN.prototype.isubn = function isubn (num) {
                assert(typeof num === 'number');
                assert(num < 0x4000000);
                if (num < 0) return this.iaddn(-num);

                if (this.negative !== 0) {
                  this.negative = 0;
                  this.iaddn(num);
                  this.negative = 1;
                  return this;
                }

                this.words[0] -= num;

                if (this.length === 1 && this.words[0] < 0) {
                  this.words[0] = -this.words[0];
                  this.negative = 1;
                } else {
                  // Carry
                  for (var i = 0; i < this.length && this.words[i] < 0; i++) {
                    this.words[i] += 0x4000000;
                    this.words[i + 1] -= 1;
                  }
                }

                return this.strip();
              };

              BN.prototype.addn = function addn (num) {
                return this.clone().iaddn(num);
              };

              BN.prototype.subn = function subn (num) {
                return this.clone().isubn(num);
              };

              BN.prototype.iabs = function iabs () {
                this.negative = 0;

                return this;
              };

              BN.prototype.abs = function abs () {
                return this.clone().iabs();
              };

              BN.prototype._ishlnsubmul = function _ishlnsubmul (num, mul, shift) {
                var len = num.length + shift;
                var i;

                this._expand(len);

                var w;
                var carry = 0;
                for (i = 0; i < num.length; i++) {
                  w = (this.words[i + shift] | 0) + carry;
                  var right = (num.words[i] | 0) * mul;
                  w -= right & 0x3ffffff;
                  carry = (w >> 26) - ((right / 0x4000000) | 0);
                  this.words[i + shift] = w & 0x3ffffff;
                }
                for (; i < this.length - shift; i++) {
                  w = (this.words[i + shift] | 0) + carry;
                  carry = w >> 26;
                  this.words[i + shift] = w & 0x3ffffff;
                }

                if (carry === 0) return this.strip();

                // Subtraction overflow
                assert(carry === -1);
                carry = 0;
                for (i = 0; i < this.length; i++) {
                  w = -(this.words[i] | 0) + carry;
                  carry = w >> 26;
                  this.words[i] = w & 0x3ffffff;
                }
                this.negative = 1;

                return this.strip();
              };

              BN.prototype._wordDiv = function _wordDiv (num, mode) {
                var shift = this.length - num.length;

                var a = this.clone();
                var b = num;

                // Normalize
                var bhi = b.words[b.length - 1] | 0;
                var bhiBits = this._countBits(bhi);
                shift = 26 - bhiBits;
                if (shift !== 0) {
                  b = b.ushln(shift);
                  a.iushln(shift);
                  bhi = b.words[b.length - 1] | 0;
                }

                // Initialize quotient
                var m = a.length - b.length;
                var q;

                if (mode !== 'mod') {
                  q = new BN(null);
                  q.length = m + 1;
                  q.words = new Array(q.length);
                  for (var i = 0; i < q.length; i++) {
                    q.words[i] = 0;
                  }
                }

                var diff = a.clone()._ishlnsubmul(b, 1, m);
                if (diff.negative === 0) {
                  a = diff;
                  if (q) {
                    q.words[m] = 1;
                  }
                }

                for (var j = m - 1; j >= 0; j--) {
                  var qj = (a.words[b.length + j] | 0) * 0x4000000 +
                    (a.words[b.length + j - 1] | 0);

                  // NOTE: (qj / bhi) is (0x3ffffff * 0x4000000 + 0x3ffffff) / 0x2000000 max
                  // (0x7ffffff)
                  qj = Math.min((qj / bhi) | 0, 0x3ffffff);

                  a._ishlnsubmul(b, qj, j);
                  while (a.negative !== 0) {
                    qj--;
                    a.negative = 0;
                    a._ishlnsubmul(b, 1, j);
                    if (!a.isZero()) {
                      a.negative ^= 1;
                    }
                  }
                  if (q) {
                    q.words[j] = qj;
                  }
                }
                if (q) {
                  q.strip();
                }
                a.strip();

                // Denormalize
                if (mode !== 'div' && shift !== 0) {
                  a.iushrn(shift);
                }

                return {
                  div: q || null,
                  mod: a
                };
              };

              // NOTE: 1) `mode` can be set to `mod` to request mod only,
              //       to `div` to request div only, or be absent to
              //       request both div & mod
              //       2) `positive` is true if unsigned mod is requested
              BN.prototype.divmod = function divmod (num, mode, positive) {
                assert(!num.isZero());

                if (this.isZero()) {
                  return {
                    div: new BN(0),
                    mod: new BN(0)
                  };
                }

                var div, mod, res;
                if (this.negative !== 0 && num.negative === 0) {
                  res = this.neg().divmod(num, mode);

                  if (mode !== 'mod') {
                    div = res.div.neg();
                  }

                  if (mode !== 'div') {
                    mod = res.mod.neg();
                    if (positive && mod.negative !== 0) {
                      mod.iadd(num);
                    }
                  }

                  return {
                    div: div,
                    mod: mod
                  };
                }

                if (this.negative === 0 && num.negative !== 0) {
                  res = this.divmod(num.neg(), mode);

                  if (mode !== 'mod') {
                    div = res.div.neg();
                  }

                  return {
                    div: div,
                    mod: res.mod
                  };
                }

                if ((this.negative & num.negative) !== 0) {
                  res = this.neg().divmod(num.neg(), mode);

                  if (mode !== 'div') {
                    mod = res.mod.neg();
                    if (positive && mod.negative !== 0) {
                      mod.isub(num);
                    }
                  }

                  return {
                    div: res.div,
                    mod: mod
                  };
                }

                // Both numbers are positive at this point

                // Strip both numbers to approximate shift value
                if (num.length > this.length || this.cmp(num) < 0) {
                  return {
                    div: new BN(0),
                    mod: this
                  };
                }

                // Very short reduction
                if (num.length === 1) {
                  if (mode === 'div') {
                    return {
                      div: this.divn(num.words[0]),
                      mod: null
                    };
                  }

                  if (mode === 'mod') {
                    return {
                      div: null,
                      mod: new BN(this.modn(num.words[0]))
                    };
                  }

                  return {
                    div: this.divn(num.words[0]),
                    mod: new BN(this.modn(num.words[0]))
                  };
                }

                return this._wordDiv(num, mode);
              };

              // Find `this` / `num`
              BN.prototype.div = function div (num) {
                return this.divmod(num, 'div', false).div;
              };

              // Find `this` % `num`
              BN.prototype.mod = function mod (num) {
                return this.divmod(num, 'mod', false).mod;
              };

              BN.prototype.umod = function umod (num) {
                return this.divmod(num, 'mod', true).mod;
              };

              // Find Round(`this` / `num`)
              BN.prototype.divRound = function divRound (num) {
                var dm = this.divmod(num);

                // Fast case - exact division
                if (dm.mod.isZero()) return dm.div;

                var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;

                var half = num.ushrn(1);
                var r2 = num.andln(1);
                var cmp = mod.cmp(half);

                // Round down
                if (cmp < 0 || r2 === 1 && cmp === 0) return dm.div;

                // Round up
                return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
              };

              BN.prototype.modn = function modn (num) {
                assert(num <= 0x3ffffff);
                var p = (1 << 26) % num;

                var acc = 0;
                for (var i = this.length - 1; i >= 0; i--) {
                  acc = (p * acc + (this.words[i] | 0)) % num;
                }

                return acc;
              };

              // In-place division by number
              BN.prototype.idivn = function idivn (num) {
                assert(num <= 0x3ffffff);

                var carry = 0;
                for (var i = this.length - 1; i >= 0; i--) {
                  var w = (this.words[i] | 0) + carry * 0x4000000;
                  this.words[i] = (w / num) | 0;
                  carry = w % num;
                }

                return this.strip();
              };

              BN.prototype.divn = function divn (num) {
                return this.clone().idivn(num);
              };

              BN.prototype.egcd = function egcd (p) {
                assert(p.negative === 0);
                assert(!p.isZero());

                var x = this;
                var y = p.clone();

                if (x.negative !== 0) {
                  x = x.umod(p);
                } else {
                  x = x.clone();
                }

                // A * x + B * y = x
                var A = new BN(1);
                var B = new BN(0);

                // C * x + D * y = y
                var C = new BN(0);
                var D = new BN(1);

                var g = 0;

                while (x.isEven() && y.isEven()) {
                  x.iushrn(1);
                  y.iushrn(1);
                  ++g;
                }

                var yp = y.clone();
                var xp = x.clone();

                while (!x.isZero()) {
                  for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
                  if (i > 0) {
                    x.iushrn(i);
                    while (i-- > 0) {
                      if (A.isOdd() || B.isOdd()) {
                        A.iadd(yp);
                        B.isub(xp);
                      }

                      A.iushrn(1);
                      B.iushrn(1);
                    }
                  }

                  for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
                  if (j > 0) {
                    y.iushrn(j);
                    while (j-- > 0) {
                      if (C.isOdd() || D.isOdd()) {
                        C.iadd(yp);
                        D.isub(xp);
                      }

                      C.iushrn(1);
                      D.iushrn(1);
                    }
                  }

                  if (x.cmp(y) >= 0) {
                    x.isub(y);
                    A.isub(C);
                    B.isub(D);
                  } else {
                    y.isub(x);
                    C.isub(A);
                    D.isub(B);
                  }
                }

                return {
                  a: C,
                  b: D,
                  gcd: y.iushln(g)
                };
              };

              // This is reduced incarnation of the binary EEA
              // above, designated to invert members of the
              // _prime_ fields F(p) at a maximal speed
              BN.prototype._invmp = function _invmp (p) {
                assert(p.negative === 0);
                assert(!p.isZero());

                var a = this;
                var b = p.clone();

                if (a.negative !== 0) {
                  a = a.umod(p);
                } else {
                  a = a.clone();
                }

                var x1 = new BN(1);
                var x2 = new BN(0);

                var delta = b.clone();

                while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
                  for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
                  if (i > 0) {
                    a.iushrn(i);
                    while (i-- > 0) {
                      if (x1.isOdd()) {
                        x1.iadd(delta);
                      }

                      x1.iushrn(1);
                    }
                  }

                  for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
                  if (j > 0) {
                    b.iushrn(j);
                    while (j-- > 0) {
                      if (x2.isOdd()) {
                        x2.iadd(delta);
                      }

                      x2.iushrn(1);
                    }
                  }

                  if (a.cmp(b) >= 0) {
                    a.isub(b);
                    x1.isub(x2);
                  } else {
                    b.isub(a);
                    x2.isub(x1);
                  }
                }

                var res;
                if (a.cmpn(1) === 0) {
                  res = x1;
                } else {
                  res = x2;
                }

                if (res.cmpn(0) < 0) {
                  res.iadd(p);
                }

                return res;
              };

              BN.prototype.gcd = function gcd (num) {
                if (this.isZero()) return num.abs();
                if (num.isZero()) return this.abs();

                var a = this.clone();
                var b = num.clone();
                a.negative = 0;
                b.negative = 0;

                // Remove common factor of two
                for (var shift = 0; a.isEven() && b.isEven(); shift++) {
                  a.iushrn(1);
                  b.iushrn(1);
                }

                do {
                  while (a.isEven()) {
                    a.iushrn(1);
                  }
                  while (b.isEven()) {
                    b.iushrn(1);
                  }

                  var r = a.cmp(b);
                  if (r < 0) {
                    // Swap `a` and `b` to make `a` always bigger than `b`
                    var t = a;
                    a = b;
                    b = t;
                  } else if (r === 0 || b.cmpn(1) === 0) {
                    break;
                  }

                  a.isub(b);
                } while (true);

                return b.iushln(shift);
              };

              // Invert number in the field F(num)
              BN.prototype.invm = function invm (num) {
                return this.egcd(num).a.umod(num);
              };

              BN.prototype.isEven = function isEven () {
                return (this.words[0] & 1) === 0;
              };

              BN.prototype.isOdd = function isOdd () {
                return (this.words[0] & 1) === 1;
              };

              // And first word and num
              BN.prototype.andln = function andln (num) {
                return this.words[0] & num;
              };

              // Increment at the bit position in-line
              BN.prototype.bincn = function bincn (bit) {
                assert(typeof bit === 'number');
                var r = bit % 26;
                var s = (bit - r) / 26;
                var q = 1 << r;

                // Fast case: bit is much higher than all existing words
                if (this.length <= s) {
                  this._expand(s + 1);
                  this.words[s] |= q;
                  return this;
                }

                // Add bit and propagate, if needed
                var carry = q;
                for (var i = s; carry !== 0 && i < this.length; i++) {
                  var w = this.words[i] | 0;
                  w += carry;
                  carry = w >>> 26;
                  w &= 0x3ffffff;
                  this.words[i] = w;
                }
                if (carry !== 0) {
                  this.words[i] = carry;
                  this.length++;
                }
                return this;
              };

              BN.prototype.isZero = function isZero () {
                return this.length === 1 && this.words[0] === 0;
              };

              BN.prototype.cmpn = function cmpn (num) {
                var negative = num < 0;

                if (this.negative !== 0 && !negative) return -1;
                if (this.negative === 0 && negative) return 1;

                this.strip();

                var res;
                if (this.length > 1) {
                  res = 1;
                } else {
                  if (negative) {
                    num = -num;
                  }

                  assert(num <= 0x3ffffff, 'Number is too big');

                  var w = this.words[0] | 0;
                  res = w === num ? 0 : w < num ? -1 : 1;
                }
                if (this.negative !== 0) return -res | 0;
                return res;
              };

              // Compare two numbers and return:
              // 1 - if `this` > `num`
              // 0 - if `this` == `num`
              // -1 - if `this` < `num`
              BN.prototype.cmp = function cmp (num) {
                if (this.negative !== 0 && num.negative === 0) return -1;
                if (this.negative === 0 && num.negative !== 0) return 1;

                var res = this.ucmp(num);
                if (this.negative !== 0) return -res | 0;
                return res;
              };

              // Unsigned comparison
              BN.prototype.ucmp = function ucmp (num) {
                // At this point both numbers have the same sign
                if (this.length > num.length) return 1;
                if (this.length < num.length) return -1;

                var res = 0;
                for (var i = this.length - 1; i >= 0; i--) {
                  var a = this.words[i] | 0;
                  var b = num.words[i] | 0;

                  if (a === b) continue;
                  if (a < b) {
                    res = -1;
                  } else if (a > b) {
                    res = 1;
                  }
                  break;
                }
                return res;
              };

              BN.prototype.gtn = function gtn (num) {
                return this.cmpn(num) === 1;
              };

              BN.prototype.gt = function gt (num) {
                return this.cmp(num) === 1;
              };

              BN.prototype.gten = function gten (num) {
                return this.cmpn(num) >= 0;
              };

              BN.prototype.gte = function gte (num) {
                return this.cmp(num) >= 0;
              };

              BN.prototype.ltn = function ltn (num) {
                return this.cmpn(num) === -1;
              };

              BN.prototype.lt = function lt (num) {
                return this.cmp(num) === -1;
              };

              BN.prototype.lten = function lten (num) {
                return this.cmpn(num) <= 0;
              };

              BN.prototype.lte = function lte (num) {
                return this.cmp(num) <= 0;
              };

              BN.prototype.eqn = function eqn (num) {
                return this.cmpn(num) === 0;
              };

              BN.prototype.eq = function eq (num) {
                return this.cmp(num) === 0;
              };

              //
              // A reduce context, could be using montgomery or something better, depending
              // on the `m` itself.
              //
              BN.red = function red (num) {
                return new Red(num);
              };

              BN.prototype.toRed = function toRed (ctx) {
                assert(!this.red, 'Already a number in reduction context');
                assert(this.negative === 0, 'red works only with positives');
                return ctx.convertTo(this)._forceRed(ctx);
              };

              BN.prototype.fromRed = function fromRed () {
                assert(this.red, 'fromRed works only with numbers in reduction context');
                return this.red.convertFrom(this);
              };

              BN.prototype._forceRed = function _forceRed (ctx) {
                this.red = ctx;
                return this;
              };

              BN.prototype.forceRed = function forceRed (ctx) {
                assert(!this.red, 'Already a number in reduction context');
                return this._forceRed(ctx);
              };

              BN.prototype.redAdd = function redAdd (num) {
                assert(this.red, 'redAdd works only with red numbers');
                return this.red.add(this, num);
              };

              BN.prototype.redIAdd = function redIAdd (num) {
                assert(this.red, 'redIAdd works only with red numbers');
                return this.red.iadd(this, num);
              };

              BN.prototype.redSub = function redSub (num) {
                assert(this.red, 'redSub works only with red numbers');
                return this.red.sub(this, num);
              };

              BN.prototype.redISub = function redISub (num) {
                assert(this.red, 'redISub works only with red numbers');
                return this.red.isub(this, num);
              };

              BN.prototype.redShl = function redShl (num) {
                assert(this.red, 'redShl works only with red numbers');
                return this.red.shl(this, num);
              };

              BN.prototype.redMul = function redMul (num) {
                assert(this.red, 'redMul works only with red numbers');
                this.red._verify2(this, num);
                return this.red.mul(this, num);
              };

              BN.prototype.redIMul = function redIMul (num) {
                assert(this.red, 'redMul works only with red numbers');
                this.red._verify2(this, num);
                return this.red.imul(this, num);
              };

              BN.prototype.redSqr = function redSqr () {
                assert(this.red, 'redSqr works only with red numbers');
                this.red._verify1(this);
                return this.red.sqr(this);
              };

              BN.prototype.redISqr = function redISqr () {
                assert(this.red, 'redISqr works only with red numbers');
                this.red._verify1(this);
                return this.red.isqr(this);
              };

              // Square root over p
              BN.prototype.redSqrt = function redSqrt () {
                assert(this.red, 'redSqrt works only with red numbers');
                this.red._verify1(this);
                return this.red.sqrt(this);
              };

              BN.prototype.redInvm = function redInvm () {
                assert(this.red, 'redInvm works only with red numbers');
                this.red._verify1(this);
                return this.red.invm(this);
              };

              // Return negative clone of `this` % `red modulo`
              BN.prototype.redNeg = function redNeg () {
                assert(this.red, 'redNeg works only with red numbers');
                this.red._verify1(this);
                return this.red.neg(this);
              };

              BN.prototype.redPow = function redPow (num) {
                assert(this.red && !num.red, 'redPow(normalNum)');
                this.red._verify1(this);
                return this.red.pow(this, num);
              };

              // Prime numbers with efficient reduction
              var primes = {
                k256: null,
                p224: null,
                p192: null,
                p25519: null
              };

              // Pseudo-Mersenne prime
              function MPrime (name, p) {
                // P = 2 ^ N - K
                this.name = name;
                this.p = new BN(p, 16);
                this.n = this.p.bitLength();
                this.k = new BN(1).iushln(this.n).isub(this.p);

                this.tmp = this._tmp();
              }

              MPrime.prototype._tmp = function _tmp () {
                var tmp = new BN(null);
                tmp.words = new Array(Math.ceil(this.n / 13));
                return tmp;
              };

              MPrime.prototype.ireduce = function ireduce (num) {
                // Assumes that `num` is less than `P^2`
                // num = HI * (2 ^ N - K) + HI * K + LO = HI * K + LO (mod P)
                var r = num;
                var rlen;

                do {
                  this.split(r, this.tmp);
                  r = this.imulK(r);
                  r = r.iadd(this.tmp);
                  rlen = r.bitLength();
                } while (rlen > this.n);

                var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
                if (cmp === 0) {
                  r.words[0] = 0;
                  r.length = 1;
                } else if (cmp > 0) {
                  r.isub(this.p);
                } else {
                  r.strip();
                }

                return r;
              };

              MPrime.prototype.split = function split (input, out) {
                input.iushrn(this.n, 0, out);
              };

              MPrime.prototype.imulK = function imulK (num) {
                return num.imul(this.k);
              };

              function K256 () {
                MPrime.call(
                  this,
                  'k256',
                  'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f');
              }
              inherits(K256, MPrime);

              K256.prototype.split = function split (input, output) {
                // 256 = 9 * 26 + 22
                var mask = 0x3fffff;

                var outLen = Math.min(input.length, 9);
                for (var i = 0; i < outLen; i++) {
                  output.words[i] = input.words[i];
                }
                output.length = outLen;

                if (input.length <= 9) {
                  input.words[0] = 0;
                  input.length = 1;
                  return;
                }

                // Shift by 9 limbs
                var prev = input.words[9];
                output.words[output.length++] = prev & mask;

                for (i = 10; i < input.length; i++) {
                  var next = input.words[i] | 0;
                  input.words[i - 10] = ((next & mask) << 4) | (prev >>> 22);
                  prev = next;
                }
                prev >>>= 22;
                input.words[i - 10] = prev;
                if (prev === 0 && input.length > 10) {
                  input.length -= 10;
                } else {
                  input.length -= 9;
                }
              };

              K256.prototype.imulK = function imulK (num) {
                // K = 0x1000003d1 = [ 0x40, 0x3d1 ]
                num.words[num.length] = 0;
                num.words[num.length + 1] = 0;
                num.length += 2;

                // bounded at: 0x40 * 0x3ffffff + 0x3d0 = 0x100000390
                var lo = 0;
                for (var i = 0; i < num.length; i++) {
                  var w = num.words[i] | 0;
                  lo += w * 0x3d1;
                  num.words[i] = lo & 0x3ffffff;
                  lo = w * 0x40 + ((lo / 0x4000000) | 0);
                }

                // Fast length reduction
                if (num.words[num.length - 1] === 0) {
                  num.length--;
                  if (num.words[num.length - 1] === 0) {
                    num.length--;
                  }
                }
                return num;
              };

              function P224 () {
                MPrime.call(
                  this,
                  'p224',
                  'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001');
              }
              inherits(P224, MPrime);

              function P192 () {
                MPrime.call(
                  this,
                  'p192',
                  'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff');
              }
              inherits(P192, MPrime);

              function P25519 () {
                // 2 ^ 255 - 19
                MPrime.call(
                  this,
                  '25519',
                  '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed');
              }
              inherits(P25519, MPrime);

              P25519.prototype.imulK = function imulK (num) {
                // K = 0x13
                var carry = 0;
                for (var i = 0; i < num.length; i++) {
                  var hi = (num.words[i] | 0) * 0x13 + carry;
                  var lo = hi & 0x3ffffff;
                  hi >>>= 26;

                  num.words[i] = lo;
                  carry = hi;
                }
                if (carry !== 0) {
                  num.words[num.length++] = carry;
                }
                return num;
              };

              // Exported mostly for testing purposes, use plain name instead
              BN._prime = function prime (name) {
                // Cached version of prime
                if (primes[name]) return primes[name];

                var prime;
                if (name === 'k256') {
                  prime = new K256();
                } else if (name === 'p224') {
                  prime = new P224();
                } else if (name === 'p192') {
                  prime = new P192();
                } else if (name === 'p25519') {
                  prime = new P25519();
                } else {
                  throw new Error('Unknown prime ' + name);
                }
                primes[name] = prime;

                return prime;
              };

              //
              // Base reduction engine
              //
              function Red (m) {
                if (typeof m === 'string') {
                  var prime = BN._prime(m);
                  this.m = prime.p;
                  this.prime = prime;
                } else {
                  assert(m.gtn(1), 'modulus must be greater than 1');
                  this.m = m;
                  this.prime = null;
                }
              }

              Red.prototype._verify1 = function _verify1 (a) {
                assert(a.negative === 0, 'red works only with positives');
                assert(a.red, 'red works only with red numbers');
              };

              Red.prototype._verify2 = function _verify2 (a, b) {
                assert((a.negative | b.negative) === 0, 'red works only with positives');
                assert(a.red && a.red === b.red,
                  'red works only with red numbers');
              };

              Red.prototype.imod = function imod (a) {
                if (this.prime) return this.prime.ireduce(a)._forceRed(this);
                return a.umod(this.m)._forceRed(this);
              };

              Red.prototype.neg = function neg (a) {
                if (a.isZero()) {
                  return a.clone();
                }

                return this.m.sub(a)._forceRed(this);
              };

              Red.prototype.add = function add (a, b) {
                this._verify2(a, b);

                var res = a.add(b);
                if (res.cmp(this.m) >= 0) {
                  res.isub(this.m);
                }
                return res._forceRed(this);
              };

              Red.prototype.iadd = function iadd (a, b) {
                this._verify2(a, b);

                var res = a.iadd(b);
                if (res.cmp(this.m) >= 0) {
                  res.isub(this.m);
                }
                return res;
              };

              Red.prototype.sub = function sub (a, b) {
                this._verify2(a, b);

                var res = a.sub(b);
                if (res.cmpn(0) < 0) {
                  res.iadd(this.m);
                }
                return res._forceRed(this);
              };

              Red.prototype.isub = function isub (a, b) {
                this._verify2(a, b);

                var res = a.isub(b);
                if (res.cmpn(0) < 0) {
                  res.iadd(this.m);
                }
                return res;
              };

              Red.prototype.shl = function shl (a, num) {
                this._verify1(a);
                return this.imod(a.ushln(num));
              };

              Red.prototype.imul = function imul (a, b) {
                this._verify2(a, b);
                return this.imod(a.imul(b));
              };

              Red.prototype.mul = function mul (a, b) {
                this._verify2(a, b);
                return this.imod(a.mul(b));
              };

              Red.prototype.isqr = function isqr (a) {
                return this.imul(a, a.clone());
              };

              Red.prototype.sqr = function sqr (a) {
                return this.mul(a, a);
              };

              Red.prototype.sqrt = function sqrt (a) {
                if (a.isZero()) return a.clone();

                var mod3 = this.m.andln(3);
                assert(mod3 % 2 === 1);

                // Fast case
                if (mod3 === 3) {
                  var pow = this.m.add(new BN(1)).iushrn(2);
                  return this.pow(a, pow);
                }

                // Tonelli-Shanks algorithm (Totally unoptimized and slow)
                //
                // Find Q and S, that Q * 2 ^ S = (P - 1)
                var q = this.m.subn(1);
                var s = 0;
                while (!q.isZero() && q.andln(1) === 0) {
                  s++;
                  q.iushrn(1);
                }
                assert(!q.isZero());

                var one = new BN(1).toRed(this);
                var nOne = one.redNeg();

                // Find quadratic non-residue
                // NOTE: Max is such because of generalized Riemann hypothesis.
                var lpow = this.m.subn(1).iushrn(1);
                var z = this.m.bitLength();
                z = new BN(2 * z * z).toRed(this);

                while (this.pow(z, lpow).cmp(nOne) !== 0) {
                  z.redIAdd(nOne);
                }

                var c = this.pow(z, q);
                var r = this.pow(a, q.addn(1).iushrn(1));
                var t = this.pow(a, q);
                var m = s;
                while (t.cmp(one) !== 0) {
                  var tmp = t;
                  for (var i = 0; tmp.cmp(one) !== 0; i++) {
                    tmp = tmp.redSqr();
                  }
                  assert(i < m);
                  var b = this.pow(c, new BN(1).iushln(m - i - 1));

                  r = r.redMul(b);
                  c = b.redSqr();
                  t = t.redMul(c);
                  m = i;
                }

                return r;
              };

              Red.prototype.invm = function invm (a) {
                var inv = a._invmp(this.m);
                if (inv.negative !== 0) {
                  inv.negative = 0;
                  return this.imod(inv).redNeg();
                } else {
                  return this.imod(inv);
                }
              };

              Red.prototype.pow = function pow (a, num) {
                if (num.isZero()) return new BN(1).toRed(this);
                if (num.cmpn(1) === 0) return a.clone();

                var windowSize = 4;
                var wnd = new Array(1 << windowSize);
                wnd[0] = new BN(1).toRed(this);
                wnd[1] = a;
                for (var i = 2; i < wnd.length; i++) {
                  wnd[i] = this.mul(wnd[i - 1], a);
                }

                var res = wnd[0];
                var current = 0;
                var currentLen = 0;
                var start = num.bitLength() % 26;
                if (start === 0) {
                  start = 26;
                }

                for (i = num.length - 1; i >= 0; i--) {
                  var word = num.words[i];
                  for (var j = start - 1; j >= 0; j--) {
                    var bit = (word >> j) & 1;
                    if (res !== wnd[0]) {
                      res = this.sqr(res);
                    }

                    if (bit === 0 && current === 0) {
                      currentLen = 0;
                      continue;
                    }

                    current <<= 1;
                    current |= bit;
                    currentLen++;
                    if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;

                    res = this.mul(res, wnd[current]);
                    currentLen = 0;
                    current = 0;
                  }
                  start = 26;
                }

                return res;
              };

              Red.prototype.convertTo = function convertTo (num) {
                var r = num.umod(this.m);

                return r === num ? r.clone() : r;
              };

              Red.prototype.convertFrom = function convertFrom (num) {
                var res = num.clone();
                res.red = null;
                return res;
              };

              //
              // Montgomery method engine
              //

              BN.mont = function mont (num) {
                return new Mont(num);
              };

              function Mont (m) {
                Red.call(this, m);

                this.shift = this.m.bitLength();
                if (this.shift % 26 !== 0) {
                  this.shift += 26 - (this.shift % 26);
                }

                this.r = new BN(1).iushln(this.shift);
                this.r2 = this.imod(this.r.sqr());
                this.rinv = this.r._invmp(this.m);

                this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
                this.minv = this.minv.umod(this.r);
                this.minv = this.r.sub(this.minv);
              }
              inherits(Mont, Red);

              Mont.prototype.convertTo = function convertTo (num) {
                return this.imod(num.ushln(this.shift));
              };

              Mont.prototype.convertFrom = function convertFrom (num) {
                var r = this.imod(num.mul(this.rinv));
                r.red = null;
                return r;
              };

              Mont.prototype.imul = function imul (a, b) {
                if (a.isZero() || b.isZero()) {
                  a.words[0] = 0;
                  a.length = 1;
                  return a;
                }

                var t = a.imul(b);
                var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
                var u = t.isub(c).iushrn(this.shift);
                var res = u;

                if (u.cmp(this.m) >= 0) {
                  res = u.isub(this.m);
                } else if (u.cmpn(0) < 0) {
                  res = u.iadd(this.m);
                }

                return res._forceRed(this);
              };

              Mont.prototype.mul = function mul (a, b) {
                if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);

                var t = a.mul(b);
                var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
                var u = t.isub(c).iushrn(this.shift);
                var res = u;
                if (u.cmp(this.m) >= 0) {
                  res = u.isub(this.m);
                } else if (u.cmpn(0) < 0) {
                  res = u.iadd(this.m);
                }

                return res._forceRed(this);
              };

              Mont.prototype.invm = function invm (a) {
                // (AR)^-1 * R^2 = (A^-1 * R^-1) * R^2 = A^-1 * R
                var res = this.imod(a._invmp(this.m).mul(this.r2));
                return res._forceRed(this);
              };
            })( module, commonjsGlobal);
            });

            /**
             * lodash (Custom Build) <https://lodash.com/>
             * Build: `lodash modularize exports="npm" -o ./`
             * Copyright jQuery Foundation and other contributors <https://jquery.org/>
             * Released under MIT license <https://lodash.com/license>
             * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
             * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
             */

            /** Used as references for various `Number` constants. */
            var INFINITY = 1 / 0,
                MAX_SAFE_INTEGER = 9007199254740991,
                MAX_INTEGER = 1.7976931348623157e+308,
                NAN = 0 / 0;

            /** `Object#toString` result references. */
            var funcTag = '[object Function]',
                genTag = '[object GeneratorFunction]',
                symbolTag = '[object Symbol]';

            /** Used to match leading and trailing whitespace. */
            var reTrim = /^\s+|\s+$/g;

            /** Used to detect bad signed hexadecimal string values. */
            var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

            /** Used to detect binary string values. */
            var reIsBinary = /^0b[01]+$/i;

            /** Used to detect octal string values. */
            var reIsOctal = /^0o[0-7]+$/i;

            /** Used to detect unsigned integer values. */
            var reIsUint = /^(?:0|[1-9]\d*)$/;

            /** Built-in method references without a dependency on `root`. */
            var freeParseInt = parseInt;

            /** Used for built-in method references. */
            var objectProto = Object.prototype;

            /**
             * Used to resolve the
             * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
             * of values.
             */
            var objectToString = objectProto.toString;

            /* Built-in method references for those with the same name as other `lodash` methods. */
            var nativeCeil = Math.ceil,
                nativeMax = Math.max;

            /**
             * The base implementation of `_.slice` without an iteratee call guard.
             *
             * @private
             * @param {Array} array The array to slice.
             * @param {number} [start=0] The start position.
             * @param {number} [end=array.length] The end position.
             * @returns {Array} Returns the slice of `array`.
             */
            function baseSlice(array, start, end) {
              var index = -1,
                  length = array.length;

              if (start < 0) {
                start = -start > length ? 0 : (length + start);
              }
              end = end > length ? length : end;
              if (end < 0) {
                end += length;
              }
              length = start > end ? 0 : ((end - start) >>> 0);
              start >>>= 0;

              var result = Array(length);
              while (++index < length) {
                result[index] = array[index + start];
              }
              return result;
            }

            /**
             * Checks if `value` is a valid array-like index.
             *
             * @private
             * @param {*} value The value to check.
             * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
             * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
             */
            function isIndex(value, length) {
              length = length == null ? MAX_SAFE_INTEGER : length;
              return !!length &&
                (typeof value == 'number' || reIsUint.test(value)) &&
                (value > -1 && value % 1 == 0 && value < length);
            }

            /**
             * Checks if the given arguments are from an iteratee call.
             *
             * @private
             * @param {*} value The potential iteratee value argument.
             * @param {*} index The potential iteratee index or key argument.
             * @param {*} object The potential iteratee object argument.
             * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
             *  else `false`.
             */
            function isIterateeCall(value, index, object) {
              if (!isObject(object)) {
                return false;
              }
              var type = typeof index;
              if (type == 'number'
                    ? (isArrayLike(object) && isIndex(index, object.length))
                    : (type == 'string' && index in object)
                  ) {
                return eq(object[index], value);
              }
              return false;
            }

            /**
             * Creates an array of elements split into groups the length of `size`.
             * If `array` can't be split evenly, the final chunk will be the remaining
             * elements.
             *
             * @static
             * @memberOf _
             * @since 3.0.0
             * @category Array
             * @param {Array} array The array to process.
             * @param {number} [size=1] The length of each chunk
             * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
             * @returns {Array} Returns the new array of chunks.
             * @example
             *
             * _.chunk(['a', 'b', 'c', 'd'], 2);
             * // => [['a', 'b'], ['c', 'd']]
             *
             * _.chunk(['a', 'b', 'c', 'd'], 3);
             * // => [['a', 'b', 'c'], ['d']]
             */
            function chunk(array, size, guard) {
              if ((guard ? isIterateeCall(array, size, guard) : size === undefined)) {
                size = 1;
              } else {
                size = nativeMax(toInteger(size), 0);
              }
              var length = array ? array.length : 0;
              if (!length || size < 1) {
                return [];
              }
              var index = 0,
                  resIndex = 0,
                  result = Array(nativeCeil(length / size));

              while (index < length) {
                result[resIndex++] = baseSlice(array, index, (index += size));
              }
              return result;
            }

            /**
             * Performs a
             * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
             * comparison between two values to determine if they are equivalent.
             *
             * @static
             * @memberOf _
             * @since 4.0.0
             * @category Lang
             * @param {*} value The value to compare.
             * @param {*} other The other value to compare.
             * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
             * @example
             *
             * var object = { 'a': 1 };
             * var other = { 'a': 1 };
             *
             * _.eq(object, object);
             * // => true
             *
             * _.eq(object, other);
             * // => false
             *
             * _.eq('a', 'a');
             * // => true
             *
             * _.eq('a', Object('a'));
             * // => false
             *
             * _.eq(NaN, NaN);
             * // => true
             */
            function eq(value, other) {
              return value === other || (value !== value && other !== other);
            }

            /**
             * Checks if `value` is array-like. A value is considered array-like if it's
             * not a function and has a `value.length` that's an integer greater than or
             * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
             *
             * @static
             * @memberOf _
             * @since 4.0.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
             * @example
             *
             * _.isArrayLike([1, 2, 3]);
             * // => true
             *
             * _.isArrayLike(document.body.children);
             * // => true
             *
             * _.isArrayLike('abc');
             * // => true
             *
             * _.isArrayLike(_.noop);
             * // => false
             */
            function isArrayLike(value) {
              return value != null && isLength(value.length) && !isFunction(value);
            }

            /**
             * Checks if `value` is classified as a `Function` object.
             *
             * @static
             * @memberOf _
             * @since 0.1.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is a function, else `false`.
             * @example
             *
             * _.isFunction(_);
             * // => true
             *
             * _.isFunction(/abc/);
             * // => false
             */
            function isFunction(value) {
              // The use of `Object#toString` avoids issues with the `typeof` operator
              // in Safari 8-9 which returns 'object' for typed array and other constructors.
              var tag = isObject(value) ? objectToString.call(value) : '';
              return tag == funcTag || tag == genTag;
            }

            /**
             * Checks if `value` is a valid array-like length.
             *
             * **Note:** This method is loosely based on
             * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
             *
             * @static
             * @memberOf _
             * @since 4.0.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
             * @example
             *
             * _.isLength(3);
             * // => true
             *
             * _.isLength(Number.MIN_VALUE);
             * // => false
             *
             * _.isLength(Infinity);
             * // => false
             *
             * _.isLength('3');
             * // => false
             */
            function isLength(value) {
              return typeof value == 'number' &&
                value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
            }

            /**
             * Checks if `value` is the
             * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
             * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
             *
             * @static
             * @memberOf _
             * @since 0.1.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is an object, else `false`.
             * @example
             *
             * _.isObject({});
             * // => true
             *
             * _.isObject([1, 2, 3]);
             * // => true
             *
             * _.isObject(_.noop);
             * // => true
             *
             * _.isObject(null);
             * // => false
             */
            function isObject(value) {
              var type = typeof value;
              return !!value && (type == 'object' || type == 'function');
            }

            /**
             * Checks if `value` is object-like. A value is object-like if it's not `null`
             * and has a `typeof` result of "object".
             *
             * @static
             * @memberOf _
             * @since 4.0.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
             * @example
             *
             * _.isObjectLike({});
             * // => true
             *
             * _.isObjectLike([1, 2, 3]);
             * // => true
             *
             * _.isObjectLike(_.noop);
             * // => false
             *
             * _.isObjectLike(null);
             * // => false
             */
            function isObjectLike(value) {
              return !!value && typeof value == 'object';
            }

            /**
             * Checks if `value` is classified as a `Symbol` primitive or object.
             *
             * @static
             * @memberOf _
             * @since 4.0.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
             * @example
             *
             * _.isSymbol(Symbol.iterator);
             * // => true
             *
             * _.isSymbol('abc');
             * // => false
             */
            function isSymbol(value) {
              return typeof value == 'symbol' ||
                (isObjectLike(value) && objectToString.call(value) == symbolTag);
            }

            /**
             * Converts `value` to a finite number.
             *
             * @static
             * @memberOf _
             * @since 4.12.0
             * @category Lang
             * @param {*} value The value to convert.
             * @returns {number} Returns the converted number.
             * @example
             *
             * _.toFinite(3.2);
             * // => 3.2
             *
             * _.toFinite(Number.MIN_VALUE);
             * // => 5e-324
             *
             * _.toFinite(Infinity);
             * // => 1.7976931348623157e+308
             *
             * _.toFinite('3.2');
             * // => 3.2
             */
            function toFinite(value) {
              if (!value) {
                return value === 0 ? value : 0;
              }
              value = toNumber(value);
              if (value === INFINITY || value === -INFINITY) {
                var sign = (value < 0 ? -1 : 1);
                return sign * MAX_INTEGER;
              }
              return value === value ? value : 0;
            }

            /**
             * Converts `value` to an integer.
             *
             * **Note:** This method is loosely based on
             * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
             *
             * @static
             * @memberOf _
             * @since 4.0.0
             * @category Lang
             * @param {*} value The value to convert.
             * @returns {number} Returns the converted integer.
             * @example
             *
             * _.toInteger(3.2);
             * // => 3
             *
             * _.toInteger(Number.MIN_VALUE);
             * // => 0
             *
             * _.toInteger(Infinity);
             * // => 1.7976931348623157e+308
             *
             * _.toInteger('3.2');
             * // => 3
             */
            function toInteger(value) {
              var result = toFinite(value),
                  remainder = result % 1;

              return result === result ? (remainder ? result - remainder : result) : 0;
            }

            /**
             * Converts `value` to a number.
             *
             * @static
             * @memberOf _
             * @since 4.0.0
             * @category Lang
             * @param {*} value The value to process.
             * @returns {number} Returns the number.
             * @example
             *
             * _.toNumber(3.2);
             * // => 3.2
             *
             * _.toNumber(Number.MIN_VALUE);
             * // => 5e-324
             *
             * _.toNumber(Infinity);
             * // => Infinity
             *
             * _.toNumber('3.2');
             * // => 3.2
             */
            function toNumber(value) {
              if (typeof value == 'number') {
                return value;
              }
              if (isSymbol(value)) {
                return NAN;
              }
              if (isObject(value)) {
                var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
                value = isObject(other) ? (other + '') : other;
              }
              if (typeof value != 'string') {
                return value === 0 ? value : +value;
              }
              value = value.replace(reTrim, '');
              var isBinary = reIsBinary.test(value);
              return (isBinary || reIsOctal.test(value))
                ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
                : (reIsBadHex.test(value) ? NAN : +value);
            }

            var lodash_chunk = chunk;

            var lodash_isequal = createCommonjsModule(function (module, exports) {
            /**
             * Lodash (Custom Build) <https://lodash.com/>
             * Build: `lodash modularize exports="npm" -o ./`
             * Copyright JS Foundation and other contributors <https://js.foundation/>
             * Released under MIT license <https://lodash.com/license>
             * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
             * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
             */

            /** Used as the size to enable large array optimizations. */
            var LARGE_ARRAY_SIZE = 200;

            /** Used to stand-in for `undefined` hash values. */
            var HASH_UNDEFINED = '__lodash_hash_undefined__';

            /** Used to compose bitmasks for value comparisons. */
            var COMPARE_PARTIAL_FLAG = 1,
                COMPARE_UNORDERED_FLAG = 2;

            /** Used as references for various `Number` constants. */
            var MAX_SAFE_INTEGER = 9007199254740991;

            /** `Object#toString` result references. */
            var argsTag = '[object Arguments]',
                arrayTag = '[object Array]',
                asyncTag = '[object AsyncFunction]',
                boolTag = '[object Boolean]',
                dateTag = '[object Date]',
                errorTag = '[object Error]',
                funcTag = '[object Function]',
                genTag = '[object GeneratorFunction]',
                mapTag = '[object Map]',
                numberTag = '[object Number]',
                nullTag = '[object Null]',
                objectTag = '[object Object]',
                promiseTag = '[object Promise]',
                proxyTag = '[object Proxy]',
                regexpTag = '[object RegExp]',
                setTag = '[object Set]',
                stringTag = '[object String]',
                symbolTag = '[object Symbol]',
                undefinedTag = '[object Undefined]',
                weakMapTag = '[object WeakMap]';

            var arrayBufferTag = '[object ArrayBuffer]',
                dataViewTag = '[object DataView]',
                float32Tag = '[object Float32Array]',
                float64Tag = '[object Float64Array]',
                int8Tag = '[object Int8Array]',
                int16Tag = '[object Int16Array]',
                int32Tag = '[object Int32Array]',
                uint8Tag = '[object Uint8Array]',
                uint8ClampedTag = '[object Uint8ClampedArray]',
                uint16Tag = '[object Uint16Array]',
                uint32Tag = '[object Uint32Array]';

            /**
             * Used to match `RegExp`
             * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
             */
            var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

            /** Used to detect host constructors (Safari). */
            var reIsHostCtor = /^\[object .+?Constructor\]$/;

            /** Used to detect unsigned integer values. */
            var reIsUint = /^(?:0|[1-9]\d*)$/;

            /** Used to identify `toStringTag` values of typed arrays. */
            var typedArrayTags = {};
            typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
            typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
            typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
            typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
            typedArrayTags[uint32Tag] = true;
            typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
            typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
            typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
            typedArrayTags[errorTag] = typedArrayTags[funcTag] =
            typedArrayTags[mapTag] = typedArrayTags[numberTag] =
            typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
            typedArrayTags[setTag] = typedArrayTags[stringTag] =
            typedArrayTags[weakMapTag] = false;

            /** Detect free variable `global` from Node.js. */
            var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

            /** Detect free variable `self`. */
            var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

            /** Used as a reference to the global object. */
            var root = freeGlobal || freeSelf || Function('return this')();

            /** Detect free variable `exports`. */
            var freeExports =  exports && !exports.nodeType && exports;

            /** Detect free variable `module`. */
            var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

            /** Detect the popular CommonJS extension `module.exports`. */
            var moduleExports = freeModule && freeModule.exports === freeExports;

            /** Detect free variable `process` from Node.js. */
            var freeProcess = moduleExports && freeGlobal.process;

            /** Used to access faster Node.js helpers. */
            var nodeUtil = (function() {
              try {
                return freeProcess && freeProcess.binding && freeProcess.binding('util');
              } catch (e) {}
            }());

            /* Node.js helper references. */
            var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

            /**
             * A specialized version of `_.filter` for arrays without support for
             * iteratee shorthands.
             *
             * @private
             * @param {Array} [array] The array to iterate over.
             * @param {Function} predicate The function invoked per iteration.
             * @returns {Array} Returns the new filtered array.
             */
            function arrayFilter(array, predicate) {
              var index = -1,
                  length = array == null ? 0 : array.length,
                  resIndex = 0,
                  result = [];

              while (++index < length) {
                var value = array[index];
                if (predicate(value, index, array)) {
                  result[resIndex++] = value;
                }
              }
              return result;
            }

            /**
             * Appends the elements of `values` to `array`.
             *
             * @private
             * @param {Array} array The array to modify.
             * @param {Array} values The values to append.
             * @returns {Array} Returns `array`.
             */
            function arrayPush(array, values) {
              var index = -1,
                  length = values.length,
                  offset = array.length;

              while (++index < length) {
                array[offset + index] = values[index];
              }
              return array;
            }

            /**
             * A specialized version of `_.some` for arrays without support for iteratee
             * shorthands.
             *
             * @private
             * @param {Array} [array] The array to iterate over.
             * @param {Function} predicate The function invoked per iteration.
             * @returns {boolean} Returns `true` if any element passes the predicate check,
             *  else `false`.
             */
            function arraySome(array, predicate) {
              var index = -1,
                  length = array == null ? 0 : array.length;

              while (++index < length) {
                if (predicate(array[index], index, array)) {
                  return true;
                }
              }
              return false;
            }

            /**
             * The base implementation of `_.times` without support for iteratee shorthands
             * or max array length checks.
             *
             * @private
             * @param {number} n The number of times to invoke `iteratee`.
             * @param {Function} iteratee The function invoked per iteration.
             * @returns {Array} Returns the array of results.
             */
            function baseTimes(n, iteratee) {
              var index = -1,
                  result = Array(n);

              while (++index < n) {
                result[index] = iteratee(index);
              }
              return result;
            }

            /**
             * The base implementation of `_.unary` without support for storing metadata.
             *
             * @private
             * @param {Function} func The function to cap arguments for.
             * @returns {Function} Returns the new capped function.
             */
            function baseUnary(func) {
              return function(value) {
                return func(value);
              };
            }

            /**
             * Checks if a `cache` value for `key` exists.
             *
             * @private
             * @param {Object} cache The cache to query.
             * @param {string} key The key of the entry to check.
             * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
             */
            function cacheHas(cache, key) {
              return cache.has(key);
            }

            /**
             * Gets the value at `key` of `object`.
             *
             * @private
             * @param {Object} [object] The object to query.
             * @param {string} key The key of the property to get.
             * @returns {*} Returns the property value.
             */
            function getValue(object, key) {
              return object == null ? undefined : object[key];
            }

            /**
             * Converts `map` to its key-value pairs.
             *
             * @private
             * @param {Object} map The map to convert.
             * @returns {Array} Returns the key-value pairs.
             */
            function mapToArray(map) {
              var index = -1,
                  result = Array(map.size);

              map.forEach(function(value, key) {
                result[++index] = [key, value];
              });
              return result;
            }

            /**
             * Creates a unary function that invokes `func` with its argument transformed.
             *
             * @private
             * @param {Function} func The function to wrap.
             * @param {Function} transform The argument transform.
             * @returns {Function} Returns the new function.
             */
            function overArg(func, transform) {
              return function(arg) {
                return func(transform(arg));
              };
            }

            /**
             * Converts `set` to an array of its values.
             *
             * @private
             * @param {Object} set The set to convert.
             * @returns {Array} Returns the values.
             */
            function setToArray(set) {
              var index = -1,
                  result = Array(set.size);

              set.forEach(function(value) {
                result[++index] = value;
              });
              return result;
            }

            /** Used for built-in method references. */
            var arrayProto = Array.prototype,
                funcProto = Function.prototype,
                objectProto = Object.prototype;

            /** Used to detect overreaching core-js shims. */
            var coreJsData = root['__core-js_shared__'];

            /** Used to resolve the decompiled source of functions. */
            var funcToString = funcProto.toString;

            /** Used to check objects for own properties. */
            var hasOwnProperty = objectProto.hasOwnProperty;

            /** Used to detect methods masquerading as native. */
            var maskSrcKey = (function() {
              var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
              return uid ? ('Symbol(src)_1.' + uid) : '';
            }());

            /**
             * Used to resolve the
             * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
             * of values.
             */
            var nativeObjectToString = objectProto.toString;

            /** Used to detect if a method is native. */
            var reIsNative = RegExp('^' +
              funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
              .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
            );

            /** Built-in value references. */
            var Buffer = moduleExports ? root.Buffer : undefined,
                Symbol = root.Symbol,
                Uint8Array = root.Uint8Array,
                propertyIsEnumerable = objectProto.propertyIsEnumerable,
                splice = arrayProto.splice,
                symToStringTag = Symbol ? Symbol.toStringTag : undefined;

            /* Built-in method references for those with the same name as other `lodash` methods. */
            var nativeGetSymbols = Object.getOwnPropertySymbols,
                nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
                nativeKeys = overArg(Object.keys, Object);

            /* Built-in method references that are verified to be native. */
            var DataView = getNative(root, 'DataView'),
                Map = getNative(root, 'Map'),
                Promise = getNative(root, 'Promise'),
                Set = getNative(root, 'Set'),
                WeakMap = getNative(root, 'WeakMap'),
                nativeCreate = getNative(Object, 'create');

            /** Used to detect maps, sets, and weakmaps. */
            var dataViewCtorString = toSource(DataView),
                mapCtorString = toSource(Map),
                promiseCtorString = toSource(Promise),
                setCtorString = toSource(Set),
                weakMapCtorString = toSource(WeakMap);

            /** Used to convert symbols to primitives and strings. */
            var symbolProto = Symbol ? Symbol.prototype : undefined,
                symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

            /**
             * Creates a hash object.
             *
             * @private
             * @constructor
             * @param {Array} [entries] The key-value pairs to cache.
             */
            function Hash(entries) {
              var index = -1,
                  length = entries == null ? 0 : entries.length;

              this.clear();
              while (++index < length) {
                var entry = entries[index];
                this.set(entry[0], entry[1]);
              }
            }

            /**
             * Removes all key-value entries from the hash.
             *
             * @private
             * @name clear
             * @memberOf Hash
             */
            function hashClear() {
              this.__data__ = nativeCreate ? nativeCreate(null) : {};
              this.size = 0;
            }

            /**
             * Removes `key` and its value from the hash.
             *
             * @private
             * @name delete
             * @memberOf Hash
             * @param {Object} hash The hash to modify.
             * @param {string} key The key of the value to remove.
             * @returns {boolean} Returns `true` if the entry was removed, else `false`.
             */
            function hashDelete(key) {
              var result = this.has(key) && delete this.__data__[key];
              this.size -= result ? 1 : 0;
              return result;
            }

            /**
             * Gets the hash value for `key`.
             *
             * @private
             * @name get
             * @memberOf Hash
             * @param {string} key The key of the value to get.
             * @returns {*} Returns the entry value.
             */
            function hashGet(key) {
              var data = this.__data__;
              if (nativeCreate) {
                var result = data[key];
                return result === HASH_UNDEFINED ? undefined : result;
              }
              return hasOwnProperty.call(data, key) ? data[key] : undefined;
            }

            /**
             * Checks if a hash value for `key` exists.
             *
             * @private
             * @name has
             * @memberOf Hash
             * @param {string} key The key of the entry to check.
             * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
             */
            function hashHas(key) {
              var data = this.__data__;
              return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
            }

            /**
             * Sets the hash `key` to `value`.
             *
             * @private
             * @name set
             * @memberOf Hash
             * @param {string} key The key of the value to set.
             * @param {*} value The value to set.
             * @returns {Object} Returns the hash instance.
             */
            function hashSet(key, value) {
              var data = this.__data__;
              this.size += this.has(key) ? 0 : 1;
              data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
              return this;
            }

            // Add methods to `Hash`.
            Hash.prototype.clear = hashClear;
            Hash.prototype['delete'] = hashDelete;
            Hash.prototype.get = hashGet;
            Hash.prototype.has = hashHas;
            Hash.prototype.set = hashSet;

            /**
             * Creates an list cache object.
             *
             * @private
             * @constructor
             * @param {Array} [entries] The key-value pairs to cache.
             */
            function ListCache(entries) {
              var index = -1,
                  length = entries == null ? 0 : entries.length;

              this.clear();
              while (++index < length) {
                var entry = entries[index];
                this.set(entry[0], entry[1]);
              }
            }

            /**
             * Removes all key-value entries from the list cache.
             *
             * @private
             * @name clear
             * @memberOf ListCache
             */
            function listCacheClear() {
              this.__data__ = [];
              this.size = 0;
            }

            /**
             * Removes `key` and its value from the list cache.
             *
             * @private
             * @name delete
             * @memberOf ListCache
             * @param {string} key The key of the value to remove.
             * @returns {boolean} Returns `true` if the entry was removed, else `false`.
             */
            function listCacheDelete(key) {
              var data = this.__data__,
                  index = assocIndexOf(data, key);

              if (index < 0) {
                return false;
              }
              var lastIndex = data.length - 1;
              if (index == lastIndex) {
                data.pop();
              } else {
                splice.call(data, index, 1);
              }
              --this.size;
              return true;
            }

            /**
             * Gets the list cache value for `key`.
             *
             * @private
             * @name get
             * @memberOf ListCache
             * @param {string} key The key of the value to get.
             * @returns {*} Returns the entry value.
             */
            function listCacheGet(key) {
              var data = this.__data__,
                  index = assocIndexOf(data, key);

              return index < 0 ? undefined : data[index][1];
            }

            /**
             * Checks if a list cache value for `key` exists.
             *
             * @private
             * @name has
             * @memberOf ListCache
             * @param {string} key The key of the entry to check.
             * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
             */
            function listCacheHas(key) {
              return assocIndexOf(this.__data__, key) > -1;
            }

            /**
             * Sets the list cache `key` to `value`.
             *
             * @private
             * @name set
             * @memberOf ListCache
             * @param {string} key The key of the value to set.
             * @param {*} value The value to set.
             * @returns {Object} Returns the list cache instance.
             */
            function listCacheSet(key, value) {
              var data = this.__data__,
                  index = assocIndexOf(data, key);

              if (index < 0) {
                ++this.size;
                data.push([key, value]);
              } else {
                data[index][1] = value;
              }
              return this;
            }

            // Add methods to `ListCache`.
            ListCache.prototype.clear = listCacheClear;
            ListCache.prototype['delete'] = listCacheDelete;
            ListCache.prototype.get = listCacheGet;
            ListCache.prototype.has = listCacheHas;
            ListCache.prototype.set = listCacheSet;

            /**
             * Creates a map cache object to store key-value pairs.
             *
             * @private
             * @constructor
             * @param {Array} [entries] The key-value pairs to cache.
             */
            function MapCache(entries) {
              var index = -1,
                  length = entries == null ? 0 : entries.length;

              this.clear();
              while (++index < length) {
                var entry = entries[index];
                this.set(entry[0], entry[1]);
              }
            }

            /**
             * Removes all key-value entries from the map.
             *
             * @private
             * @name clear
             * @memberOf MapCache
             */
            function mapCacheClear() {
              this.size = 0;
              this.__data__ = {
                'hash': new Hash,
                'map': new (Map || ListCache),
                'string': new Hash
              };
            }

            /**
             * Removes `key` and its value from the map.
             *
             * @private
             * @name delete
             * @memberOf MapCache
             * @param {string} key The key of the value to remove.
             * @returns {boolean} Returns `true` if the entry was removed, else `false`.
             */
            function mapCacheDelete(key) {
              var result = getMapData(this, key)['delete'](key);
              this.size -= result ? 1 : 0;
              return result;
            }

            /**
             * Gets the map value for `key`.
             *
             * @private
             * @name get
             * @memberOf MapCache
             * @param {string} key The key of the value to get.
             * @returns {*} Returns the entry value.
             */
            function mapCacheGet(key) {
              return getMapData(this, key).get(key);
            }

            /**
             * Checks if a map value for `key` exists.
             *
             * @private
             * @name has
             * @memberOf MapCache
             * @param {string} key The key of the entry to check.
             * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
             */
            function mapCacheHas(key) {
              return getMapData(this, key).has(key);
            }

            /**
             * Sets the map `key` to `value`.
             *
             * @private
             * @name set
             * @memberOf MapCache
             * @param {string} key The key of the value to set.
             * @param {*} value The value to set.
             * @returns {Object} Returns the map cache instance.
             */
            function mapCacheSet(key, value) {
              var data = getMapData(this, key),
                  size = data.size;

              data.set(key, value);
              this.size += data.size == size ? 0 : 1;
              return this;
            }

            // Add methods to `MapCache`.
            MapCache.prototype.clear = mapCacheClear;
            MapCache.prototype['delete'] = mapCacheDelete;
            MapCache.prototype.get = mapCacheGet;
            MapCache.prototype.has = mapCacheHas;
            MapCache.prototype.set = mapCacheSet;

            /**
             *
             * Creates an array cache object to store unique values.
             *
             * @private
             * @constructor
             * @param {Array} [values] The values to cache.
             */
            function SetCache(values) {
              var index = -1,
                  length = values == null ? 0 : values.length;

              this.__data__ = new MapCache;
              while (++index < length) {
                this.add(values[index]);
              }
            }

            /**
             * Adds `value` to the array cache.
             *
             * @private
             * @name add
             * @memberOf SetCache
             * @alias push
             * @param {*} value The value to cache.
             * @returns {Object} Returns the cache instance.
             */
            function setCacheAdd(value) {
              this.__data__.set(value, HASH_UNDEFINED);
              return this;
            }

            /**
             * Checks if `value` is in the array cache.
             *
             * @private
             * @name has
             * @memberOf SetCache
             * @param {*} value The value to search for.
             * @returns {number} Returns `true` if `value` is found, else `false`.
             */
            function setCacheHas(value) {
              return this.__data__.has(value);
            }

            // Add methods to `SetCache`.
            SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
            SetCache.prototype.has = setCacheHas;

            /**
             * Creates a stack cache object to store key-value pairs.
             *
             * @private
             * @constructor
             * @param {Array} [entries] The key-value pairs to cache.
             */
            function Stack(entries) {
              var data = this.__data__ = new ListCache(entries);
              this.size = data.size;
            }

            /**
             * Removes all key-value entries from the stack.
             *
             * @private
             * @name clear
             * @memberOf Stack
             */
            function stackClear() {
              this.__data__ = new ListCache;
              this.size = 0;
            }

            /**
             * Removes `key` and its value from the stack.
             *
             * @private
             * @name delete
             * @memberOf Stack
             * @param {string} key The key of the value to remove.
             * @returns {boolean} Returns `true` if the entry was removed, else `false`.
             */
            function stackDelete(key) {
              var data = this.__data__,
                  result = data['delete'](key);

              this.size = data.size;
              return result;
            }

            /**
             * Gets the stack value for `key`.
             *
             * @private
             * @name get
             * @memberOf Stack
             * @param {string} key The key of the value to get.
             * @returns {*} Returns the entry value.
             */
            function stackGet(key) {
              return this.__data__.get(key);
            }

            /**
             * Checks if a stack value for `key` exists.
             *
             * @private
             * @name has
             * @memberOf Stack
             * @param {string} key The key of the entry to check.
             * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
             */
            function stackHas(key) {
              return this.__data__.has(key);
            }

            /**
             * Sets the stack `key` to `value`.
             *
             * @private
             * @name set
             * @memberOf Stack
             * @param {string} key The key of the value to set.
             * @param {*} value The value to set.
             * @returns {Object} Returns the stack cache instance.
             */
            function stackSet(key, value) {
              var data = this.__data__;
              if (data instanceof ListCache) {
                var pairs = data.__data__;
                if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
                  pairs.push([key, value]);
                  this.size = ++data.size;
                  return this;
                }
                data = this.__data__ = new MapCache(pairs);
              }
              data.set(key, value);
              this.size = data.size;
              return this;
            }

            // Add methods to `Stack`.
            Stack.prototype.clear = stackClear;
            Stack.prototype['delete'] = stackDelete;
            Stack.prototype.get = stackGet;
            Stack.prototype.has = stackHas;
            Stack.prototype.set = stackSet;

            /**
             * Creates an array of the enumerable property names of the array-like `value`.
             *
             * @private
             * @param {*} value The value to query.
             * @param {boolean} inherited Specify returning inherited property names.
             * @returns {Array} Returns the array of property names.
             */
            function arrayLikeKeys(value, inherited) {
              var isArr = isArray(value),
                  isArg = !isArr && isArguments(value),
                  isBuff = !isArr && !isArg && isBuffer(value),
                  isType = !isArr && !isArg && !isBuff && isTypedArray(value),
                  skipIndexes = isArr || isArg || isBuff || isType,
                  result = skipIndexes ? baseTimes(value.length, String) : [],
                  length = result.length;

              for (var key in value) {
                if ((inherited || hasOwnProperty.call(value, key)) &&
                    !(skipIndexes && (
                       // Safari 9 has enumerable `arguments.length` in strict mode.
                       key == 'length' ||
                       // Node.js 0.10 has enumerable non-index properties on buffers.
                       (isBuff && (key == 'offset' || key == 'parent')) ||
                       // PhantomJS 2 has enumerable non-index properties on typed arrays.
                       (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
                       // Skip index properties.
                       isIndex(key, length)
                    ))) {
                  result.push(key);
                }
              }
              return result;
            }

            /**
             * Gets the index at which the `key` is found in `array` of key-value pairs.
             *
             * @private
             * @param {Array} array The array to inspect.
             * @param {*} key The key to search for.
             * @returns {number} Returns the index of the matched value, else `-1`.
             */
            function assocIndexOf(array, key) {
              var length = array.length;
              while (length--) {
                if (eq(array[length][0], key)) {
                  return length;
                }
              }
              return -1;
            }

            /**
             * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
             * `keysFunc` and `symbolsFunc` to get the enumerable property names and
             * symbols of `object`.
             *
             * @private
             * @param {Object} object The object to query.
             * @param {Function} keysFunc The function to get the keys of `object`.
             * @param {Function} symbolsFunc The function to get the symbols of `object`.
             * @returns {Array} Returns the array of property names and symbols.
             */
            function baseGetAllKeys(object, keysFunc, symbolsFunc) {
              var result = keysFunc(object);
              return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
            }

            /**
             * The base implementation of `getTag` without fallbacks for buggy environments.
             *
             * @private
             * @param {*} value The value to query.
             * @returns {string} Returns the `toStringTag`.
             */
            function baseGetTag(value) {
              if (value == null) {
                return value === undefined ? undefinedTag : nullTag;
              }
              return (symToStringTag && symToStringTag in Object(value))
                ? getRawTag(value)
                : objectToString(value);
            }

            /**
             * The base implementation of `_.isArguments`.
             *
             * @private
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is an `arguments` object,
             */
            function baseIsArguments(value) {
              return isObjectLike(value) && baseGetTag(value) == argsTag;
            }

            /**
             * The base implementation of `_.isEqual` which supports partial comparisons
             * and tracks traversed objects.
             *
             * @private
             * @param {*} value The value to compare.
             * @param {*} other The other value to compare.
             * @param {boolean} bitmask The bitmask flags.
             *  1 - Unordered comparison
             *  2 - Partial comparison
             * @param {Function} [customizer] The function to customize comparisons.
             * @param {Object} [stack] Tracks traversed `value` and `other` objects.
             * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
             */
            function baseIsEqual(value, other, bitmask, customizer, stack) {
              if (value === other) {
                return true;
              }
              if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
                return value !== value && other !== other;
              }
              return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
            }

            /**
             * A specialized version of `baseIsEqual` for arrays and objects which performs
             * deep comparisons and tracks traversed objects enabling objects with circular
             * references to be compared.
             *
             * @private
             * @param {Object} object The object to compare.
             * @param {Object} other The other object to compare.
             * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
             * @param {Function} customizer The function to customize comparisons.
             * @param {Function} equalFunc The function to determine equivalents of values.
             * @param {Object} [stack] Tracks traversed `object` and `other` objects.
             * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
             */
            function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
              var objIsArr = isArray(object),
                  othIsArr = isArray(other),
                  objTag = objIsArr ? arrayTag : getTag(object),
                  othTag = othIsArr ? arrayTag : getTag(other);

              objTag = objTag == argsTag ? objectTag : objTag;
              othTag = othTag == argsTag ? objectTag : othTag;

              var objIsObj = objTag == objectTag,
                  othIsObj = othTag == objectTag,
                  isSameTag = objTag == othTag;

              if (isSameTag && isBuffer(object)) {
                if (!isBuffer(other)) {
                  return false;
                }
                objIsArr = true;
                objIsObj = false;
              }
              if (isSameTag && !objIsObj) {
                stack || (stack = new Stack);
                return (objIsArr || isTypedArray(object))
                  ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
                  : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
              }
              if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
                var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
                    othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

                if (objIsWrapped || othIsWrapped) {
                  var objUnwrapped = objIsWrapped ? object.value() : object,
                      othUnwrapped = othIsWrapped ? other.value() : other;

                  stack || (stack = new Stack);
                  return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
                }
              }
              if (!isSameTag) {
                return false;
              }
              stack || (stack = new Stack);
              return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
            }

            /**
             * The base implementation of `_.isNative` without bad shim checks.
             *
             * @private
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is a native function,
             *  else `false`.
             */
            function baseIsNative(value) {
              if (!isObject(value) || isMasked(value)) {
                return false;
              }
              var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
              return pattern.test(toSource(value));
            }

            /**
             * The base implementation of `_.isTypedArray` without Node.js optimizations.
             *
             * @private
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
             */
            function baseIsTypedArray(value) {
              return isObjectLike(value) &&
                isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
            }

            /**
             * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
             *
             * @private
             * @param {Object} object The object to query.
             * @returns {Array} Returns the array of property names.
             */
            function baseKeys(object) {
              if (!isPrototype(object)) {
                return nativeKeys(object);
              }
              var result = [];
              for (var key in Object(object)) {
                if (hasOwnProperty.call(object, key) && key != 'constructor') {
                  result.push(key);
                }
              }
              return result;
            }

            /**
             * A specialized version of `baseIsEqualDeep` for arrays with support for
             * partial deep comparisons.
             *
             * @private
             * @param {Array} array The array to compare.
             * @param {Array} other The other array to compare.
             * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
             * @param {Function} customizer The function to customize comparisons.
             * @param {Function} equalFunc The function to determine equivalents of values.
             * @param {Object} stack Tracks traversed `array` and `other` objects.
             * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
             */
            function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
              var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
                  arrLength = array.length,
                  othLength = other.length;

              if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
                return false;
              }
              // Assume cyclic values are equal.
              var stacked = stack.get(array);
              if (stacked && stack.get(other)) {
                return stacked == other;
              }
              var index = -1,
                  result = true,
                  seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

              stack.set(array, other);
              stack.set(other, array);

              // Ignore non-index properties.
              while (++index < arrLength) {
                var arrValue = array[index],
                    othValue = other[index];

                if (customizer) {
                  var compared = isPartial
                    ? customizer(othValue, arrValue, index, other, array, stack)
                    : customizer(arrValue, othValue, index, array, other, stack);
                }
                if (compared !== undefined) {
                  if (compared) {
                    continue;
                  }
                  result = false;
                  break;
                }
                // Recursively compare arrays (susceptible to call stack limits).
                if (seen) {
                  if (!arraySome(other, function(othValue, othIndex) {
                        if (!cacheHas(seen, othIndex) &&
                            (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                          return seen.push(othIndex);
                        }
                      })) {
                    result = false;
                    break;
                  }
                } else if (!(
                      arrValue === othValue ||
                        equalFunc(arrValue, othValue, bitmask, customizer, stack)
                    )) {
                  result = false;
                  break;
                }
              }
              stack['delete'](array);
              stack['delete'](other);
              return result;
            }

            /**
             * A specialized version of `baseIsEqualDeep` for comparing objects of
             * the same `toStringTag`.
             *
             * **Note:** This function only supports comparing values with tags of
             * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
             *
             * @private
             * @param {Object} object The object to compare.
             * @param {Object} other The other object to compare.
             * @param {string} tag The `toStringTag` of the objects to compare.
             * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
             * @param {Function} customizer The function to customize comparisons.
             * @param {Function} equalFunc The function to determine equivalents of values.
             * @param {Object} stack Tracks traversed `object` and `other` objects.
             * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
             */
            function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
              switch (tag) {
                case dataViewTag:
                  if ((object.byteLength != other.byteLength) ||
                      (object.byteOffset != other.byteOffset)) {
                    return false;
                  }
                  object = object.buffer;
                  other = other.buffer;

                case arrayBufferTag:
                  if ((object.byteLength != other.byteLength) ||
                      !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
                    return false;
                  }
                  return true;

                case boolTag:
                case dateTag:
                case numberTag:
                  // Coerce booleans to `1` or `0` and dates to milliseconds.
                  // Invalid dates are coerced to `NaN`.
                  return eq(+object, +other);

                case errorTag:
                  return object.name == other.name && object.message == other.message;

                case regexpTag:
                case stringTag:
                  // Coerce regexes to strings and treat strings, primitives and objects,
                  // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
                  // for more details.
                  return object == (other + '');

                case mapTag:
                  var convert = mapToArray;

                case setTag:
                  var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
                  convert || (convert = setToArray);

                  if (object.size != other.size && !isPartial) {
                    return false;
                  }
                  // Assume cyclic values are equal.
                  var stacked = stack.get(object);
                  if (stacked) {
                    return stacked == other;
                  }
                  bitmask |= COMPARE_UNORDERED_FLAG;

                  // Recursively compare objects (susceptible to call stack limits).
                  stack.set(object, other);
                  var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
                  stack['delete'](object);
                  return result;

                case symbolTag:
                  if (symbolValueOf) {
                    return symbolValueOf.call(object) == symbolValueOf.call(other);
                  }
              }
              return false;
            }

            /**
             * A specialized version of `baseIsEqualDeep` for objects with support for
             * partial deep comparisons.
             *
             * @private
             * @param {Object} object The object to compare.
             * @param {Object} other The other object to compare.
             * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
             * @param {Function} customizer The function to customize comparisons.
             * @param {Function} equalFunc The function to determine equivalents of values.
             * @param {Object} stack Tracks traversed `object` and `other` objects.
             * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
             */
            function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
              var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
                  objProps = getAllKeys(object),
                  objLength = objProps.length,
                  othProps = getAllKeys(other),
                  othLength = othProps.length;

              if (objLength != othLength && !isPartial) {
                return false;
              }
              var index = objLength;
              while (index--) {
                var key = objProps[index];
                if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
                  return false;
                }
              }
              // Assume cyclic values are equal.
              var stacked = stack.get(object);
              if (stacked && stack.get(other)) {
                return stacked == other;
              }
              var result = true;
              stack.set(object, other);
              stack.set(other, object);

              var skipCtor = isPartial;
              while (++index < objLength) {
                key = objProps[index];
                var objValue = object[key],
                    othValue = other[key];

                if (customizer) {
                  var compared = isPartial
                    ? customizer(othValue, objValue, key, other, object, stack)
                    : customizer(objValue, othValue, key, object, other, stack);
                }
                // Recursively compare objects (susceptible to call stack limits).
                if (!(compared === undefined
                      ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
                      : compared
                    )) {
                  result = false;
                  break;
                }
                skipCtor || (skipCtor = key == 'constructor');
              }
              if (result && !skipCtor) {
                var objCtor = object.constructor,
                    othCtor = other.constructor;

                // Non `Object` object instances with different constructors are not equal.
                if (objCtor != othCtor &&
                    ('constructor' in object && 'constructor' in other) &&
                    !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
                      typeof othCtor == 'function' && othCtor instanceof othCtor)) {
                  result = false;
                }
              }
              stack['delete'](object);
              stack['delete'](other);
              return result;
            }

            /**
             * Creates an array of own enumerable property names and symbols of `object`.
             *
             * @private
             * @param {Object} object The object to query.
             * @returns {Array} Returns the array of property names and symbols.
             */
            function getAllKeys(object) {
              return baseGetAllKeys(object, keys, getSymbols);
            }

            /**
             * Gets the data for `map`.
             *
             * @private
             * @param {Object} map The map to query.
             * @param {string} key The reference key.
             * @returns {*} Returns the map data.
             */
            function getMapData(map, key) {
              var data = map.__data__;
              return isKeyable(key)
                ? data[typeof key == 'string' ? 'string' : 'hash']
                : data.map;
            }

            /**
             * Gets the native function at `key` of `object`.
             *
             * @private
             * @param {Object} object The object to query.
             * @param {string} key The key of the method to get.
             * @returns {*} Returns the function if it's native, else `undefined`.
             */
            function getNative(object, key) {
              var value = getValue(object, key);
              return baseIsNative(value) ? value : undefined;
            }

            /**
             * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
             *
             * @private
             * @param {*} value The value to query.
             * @returns {string} Returns the raw `toStringTag`.
             */
            function getRawTag(value) {
              var isOwn = hasOwnProperty.call(value, symToStringTag),
                  tag = value[symToStringTag];

              try {
                value[symToStringTag] = undefined;
                var unmasked = true;
              } catch (e) {}

              var result = nativeObjectToString.call(value);
              if (unmasked) {
                if (isOwn) {
                  value[symToStringTag] = tag;
                } else {
                  delete value[symToStringTag];
                }
              }
              return result;
            }

            /**
             * Creates an array of the own enumerable symbols of `object`.
             *
             * @private
             * @param {Object} object The object to query.
             * @returns {Array} Returns the array of symbols.
             */
            var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
              if (object == null) {
                return [];
              }
              object = Object(object);
              return arrayFilter(nativeGetSymbols(object), function(symbol) {
                return propertyIsEnumerable.call(object, symbol);
              });
            };

            /**
             * Gets the `toStringTag` of `value`.
             *
             * @private
             * @param {*} value The value to query.
             * @returns {string} Returns the `toStringTag`.
             */
            var getTag = baseGetTag;

            // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
            if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
                (Map && getTag(new Map) != mapTag) ||
                (Promise && getTag(Promise.resolve()) != promiseTag) ||
                (Set && getTag(new Set) != setTag) ||
                (WeakMap && getTag(new WeakMap) != weakMapTag)) {
              getTag = function(value) {
                var result = baseGetTag(value),
                    Ctor = result == objectTag ? value.constructor : undefined,
                    ctorString = Ctor ? toSource(Ctor) : '';

                if (ctorString) {
                  switch (ctorString) {
                    case dataViewCtorString: return dataViewTag;
                    case mapCtorString: return mapTag;
                    case promiseCtorString: return promiseTag;
                    case setCtorString: return setTag;
                    case weakMapCtorString: return weakMapTag;
                  }
                }
                return result;
              };
            }

            /**
             * Checks if `value` is a valid array-like index.
             *
             * @private
             * @param {*} value The value to check.
             * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
             * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
             */
            function isIndex(value, length) {
              length = length == null ? MAX_SAFE_INTEGER : length;
              return !!length &&
                (typeof value == 'number' || reIsUint.test(value)) &&
                (value > -1 && value % 1 == 0 && value < length);
            }

            /**
             * Checks if `value` is suitable for use as unique object key.
             *
             * @private
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
             */
            function isKeyable(value) {
              var type = typeof value;
              return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
                ? (value !== '__proto__')
                : (value === null);
            }

            /**
             * Checks if `func` has its source masked.
             *
             * @private
             * @param {Function} func The function to check.
             * @returns {boolean} Returns `true` if `func` is masked, else `false`.
             */
            function isMasked(func) {
              return !!maskSrcKey && (maskSrcKey in func);
            }

            /**
             * Checks if `value` is likely a prototype object.
             *
             * @private
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
             */
            function isPrototype(value) {
              var Ctor = value && value.constructor,
                  proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

              return value === proto;
            }

            /**
             * Converts `value` to a string using `Object.prototype.toString`.
             *
             * @private
             * @param {*} value The value to convert.
             * @returns {string} Returns the converted string.
             */
            function objectToString(value) {
              return nativeObjectToString.call(value);
            }

            /**
             * Converts `func` to its source code.
             *
             * @private
             * @param {Function} func The function to convert.
             * @returns {string} Returns the source code.
             */
            function toSource(func) {
              if (func != null) {
                try {
                  return funcToString.call(func);
                } catch (e) {}
                try {
                  return (func + '');
                } catch (e) {}
              }
              return '';
            }

            /**
             * Performs a
             * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
             * comparison between two values to determine if they are equivalent.
             *
             * @static
             * @memberOf _
             * @since 4.0.0
             * @category Lang
             * @param {*} value The value to compare.
             * @param {*} other The other value to compare.
             * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
             * @example
             *
             * var object = { 'a': 1 };
             * var other = { 'a': 1 };
             *
             * _.eq(object, object);
             * // => true
             *
             * _.eq(object, other);
             * // => false
             *
             * _.eq('a', 'a');
             * // => true
             *
             * _.eq('a', Object('a'));
             * // => false
             *
             * _.eq(NaN, NaN);
             * // => true
             */
            function eq(value, other) {
              return value === other || (value !== value && other !== other);
            }

            /**
             * Checks if `value` is likely an `arguments` object.
             *
             * @static
             * @memberOf _
             * @since 0.1.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is an `arguments` object,
             *  else `false`.
             * @example
             *
             * _.isArguments(function() { return arguments; }());
             * // => true
             *
             * _.isArguments([1, 2, 3]);
             * // => false
             */
            var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
              return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
                !propertyIsEnumerable.call(value, 'callee');
            };

            /**
             * Checks if `value` is classified as an `Array` object.
             *
             * @static
             * @memberOf _
             * @since 0.1.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is an array, else `false`.
             * @example
             *
             * _.isArray([1, 2, 3]);
             * // => true
             *
             * _.isArray(document.body.children);
             * // => false
             *
             * _.isArray('abc');
             * // => false
             *
             * _.isArray(_.noop);
             * // => false
             */
            var isArray = Array.isArray;

            /**
             * Checks if `value` is array-like. A value is considered array-like if it's
             * not a function and has a `value.length` that's an integer greater than or
             * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
             *
             * @static
             * @memberOf _
             * @since 4.0.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
             * @example
             *
             * _.isArrayLike([1, 2, 3]);
             * // => true
             *
             * _.isArrayLike(document.body.children);
             * // => true
             *
             * _.isArrayLike('abc');
             * // => true
             *
             * _.isArrayLike(_.noop);
             * // => false
             */
            function isArrayLike(value) {
              return value != null && isLength(value.length) && !isFunction(value);
            }

            /**
             * Checks if `value` is a buffer.
             *
             * @static
             * @memberOf _
             * @since 4.3.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
             * @example
             *
             * _.isBuffer(new Buffer(2));
             * // => true
             *
             * _.isBuffer(new Uint8Array(2));
             * // => false
             */
            var isBuffer = nativeIsBuffer || stubFalse;

            /**
             * Performs a deep comparison between two values to determine if they are
             * equivalent.
             *
             * **Note:** This method supports comparing arrays, array buffers, booleans,
             * date objects, error objects, maps, numbers, `Object` objects, regexes,
             * sets, strings, symbols, and typed arrays. `Object` objects are compared
             * by their own, not inherited, enumerable properties. Functions and DOM
             * nodes are compared by strict equality, i.e. `===`.
             *
             * @static
             * @memberOf _
             * @since 0.1.0
             * @category Lang
             * @param {*} value The value to compare.
             * @param {*} other The other value to compare.
             * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
             * @example
             *
             * var object = { 'a': 1 };
             * var other = { 'a': 1 };
             *
             * _.isEqual(object, other);
             * // => true
             *
             * object === other;
             * // => false
             */
            function isEqual(value, other) {
              return baseIsEqual(value, other);
            }

            /**
             * Checks if `value` is classified as a `Function` object.
             *
             * @static
             * @memberOf _
             * @since 0.1.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is a function, else `false`.
             * @example
             *
             * _.isFunction(_);
             * // => true
             *
             * _.isFunction(/abc/);
             * // => false
             */
            function isFunction(value) {
              if (!isObject(value)) {
                return false;
              }
              // The use of `Object#toString` avoids issues with the `typeof` operator
              // in Safari 9 which returns 'object' for typed arrays and other constructors.
              var tag = baseGetTag(value);
              return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
            }

            /**
             * Checks if `value` is a valid array-like length.
             *
             * **Note:** This method is loosely based on
             * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
             *
             * @static
             * @memberOf _
             * @since 4.0.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
             * @example
             *
             * _.isLength(3);
             * // => true
             *
             * _.isLength(Number.MIN_VALUE);
             * // => false
             *
             * _.isLength(Infinity);
             * // => false
             *
             * _.isLength('3');
             * // => false
             */
            function isLength(value) {
              return typeof value == 'number' &&
                value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
            }

            /**
             * Checks if `value` is the
             * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
             * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
             *
             * @static
             * @memberOf _
             * @since 0.1.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is an object, else `false`.
             * @example
             *
             * _.isObject({});
             * // => true
             *
             * _.isObject([1, 2, 3]);
             * // => true
             *
             * _.isObject(_.noop);
             * // => true
             *
             * _.isObject(null);
             * // => false
             */
            function isObject(value) {
              var type = typeof value;
              return value != null && (type == 'object' || type == 'function');
            }

            /**
             * Checks if `value` is object-like. A value is object-like if it's not `null`
             * and has a `typeof` result of "object".
             *
             * @static
             * @memberOf _
             * @since 4.0.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
             * @example
             *
             * _.isObjectLike({});
             * // => true
             *
             * _.isObjectLike([1, 2, 3]);
             * // => true
             *
             * _.isObjectLike(_.noop);
             * // => false
             *
             * _.isObjectLike(null);
             * // => false
             */
            function isObjectLike(value) {
              return value != null && typeof value == 'object';
            }

            /**
             * Checks if `value` is classified as a typed array.
             *
             * @static
             * @memberOf _
             * @since 3.0.0
             * @category Lang
             * @param {*} value The value to check.
             * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
             * @example
             *
             * _.isTypedArray(new Uint8Array);
             * // => true
             *
             * _.isTypedArray([]);
             * // => false
             */
            var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

            /**
             * Creates an array of the own enumerable property names of `object`.
             *
             * **Note:** Non-object values are coerced to objects. See the
             * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
             * for more details.
             *
             * @static
             * @since 0.1.0
             * @memberOf _
             * @category Object
             * @param {Object} object The object to query.
             * @returns {Array} Returns the array of property names.
             * @example
             *
             * function Foo() {
             *   this.a = 1;
             *   this.b = 2;
             * }
             *
             * Foo.prototype.c = 3;
             *
             * _.keys(new Foo);
             * // => ['a', 'b'] (iteration order is not guaranteed)
             *
             * _.keys('hi');
             * // => ['0', '1']
             */
            function keys(object) {
              return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
            }

            /**
             * This method returns a new empty array.
             *
             * @static
             * @memberOf _
             * @since 4.13.0
             * @category Util
             * @returns {Array} Returns the new empty array.
             * @example
             *
             * var arrays = _.times(2, _.stubArray);
             *
             * console.log(arrays);
             * // => [[], []]
             *
             * console.log(arrays[0] === arrays[1]);
             * // => false
             */
            function stubArray() {
              return [];
            }

            /**
             * This method returns `false`.
             *
             * @static
             * @memberOf _
             * @since 4.13.0
             * @category Util
             * @returns {boolean} Returns `false`.
             * @example
             *
             * _.times(2, _.stubFalse);
             * // => [false, false]
             */
            function stubFalse() {
              return false;
            }

            module.exports = isEqual;
            });

            // ++  muk
            //
            // See arvo/sys/hoon.hoon.



            const ux_FF = new bn(0xFF);
            const ux_FF00 = new bn(0xFF00);
            const u_256 = new bn(256);

            /**
             * Standard murmur3.
             *
             * @param  {Number}  syd
             * @param  {Number}  len
             * @param  {BN}  key
             * @return  {BN}
             */
            const muk = (syd, len, key) => {
              const lo = key.and(ux_FF).toNumber();
              const hi = key.and(ux_FF00).div(u_256).toNumber();
              const kee = String.fromCharCode(lo) + String.fromCharCode(hi);
              return new bn(murmurhash3_32_gc(kee, syd))
            };

            // see: https://github.com/garycourt/murmurhash-js
            //
            // Copyright (c) 2011 Gary Court
            //
            // Permission is hereby granted, free of charge, to any person obtaining a copy of
            // this software and associated documentation files (the "Software"), to deal in
            // the Software without restriction, including without limitation the rights to
            // use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
            // of the Software, and to permit persons to whom the Software is furnished to do
            // so, subject to the following conditions:
            //
            // The above copyright notice and this permission notice shall be included in all
            // copies or substantial portions of the Software.
            //
            // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
            // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
            // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
            // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
            // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
            // SOFTWARE.

            /**
             * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
             *
             * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
             * @see http://github.com/garycourt/murmurhash-js
             * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
             * @see http://sites.google.com/site/murmurhash/
             *
             * @param {string} key ASCII only
             * @param {number} seed Positive integer only
             * @return {number} 32-bit positive integer hash
             **/
            const murmurhash3_32_gc = (key, seed) => {
              // eslint-disable-next-line no-unused-vars
              let remainder, bytes, h1, h1b, c1, c2, k1, i;

              remainder = key.length & 3; // key.length % 4
              bytes = key.length - remainder;
              h1 = seed;
              c1 = 0xcc9e2d51;
              c2 = 0x1b873593;
              i = 0;

              while (i < bytes) {
                  k1 =
                    ((key.charCodeAt(i) & 0xff)) |
                    ((key.charCodeAt(++i) & 0xff) << 8) |
                    ((key.charCodeAt(++i) & 0xff) << 16) |
                    ((key.charCodeAt(++i) & 0xff) << 24);
                ++i;

                k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
                k1 = (k1 << 15) | (k1 >>> 17);
                k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

                h1 ^= k1;
                    h1 = (h1 << 13) | (h1 >>> 19);
                h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
                h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
              }

              k1 = 0;

              switch (remainder) {
                case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
                // eslint-disable-next-line no-fallthrough
                case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
                // eslint-disable-next-line no-fallthrough
                case 1: k1 ^= (key.charCodeAt(i) & 0xff);

                k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
                k1 = (k1 << 15) | (k1 >>> 17);
                k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
                h1 ^= k1;
              }

              h1 ^= key.length;

              h1 ^= h1 >>> 16;
              h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
              h1 ^= h1 >>> 13;
              h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
              h1 ^= h1 >>> 16;

              return h1 >>> 0;
            };

            var muk_1 = {
              muk
            };

            // ++  ob
            //
            // See arvo/sys/hoon.hoon.


            const { muk: muk$1 } = muk_1;

            const ux_1_0000 = new bn('10000', 'hex');
            const ux_ffff_ffff = new bn('ffffffff', 'hex');
            const ux_1_0000_0000 = new bn('100000000', 'hex');
            const ux_ffff_ffff_ffff_ffff = new bn('ffffffffffffffff', 'hex');
            const ux_ffff_ffff_0000_0000 = new bn('ffffffff00000000', 'hex');

            const u_65535 = new bn('65535');
            const u_65536 = new bn('65536');

            // a PRF for j in { 0, .., 3 }
            const F = (j, arg) => {
              const raku = [
                0xb76d5eed,
                0xee281300,
                0x85bcae01,
                0x4b387af7,
              ];

              return muk$1(raku[j], 2, arg)
            };

            /**
             * Conceal structure v3.
             *
             * @param {String, Number, BN} pyn
             * @return  {BN}
             */
            const fein = (arg) => {
              const loop = (pyn) => {
                const lo = pyn.and(ux_ffff_ffff);
                const hi = pyn.and(ux_ffff_ffff_0000_0000);

                return pyn.gte(ux_1_0000) && pyn.lte(ux_ffff_ffff)
                  ? ux_1_0000.add(feis(pyn.sub(ux_1_0000)))
                  : pyn.gte(ux_1_0000_0000) && pyn.lte(ux_ffff_ffff_ffff_ffff)
                  ? hi.or(loop(lo))
                  : pyn
              };

              return loop(new bn(arg))
            };

            /**
             * Restore structure v3.
             *
             * @param  {String, Number, BN}  cry
             * @return  {BN}
             */
            const fynd = (arg) => {
              const loop = (cry) => {
                const lo = cry.and(ux_ffff_ffff);
                const hi = cry.and(ux_ffff_ffff_0000_0000);

                return cry.gte(ux_1_0000) && cry.lte(ux_ffff_ffff)
                  ? ux_1_0000.add(tail(cry.sub(ux_1_0000)))
                  : cry.gte(ux_1_0000_0000) && cry.lte(ux_ffff_ffff_ffff_ffff)
                  ? hi.or(loop(lo))
                  : cry
              };

              return loop(new bn(arg))
            };

            /**
             * Generalised Feistel cipher.
             *
             * See: Black and Rogaway (2002), "Ciphers with arbitrary finite domains."
             *
             * Note that this has been adjusted from the reference paper in order to
             * support some legacy behaviour.
             *
             * @param  {String, Number, BN}
             * @return  {BN}
             */
            const feis = arg =>
              Fe(4, u_65535, u_65536, ux_ffff_ffff, F, new bn(arg));

            const Fe = (r, a, b, k, f, m) => {
              const c = fe(r, a, b, f, m);
              return (
                  c.lt(k)
                ? c
                : fe(r, a, b, f, c)
              )
            };

            const fe = (r, a, b, f, m) => {
              const loop = (j, ell, arr) => {
                if (j > r) {
                  return (
                      r % 2 !== 0
                    ? a.mul(arr).add(ell)
                    : arr.eq(a)
                    ? a.mul(arr).add(ell)
                    : a.mul(ell).add(arr)
                  )
                } else {
                  const eff = f(j - 1, arr);

                  const tmp =
                      j % 2 !== 0
                    ? ell.add(eff).mod(a)
                    : ell.add(eff).mod(b);

                  return loop(j + 1, arr, tmp)
                }
              };

              const L = m.mod(a);
              const R = m.div(a);

              return loop(1, L, R)
            };

            /**
             * Reverse 'feis'.
             *
             * See: Black and Rogaway (2002), "Ciphers with arbitrary finite domains."
             *
             * Note that this has been adjusted from the reference paper in order to
             * support some legacy behaviour.
             *
             * @param {Number, String, BN}  arg
             * @return  {BN}
             */
            const tail = arg =>
              Fen(4, u_65535, u_65536, ux_ffff_ffff, F, new bn(arg));

            const Fen = (r, a, b, k, f, m) => {
              const c = fen(r, a, b, f, m);
              return (
                  c.lt(k)
                ? c
                : fen(r, a, b, f, c)
              )
            };

            const fen = (r, a, b, f, m) => {
              const loop = (j, ell, arr) => {
                if (j < 1) {
                  return a.mul(arr).add(ell)
                } else {
                  const eff = f(j - 1, ell);

                  // NB (jtobin):
                  //
                  // Slight deviation from B&R (2002) here to prevent negative values.  We
                  // add 'a' or 'b' to arr as appropriate and reduce 'eff' modulo the same
                  // number before performing subtraction.
                  //
                  const tmp =
                      j % 2 !== 0
                    ? arr.add(a).sub(eff.mod(a)).mod(a)
                    : arr.add(b).sub(eff.mod(b)).mod(b);

                  return loop(j - 1, tmp, ell)
                }
              };

              const ahh =
                  r % 2 !== 0
                ? m.div(a)
                : m.mod(a);

              const ale =
                  r % 2 !== 0
                ? m.mod(a)
                : m.div(a);

              const L =
                  ale.eq(a)
                ? ahh
                : ale;

              const R =
                  ale.eq(a)
                ? ale
                : ahh;

              return loop(r, L, R)
            };

            var ob = {
              F,

              fe,
              Fe,
              feis,
              fein,

              fen,
              Fen,
              tail,
              fynd
            };

            // ++  co
            //
            // See arvo/sys/hoon.hoon.







            const zero = new bn(0);
            const one = new bn(1);
            const two = new bn(2);
            const three = new bn(3);
            const four = new bn(4);
            const five = new bn(5);

            const pre = `
dozmarbinwansamlitsighidfidlissogdirwacsabwissib\
rigsoldopmodfoglidhopdardorlorhodfolrintogsilmir\
holpaslacrovlivdalsatlibtabhanticpidtorbolfosdot\
losdilforpilramtirwintadbicdifrocwidbisdasmidlop\
rilnardapmolsanlocnovsitnidtipsicropwitnatpanmin\
ritpodmottamtolsavposnapnopsomfinfonbanmorworsip\
ronnorbotwicsocwatdolmagpicdavbidbaltimtasmallig\
sivtagpadsaldivdactansidfabtarmonranniswolmispal\
lasdismaprabtobrollatlonnodnavfignomnibpagsopral\
bilhaddocridmocpacravripfaltodtiltinhapmicfanpat\
taclabmogsimsonpinlomrictapfirhasbosbatpochactid\
havsaplindibhosdabbitbarracparloddosbortochilmac\
tomdigfilfasmithobharmighinradmashalraglagfadtop\
mophabnilnosmilfopfamdatnoldinhatnacrisfotribhoc\
nimlarfitwalrapsarnalmoslandondanladdovrivbacpol\
laptalpitnambonrostonfodponsovnocsorlavmatmipfip\
`;

            const suf = `
zodnecbudwessevpersutletfulpensytdurwepserwylsun\
rypsyxdyrnuphebpeglupdepdysputlughecryttyvsydnex\
lunmeplutseppesdelsulpedtemledtulmetwenbynhexfeb\
pyldulhetmevruttylwydtepbesdexsefwycburderneppur\
rysrebdennutsubpetrulsynregtydsupsemwynrecmegnet\
secmulnymtevwebsummutnyxrextebfushepbenmuswyxsym\
selrucdecwexsyrwetdylmynmesdetbetbeltuxtugmyrpel\
syptermebsetdutdegtexsurfeltudnuxruxrenwytnubmed\
lytdusnebrumtynseglyxpunresredfunrevrefmectedrus\
bexlebduxrynnumpyxrygryxfeptyrtustyclegnemfermer\
tenlusnussyltecmexpubrymtucfyllepdebbermughuttun\
bylsudpemdevlurdefbusbeprunmelpexdytbyttyplevmyl\
wedducfurfexnulluclennerlexrupnedlecrydlydfenwel\
nydhusrelrudneshesfetdesretdunlernyrsebhulryllud\
remlysfynwerrycsugnysnyllyndyndemluxfedsedbecmun\
lyrtesmudnytbyrsenwegfyrmurtelreptegpecnelnevfes\
`;

            const patp2syls = name =>
                 name.replace(/[\^~-]/g,'').match(/.{1,3}/g)
              || [];

            const splitAt = (index, str) => [str.slice(0, index), str.slice(index)];

            const prefixes = pre.match(/.{1,3}/g);

            const suffixes = suf.match(/.{1,3}/g);

            const bex = (n) =>
              two.pow(n);

            const rsh = (a, b, c) =>
              c.div(bex(bex(a).mul(b)));

            const met = (a, b, c = zero) =>
              b.eq(zero)
              ? c
              : met(a, rsh(a, one, b), c.add(one));

            const end = (a, b, c) =>
              c.mod(bex(bex(a).mul(b)));

            /**
             * Convert a hex-encoded string to a @p-encoded string.
             *
             * @param  {String}  hex
             * @return  {String}
             */
            const hex2patp = (hex) => {
              if (hex === null) {
                throw new Error('hex2patp: null input')
              }
              return patp(new bn(hex, 'hex'))
            };

            /**
             * Convert a @p-encoded string to a hex-encoded string.
             *
             * @param  {String}  name @p
             * @return  {String}
             */
            const patp2hex = (name) => {
              if (isValidPat(name) === false) {
                throw new Error('patp2hex: not a valid @p')
              }
              const syls = patp2syls(name);

              const syl2bin = idx =>
                idx.toString(2).padStart(8, '0');

              const addr = syls.reduce((acc, syl, idx) =>
                idx % 2 !== 0 || syls.length === 1
                  ? acc + syl2bin(suffixes.indexOf(syl))
                  : acc + syl2bin(prefixes.indexOf(syl)),
              '');

              const bn$1 = new bn(addr, 2);
              const hex = ob.fynd(bn$1).toString('hex');
              return hex.length % 2 !== 0
                ? hex.padStart(hex.length + 1, '0')
                : hex
            };

            /**
             * Convert a @p-encoded string to a bignum.
             *
             * @param  {String}  name @p
             * @return  {BN}
             */
            const patp2bn = name =>
              new bn(patp2hex(name), 'hex');

            /**
             * Convert a @p-encoded string to a decimal-encoded string.
             *
             * @param  {String}  name @p
             * @return  {String}
             */
            const patp2dec = name => {
              let bn;
              try {
                bn = patp2bn(name);
              } catch(_) {
                throw new Error('patp2dec: not a valid @p')
              }
              return bn.toString()
            };

            /**
             * Convert a number to a @q-encoded string.
             *
             * @param  {String, Number, BN}  arg
             * @return  {String}
             */
            const patq = (arg) => {
              const bn$1 = new bn(arg);
              const buf = bn$1.toArrayLike(Buffer);
              return buf2patq(buf)
            };

            /**
             * Convert a Buffer into a @q-encoded string.
             *
             * @param  {Buffer}  buf
             * @return  {String}
             */
            const buf2patq = buf => {
              const chunked =
                buf.length % 2 !== 0 && buf.length > 1
                ? [[buf[0]]].concat(lodash_chunk(buf.slice(1), 2))
                : lodash_chunk(buf, 2);

              const prefixName = byts =>
                byts[1] === undefined
                ? prefixes[0] + suffixes[byts[0]]
                : prefixes[byts[0]] + suffixes[byts[1]];

              const name = byts =>
                byts[1] === undefined
                ? suffixes[byts[0]]
                : prefixes[byts[0]] + suffixes[byts[1]];

              const alg = pair =>
                pair.length % 2 !== 0 && chunked.length > 1
                ? prefixName(pair)
                : name(pair);

              return chunked.reduce((acc, elem) =>
                acc + (acc === '~' ? '' : '-') + alg(elem), '~')
            };

            /**
             * Convert a hex-encoded string to a @q-encoded string.
             *
             * Note that this preserves leading zero bytes.
             *
             * @param  {String}  hex
             * @return  {String}
             */
            const hex2patq = arg => {
              const hex =
                arg.length % 2 !== 0
                ? arg.padStart(arg.length + 1, '0')
                : arg;

              const buf = Buffer.from(hex, 'hex');
              return buf2patq(buf)
            };

            /**
             * Convert a @q-encoded string to a hex-encoded string.
             *
             * Note that this preserves leading zero bytes.
             *
             * @param  {String}  name @q
             * @return  {String}
             */
            const patq2hex = name => {
              if (isValidPat(name) === false) {
                throw new Error('patq2hex: not a valid @q')
              }
              const chunks = name.slice(1).split('-');
              const dec2hex = dec =>
                dec.toString(16).padStart(2, '0');

              const splat = chunks.map(chunk => {
                let syls = splitAt(3, chunk);
                return syls[1] === ''
                  ? dec2hex(suffixes.indexOf(syls[0]))
                  : dec2hex(prefixes.indexOf(syls[0])) +
                    dec2hex(suffixes.indexOf(syls[1]))
              });

              return name.length === 0
                ? '00'
                : splat.join('')
            };

            /**
             * Convert a @q-encoded string to a bignum.
             *
             * @param  {String}  name @q
             * @return  {BN}
             */
            const patq2bn = name =>
              new bn(patq2hex(name), 'hex');

            /**
             * Convert a @q-encoded string to a decimal-encoded string.
             *
             * @param  {String}  name @q
             * @return  {String}
             */
            const patq2dec = name => {
              let bn;
              try {
                bn = patq2bn(name);
              } catch(_) {
                throw new Error('patq2dec: not a valid @q')
              }
              return bn.toString()
            };

            /**
             * Determine the ship class of a @p value.
             *
             * @param  {String}  @p
             * @return  {String}
             */
            const clan = who => {
              let name;
              try {
                name = patp2bn(who);
              } catch(_) {
                throw new Error('clan: not a valid @p')
              }

              const wid = met(three, name);
              return wid.lte(one)
                ? 'galaxy'
                : wid.eq(two)
                ? 'star'
                : wid.lte(four)
                ? 'planet'
                : wid.lte(new bn(8))
                ? 'moon'
                : 'comet'
            };

            /**
             * Determine the parent of a @p value.
             *
             * @param  {String}  @p
             * @return  {String}
             */
            const sein = name => {
              let who;
              try {
                who = patp2bn(name);
              } catch(_) {
                throw new Error('sein: not a valid @p')
              }

              let mir;
              try {
                mir = clan(name);
              } catch(_) {
                throw new Error('sein: not a valid @p')
              }

              const res =
                mir === 'galaxy'
                ? who
                : mir === 'star'
                ? end(three, one, who)
                : mir === 'planet'
                ? end(four, one, who)
                : mir === 'moon'
                ? end(five, one, who)
                : zero;
              return patp(res)
            };

            /**
             * Weakly check if a string is a valid @p or @q value.
             *
             * This is, at present, a pretty weak sanity check.  It doesn't confirm the
             * structure precisely (e.g. dashes), and for @q, it's required that q values
             * of (greater than one) odd bytelength have been zero-padded.  So, for
             * example, '~doznec-binwod' will be considered a valid @q, but '~nec-binwod'
             * will not.
             *
             * @param  {String}  name a @p or @q value
             * @return  {String}
             */
            const isValidPat = name => {
              if (typeof name !== 'string') {
                throw new Error('isValidPat: non-string input')
              }

              const leadingTilde = name.slice(0, 1) === '~';

              if (leadingTilde === false || name.length < 4) {
                return false
              } else {
                const syls = patp2syls(name);
                const wrongLength = syls.length % 2 !== 0 && syls.length !== 1;
                const sylsExist = syls.reduce((acc, syl, index) =>
                  acc &&
                    (index % 2 !== 0 || syls.length === 1
                      ? suffixes.includes(syl)
                      : prefixes.includes(syl)),
                  true);

                return !wrongLength && sylsExist
              }
            };

            /**
             * Validate a @p string.
             *
             * @param  {String}  str a string
             * @return  {String}
             */
            const isValidPatp = str =>
              isValidPat(str) && str === patp(patp2dec(str));

            /**
             * Validate a @q string.
             *
             * @param  {String}  str a string
             * @return  {String}
             */
            const isValidPatq = str =>
              isValidPat(str) && eqPatq(str, patq(patq2dec(str)));

            /**
             * Remove all leading zero bytes from a sliceable value.
             * @param  {String, Buffer, Array}
             * @return  {String}
             */
            const removeLeadingZeroBytes = str =>
              str.slice(0, 2) === '00'
              ? removeLeadingZeroBytes(str.slice(2))
              : str;

            /**
             * Equality comparison, modulo leading zero bytes.
             * @param  {String, Buffer, Array}
             * @param  {String, Buffer, Array}
             * @return  {Bool}
             */
            const eqModLeadingZeroBytes = (s, t) =>
              lodash_isequal(removeLeadingZeroBytes(s), removeLeadingZeroBytes(t));

            /**
             * Equality comparison on @q values.
             * @param  {String}  p a @q-encoded string
             * @param  {String}  q a @q-encoded string
             * @return  {Bool}
             */
            const eqPatq = (p, q) => {
              let phex;
              try {
                phex = patq2hex(p);
              } catch(_) {
                throw new Error('eqPatq: not a valid @q')
              }

              let qhex;
              try {
                qhex = patq2hex(q);
              } catch(_) {
                throw new Error('eqPatq: not a valid @q')
              }

              return eqModLeadingZeroBytes(phex, qhex)
            };

            /**
             * Convert a number to a @p-encoded string.
             *
             * @param  {String, Number, BN}  arg
             * @return  {String}
             */
            const patp = (arg) => {
              if (arg === null) {
                throw new Error('patp: null input')
              }
              const n = new bn(arg);

              const sxz = ob.fein(n);
              const dyy = met(four, sxz);

              const loop = (tsxz, timp, trep) => {
                const log = end(four, one, tsxz);
                const pre = prefixes[rsh(three, one, log)];
                const suf = suffixes[end(three, one, log)];
                const etc =
                  (timp.mod(four)).eq(zero)
                    ? timp.eq(zero)
                      ? ''
                      : '--'
                    : '-';

                const res = pre + suf + etc + trep;

                return timp.eq(dyy)
                  ? trep
                  : loop(rsh(four, one, tsxz), timp.add(one), res)
              };

              const dyx = met(three, sxz);

              return '~' +
                (dyx.lte(one)
                ? suffixes[sxz]
                : loop(sxz, zero, ''))
            };

            var co = {
              patp,
              patp2hex,
              hex2patp,
              patp2dec,
              sein,
              clan,

              patq,
              patq2hex,
              hex2patq,
              patq2dec,

              eqPatq,
              isValidPat,
              isValidPatp,
              isValidPatq
            };

            var src = Object.assign(
              co,
              ob
            );

            exports.default = src;

            Object.defineProperty(exports, '__esModule', { value: true });
            window.urbitOb = src;

}));
