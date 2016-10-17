var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var Bar = require('@src/traces/bar');

var customMatchers = require('../assets/custom_matchers');

describe('bar supplyDefaults', function() {
    'use strict';

    var traceIn,
        traceOut;

    var defaultColor = '#444';

    var supplyDefaults = Bar.supplyDefaults;

    beforeEach(function() {
        traceOut = {};
    });

    it('should set visible to false when x and y are empty', function() {
        traceIn = {};
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            x: [],
            y: []
        };
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.visible).toBe(false);
    });

    it('should set visible to false when x or y is empty', function() {
        traceIn = {
            x: []
        };
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            x: [],
            y: [1, 2, 3]
        };
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            y: []
        };
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            x: [1, 2, 3],
            y: []
        };
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.visible).toBe(false);
    });
});

describe('bar supplyLayoutDefaults', function() {
    'use strict';

    var gd;

    it('should set barbase to 0', function() {
        gd = {
            data: [{
                type: 'bar',
                x: [],
                y: [],
            }],
            layout: {}
        };

        Plots.supplyDefaults(gd);

        expect(gd._fullLayout.barbase).toBe(0);
    });
});

describe('barbase', function() {
    'use strict';

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    function assertPointField(calcData, prop, expectation) {
        var values = [];

        calcData.forEach(function(calcTrace) {
            var vals = calcTrace.map(function(pt) {
                return Lib.nestedProperty(pt, prop).get();
            });

            values.push(vals);
        });

        expect(values).toBeCloseTo2DArray(
            expectation, undefined, '- field ' + prop);
    }

    it('should be honored in overlay mode', function() {
        var data = [{
                y: [10, 20, 30]
            }, {
                y: [-10, 20, -30]
            }, {
                y: [null, null, -30]
            }],
            layout = {
                barbase: 10,
                barmode: 'overlay'
            },
            cd = getCalcdata(data, layout);

        // Note:
        // The base of null bars is set to zero and the size is left undefined
        assertPointField(cd, 'b', [[10, 10, 10], [10, 10, 10], [0, 0, 10]]);
        assertPointField(cd, 's',
            [[0, 10, 20], [-20, 10, -40], [undefined, undefined, -40]]);
        assertPointField(cd, 'p', [[0, 1, 2], [0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'y',
            [[10, 20, 30], [-10, 20, -30], [undefined, undefined, -30]]);
    });

    it('should be honored in group mode', function() {
        var data = [{
                y: [10, 20, 30]
            }, {
                y: [-10, 20, -30]
            }, {
                y: [null, null, -30]
            }],
            layout = {
                barbase: 10,
                barmode: 'group'
            },
            cd = getCalcdata(data, layout);

        // Note:
        // The base of null bars is set to zero and the size is left undefined
        assertPointField(cd, 'b', [[10, 10, 10], [10, 10, 10], [0, 0, 10]]);
        assertPointField(cd, 's',
            [[0, 10, 20], [-20, 10, -40], [undefined, undefined, -40]]);
        assertPointField(cd, 'p', [[0, 1, 2], [0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'x',
            [[-0.27, 0.73, 1.73], [0, 1, 2], [0.27, 1.27, 2.27]]);
        assertPointField(cd, 'y',
            [[10, 20, 30], [-10, 20, -30], [undefined, undefined, -30]]);
    });

    it('should be honored in group mode when barnorm is set', function() {
        var data = [{
                y: [30, 70, 20]
            }, {
                y: [70, 30, 30]
            }, {
                y: [null, null, 50]
            }],
            layout = {
                barbase: 1,
                barmode: 'group',
                barnorm: 'fraction'
            },
            cd = getCalcdata(data, layout);

        // Note:
        // The base of null bars is set to zero and the size is left undefined
        assertPointField(cd, 'b', [[1, 1, 1], [1, 1, 1], [0, 0, 1]]);
        assertPointField(cd, 's',
            [[-0.7, -0.3, -0.8], [-0.3, -0.7, -0.7], [undefined, undefined, -0.5]]);
        assertPointField(cd, 'p', [[0, 1, 2], [0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'x',
            [[-0.27, 0.73, 1.73], [0, 1, 2], [0.27, 1.27, 2.27]]);
        assertPointField(cd, 'y',
            [[0.3, 0.7, 0.2], [0.7, 0.3, 0.3], [undefined, undefined, 0.5]]);
    });
});

describe('heatmap calc / setPositions', function() {
    'use strict';

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    function assertPtField(calcData, prop, expectation) {
        var values = [];

        calcData.forEach(function(calcTrace) {
            var vals = calcTrace.map(function(pt) {
                return Lib.nestedProperty(pt, prop).get();
            });

            values.push(vals);
        });

        expect(values).toBeCloseTo2DArray(expectation, undefined, '- field ' + prop);
    }

    function assertTraceField(calcData, prop, expectation) {
        var values = calcData.map(function(calcTrace) {
            return Lib.nestedProperty(calcTrace[0], prop).get();
        });

        expect(values).toBeCloseToArray(expectation, undefined, '- field ' + prop);
    }

    it('should fill in calc pt fields (stack case)', function() {
        var out = getCalcdata([{
            y: [2, 1, 2]
        }, {
            y: [3, 1, 2]
        }, {
            y: [null, null, 2]
        }], {
            barmode: 'stack'
        });

        assertPtField(out, 'x', [[0, 1, 2], [0, 1, 2], [0, 1, 2]]);
        assertPtField(out, 'y', [[2, 1, 2], [5, 2, 4], [undefined, undefined, 6]]);
        assertPtField(out, 'b', [[0, 0, 0], [2, 1, 2], [0, 0, 4]]);
        assertPtField(out, 's', [[2, 1, 2], [3, 1, 2], [undefined, undefined, 2]]);
        assertPtField(out, 'p', [[0, 1, 2], [0, 1, 2], [0, 1, 2]]);
        assertTraceField(out, 't.barwidth', [0.8, 0.8, 0.8]);
        assertTraceField(out, 't.poffset', [-0.4, -0.4, -0.4]);
        assertTraceField(out, 't.bargroupwidth', [0.8, 0.8, 0.8]);
    });

    it('should fill in calc pt fields (overlay case)', function() {
        var out = getCalcdata([{
            y: [2, 1, 2]
        }, {
            y: [3, 1, 2]
        }], {
            barmode: 'overlay'
        });

        assertPtField(out, 'x', [[0, 1, 2], [0, 1, 2]]);
        assertPtField(out, 'y', [[2, 1, 2], [3, 1, 2]]);
        assertPtField(out, 'b', [[0, 0, 0], [0, 0, 0]]);
        assertPtField(out, 's', [[2, 1, 2], [3, 1, 2]]);
        assertPtField(out, 'p', [[0, 1, 2], [0, 1, 2]]);
        assertTraceField(out, 't.barwidth', [0.8, 0.8]);
        assertTraceField(out, 't.poffset', [-0.4, -0.4]);
        assertTraceField(out, 't.bargroupwidth', [0.8, 0.8]);
    });

    it('should fill in calc pt fields (group case)', function() {
        var out = getCalcdata([{
            y: [2, 1, 2]
        }, {
            y: [3, 1, 2]
        }], {
            barmode: 'group',
            // asumming default bargap is 0.2
            bargroupgap: 0.1
        });

        assertPtField(out, 'x', [[-0.2, 0.8, 1.8], [0.2, 1.2, 2.2]]);
        assertPtField(out, 'y', [[2, 1, 2], [3, 1, 2]]);
        assertPtField(out, 'b', [[0, 0, 0], [0, 0, 0]]);
        assertPtField(out, 's', [[2, 1, 2], [3, 1, 2]]);
        assertPtField(out, 'p', [[0, 1, 2], [0, 1, 2]]);
        assertTraceField(out, 't.barwidth', [0.36, 0.36]);
        assertTraceField(out, 't.poffset', [-0.38, 0.02]);
        assertTraceField(out, 't.bargroupwidth', [0.8, 0.8]);
    });

    it('should fill in calc pt fields (relative case)', function() {
        var out = getCalcdata([{
            y: [20, 14, -23]
        }, {
            y: [-12, -18, -29]
        }], {
            barmode: 'relative'
        });

        assertPtField(out, 'x', [[0, 1, 2], [0, 1, 2]]);
        assertPtField(out, 'y', [[20, 14, -23], [-12, -18, -52]]);
        assertPtField(out, 'b', [[0, 0, 0], [0, 0, -23]]);
        assertPtField(out, 's', [[20, 14, -23], [-12, -18, -29]]);
        assertPtField(out, 'p', [[0, 1, 2], [0, 1, 2]]);
        assertTraceField(out, 't.barwidth', [0.8, 0.8]);
        assertTraceField(out, 't.poffset', [-0.4, -0.4]);
        assertTraceField(out, 't.bargroupwidth', [0.8, 0.8]);
    });

    it('should fill in calc pt fields (relative / percent case)', function() {
        var out = getCalcdata([{
            x: ['A', 'B', 'C', 'D'],
            y: [20, 14, 40, -60]
        }, {
            x: ['A', 'B', 'C', 'D'],
            y: [-12, -18, 60, -40]
        }], {
            barmode: 'relative',
            barnorm: 'percent'
        });

        assertPtField(out, 'x', [[0, 1, 2, 3], [0, 1, 2, 3]]);
        assertPtField(out, 'y', [[100, 100, 40, -60], [-100, -100, 100, -100]]);
        assertPtField(out, 'b', [[0, 0, 0, 0], [0, 0, 40, -60]]);
        assertPtField(out, 's', [[100, 100, 40, -60], [-100, -100, 60, -40]]);
        assertPtField(out, 'p', [[0, 1, 2, 3], [0, 1, 2, 3]]);
        assertTraceField(out, 't.barwidth', [0.8, 0.8]);
        assertTraceField(out, 't.poffset', [-0.4, -0.4]);
        assertTraceField(out, 't.bargroupwidth', [0.8, 0.8]);
    });
});

function getCalcdata(dataOpts, layout) {
    var baseData = { type: 'bar' };

    var data = dataOpts.map(function(traceOpts) {
        return Lib.extendFlat({}, baseData, traceOpts);
    });

    var gd = {
        data: data,
        layout: layout,
        calcdata: []
    };

    Plots.supplyDefaults(gd);

    gd._fullData.forEach(function(fullTrace) {
        var cd = Bar.calc(gd, fullTrace);

        cd[0].t = {};
        cd[0].trace = fullTrace;

        gd.calcdata.push(cd);
    });

    var plotinfo = {
        xaxis: gd._fullLayout.xaxis,
        yaxis: gd._fullLayout.yaxis
    };

    Bar.setPositions(gd, plotinfo);

    return gd.calcdata;
}
