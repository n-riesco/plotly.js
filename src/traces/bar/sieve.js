/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');

module.exports = Sieve;

/**
 * Helper class to sieve data into bins.
 *
 * @class
 * @param {number} binWidth
 *                 Data is sieved into bins of width binWidth
 * @param {number} [binBase]
 *                 If defined, create a bin for values equal or larger than
 *                 binBase, and another for smaller values.
 */
function Sieve(binWidth, binBase) {
    this.binWidth = binWidth;

    if(isNumeric(binBase)) this.binBase = binBase;

    this.bins = {};
}

/**
 * Sieve datum
 *
 * @method
 * @param {number} position
 * @param {number} value
 * @returns {number} Previous bin value
 */
Sieve.prototype.put = function put(position, value) {
    var label = this.getBinLabel(position, value),
        oldValue = this.bins[label] || 0;

    this.bins[label] = oldValue + value;

    return oldValue;
};

/**
 * Get current bin value for a given datum
 *
 * @method
 * @param {number} position  Position of datum
 * @param {number} [value]   Value of datum (required if binBase was defined)
 * @returns {number} Current bin value
 */
Sieve.prototype.get = function put(position, value) {
    var label = this.getBinLabel(position, value);
    return this.bins[label] || 0;
};

/**
 * Get bin label for a given datum
 *
 * @method
 * @param {number} position  Position of datum
 * @param {number} [value]   Value of datum (required if this.binBase is set)
 * @returns {string} Bin label (prefixed with a 'v' this.binBase is set and
 * value is smaller than this.binBase; otherwise prefixed with '^')
 */
Sieve.prototype.getBinLabel = function getBinLabel(position, value) {
    var prefix = (isNumeric(this.binBase) && value < this.binBase) ? 'v' : '^',
        bin = Math.round(position / this.binWidth);
    return prefix + bin;    
};
