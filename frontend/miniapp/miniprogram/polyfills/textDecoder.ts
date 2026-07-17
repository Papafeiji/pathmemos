

function toUint8Array(input?: ArrayBuffer | ArrayBufferView | null): Uint8Array {
  if (input == null) {
    return new Uint8Array(0);
  }
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }

  return new Uint8Array(input as ArrayBuffer);
}

const isContinuationByte = (b: number) => (b & 0xc0) === 0x80;

class TextDecoderPolyfill {
  private _pending: Uint8Array = new Uint8Array(0);
  private _fatal: boolean = false;

  constructor(label: string = 'utf-8', options?: { fatal?: boolean }) {
    const normalized = (label || 'utf-8').toLowerCase();
    if (normalized !== 'utf-8' && normalized !== 'utf8') {
      throw new RangeError(`TextDecoderPolyfill only supports utf-8, got "${label}"`);
    }
    if (options) {
      this._fatal = !!options.fatal;
    }
  }

  decode(input?: ArrayBuffer | ArrayBufferView | null, options?: { stream?: boolean }): string {
    const bytes = toUint8Array(input);
    if (bytes.length === 0 && this._pending.length === 0) {
      return '';
    }

    const combined = new Uint8Array(this._pending.length + bytes.length);
    combined.set(this._pending, 0);
    combined.set(bytes, this._pending.length);

    let i = 0;
    let result = '';
    while (i < combined.length) {
      const b1 = combined[i];
      let codePoint = 0;
      let size = 0;

      if ((b1 & 0x80) === 0) {
        codePoint = b1;
        size = 1;
      } else if ((b1 & 0xe0) === 0xc0) {
        size = 2;
        if (i + size > combined.length) break;
        if (!isContinuationByte(combined[i + 1])) {
          if (this._fatal) {
            throw new TypeError('TextDecoderPolyfill: invalid continuation byte');
          }
          result += '\uFFFD';
          i++;
          continue;
        }
        codePoint = ((b1 & 0x1f) << 6) | (combined[i + 1] & 0x3f);
      } else if ((b1 & 0xf0) === 0xe0) {
        size = 3;
        if (i + size > combined.length) break;
        if (!isContinuationByte(combined[i + 1]) || !isContinuationByte(combined[i + 2])) {
          if (this._fatal) {
            throw new TypeError('TextDecoderPolyfill: invalid continuation byte');
          }
          result += '\uFFFD';
          i++;
          continue;
        }
        codePoint =
          ((b1 & 0x0f) << 12) |
          ((combined[i + 1] & 0x3f) << 6) |
          (combined[i + 2] & 0x3f);
        // UTF-8 3 字节序列不得解码出 surrogate code point（U+D800–U+DFFF）。
        if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
          if (this._fatal) {
            throw new TypeError('TextDecoderPolyfill: invalid surrogate code point');
          }
          result += '\uFFFD';
          i++;
          continue;
        }
      } else if ((b1 & 0xf8) === 0xf0) {
        size = 4;
        if (i + size > combined.length) break;
        if (
          !isContinuationByte(combined[i + 1]) ||
          !isContinuationByte(combined[i + 2]) ||
          !isContinuationByte(combined[i + 3])
        ) {
          if (this._fatal) {
            throw new TypeError('TextDecoderPolyfill: invalid continuation byte');
          }
          result += '\uFFFD';
          i++;
          continue;
        }
        codePoint =
          ((b1 & 0x07) << 18) |
          ((combined[i + 1] & 0x3f) << 12) |
          ((combined[i + 2] & 0x3f) << 6) |
          (combined[i + 3] & 0x3f);
      } else {
        if (this._fatal) {
          throw new TypeError('TextDecoderPolyfill: invalid leading byte');
        }
        result += '\uFFFD';
        i++;
        continue;
      }

      if (
        (size === 2 && codePoint < 0x80) ||
        (size === 3 && codePoint < 0x800) ||
        (size === 4 && codePoint < 0x10000) ||
        codePoint > 0x10ffff
      ) {
        if (this._fatal) {
          throw new TypeError('TextDecoderPolyfill: invalid code point');
        }
        result += '\uFFFD';
        i++;
        continue;
      }

      if (codePoint <= 0xffff) {
        result += String.fromCharCode(codePoint);
      } else {
        codePoint -= 0x10000;
        result += String.fromCharCode(0xd800 + (codePoint >> 10), 0xdc00 + (codePoint & 0x3ff));
      }
      i += size;
    }

    if (options?.stream) {
      this._pending = combined.slice(i);
    } else {
      // stream: false means the input is complete; trailing incomplete
      // UTF-8 sequences should be replaced or throw, not silently dropped.
      if (i < combined.length) {
        if (this._fatal) {
          throw new TypeError('TextDecoderPolyfill: trailing incomplete sequence');
        }
        result += '\uFFFD';
      }
      this._pending = new Uint8Array(0);
    }

    return result;
  }
}

function shouldUsePolyfill(): boolean {
  if (typeof TextDecoder === 'undefined') {
    return true;
  }
  try {
    const decoder = new TextDecoder('utf-8');
    // 检测原生实现是否支持 stream 选项；不支持则强制使用 polyfill。
    decoder.decode(new Uint8Array(0), { stream: true });
    return false;
  } catch {
    return true;
  }
}

if (shouldUsePolyfill()) {
  (globalThis as any).TextDecoder = TextDecoderPolyfill;
}

export { TextDecoderPolyfill };
