var d3 = require('d3');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test shapes nodes', function() {
    'use strict';

    var mock = require('@mocks/shapes.json');
    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockData = Lib.extendDeep([], mock.data),
            mockLayout = Lib.extendDeep({}, mock.layout);

        Plotly.plot(gd, mockData, mockLayout).then(done);
    });

    afterEach(destroyGraphDiv);

    function countSubplots() {
        return d3.selectAll('.subplot').size();
    }

    function countShapeLayers() {
        return d3.selectAll('.shapelayer').size();
    }

    function countPaths() {
        return d3.selectAll('.shapelayer > path').size();
    }

    it('has as many *subplot* nodes as traces', function() {
        expect(countSubplots()).toEqual(mock.data.length);
    });

    it('has as many *shapelayer* nodes as *subplot* nodes', function() {
        expect(countShapeLayers()).toEqual(countSubplots());
    });

    it('has as many *path* nodes per subplot as there are shapes', function() {
        expect(countPaths())
            .toEqual(countSubplots() * mock.layout.shapes.length);
    });

    it('should be able to get relayout', function(done) {
        expect(countSubplots()).toEqual(mock.data.length);
        expect(countShapeLayers()).toEqual(countSubplots());
        expect(countPaths())
            .toEqual(countSubplots() * mock.layout.shapes.length);

        Plotly.relayout(gd, {height: 200, width: 400}).then(function() {
            expect(countSubplots()).toEqual(mock.data.length);
            expect(countShapeLayers()).toEqual(countSubplots());
            expect(countPaths())
                .toEqual(countSubplots() * mock.layout.shapes.length);
            done();
        });
    });
});
