const { nanoid, customAlphabet } = require('nanoid');

// Custom alphabet excluding similar looking characters
const alphabet = '0123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const customNanoid = customAlphabet(alphabet, 8);

class ShortCodeGenerator {
  static generate(length = 8) {
    if (length <= 0 || length > 20) {
      throw new Error('Short code length must be between 1 and 20');
    }
    
    if (length === 8) {
      return customNanoid();
    }
    
    return customAlphabet(alphabet, length)();
  }

  static isValid(shortCode) {
    if (!shortCode || typeof shortCode !== 'string') {
      return false;
    }
    
    const pattern = new RegExp(`^[${alphabet}]+$`);
    return pattern.test(shortCode) && shortCode.length >= 3 && shortCode.length <= 20;
  }
}

module.exports = ShortCodeGenerator;