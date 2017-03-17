var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Drawing = require('@src/components/drawing');
var DBLCLICKDELAY = require('@src/constants/interactions').DBLCLICKDELAY;

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var getRectCenter = require('../assets/get_rect_center');
var customMatchers = require('../assets/custom_matchers');

// cartesian click events events use the hover data
// from the mousemove events and then simulate
// a click event on mouseup
var click = require('../assets/click');
var doubleClickRaw = require('../assets/double_click');


function getClientPosition(selector, index) {
    index = index || 0;
    var selection = document.querySelectorAll(selector),
        clientPos = selection[index].getBoundingClientRect(),
        x = Math.floor((clientPos.left + clientPos.right) / 2),
        y = Math.floor((clientPos.top + clientPos.bottom) / 2);
    return [x, y];
}

function move(fromX, fromY, toX, toY, delay) {
    return new Promise(function(resolve) {
        mouseEvent('mousemove', fromX, fromY);

        setTimeout(function() {
            mouseEvent('mousemove', toX, toY);
            resolve();
        }, delay || DBLCLICKDELAY / 4);
    });
}

function drag(fromX, fromY, toX, toY, delay) {
    return new Promise(function(resolve) {
        mouseEvent('mousemove', fromX, fromY);
        mouseEvent('mousedown', fromX, fromY);
        mouseEvent('mousemove', toX, toY);

        setTimeout(function() {
            mouseEvent('mouseup', toX, toY);
            resolve();
        }, delay || DBLCLICKDELAY / 4);
    });
}


describe('Test click interactions:', function() {
    var mock = require('@mocks/14.json');

    var mockCopy, gd;

    var pointPos = [344, 216],
        blankPos = [63, 356];

    var autoRangeX = [-3.011967491973726, 2.1561305597186564],
        autoRangeY = [-0.9910086301469277, 1.389382716298284];

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    beforeEach(function() {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
    });

    afterEach(destroyGraphDiv);

    function doubleClick(x, y) {
        return doubleClickRaw(x, y).then(function() {
            return Plotly.Plots.previousPromises(gd);
        });
    }

    describe('click events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1]);
            expect(futureData).toBe(undefined);
        });

        it('should contain the correct fields', function() {
            click(pointPos[0], pointPos[1]);
            expect(futureData.points.length).toEqual(1);

            var pt = futureData.points[0];
            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber',
                'x', 'y', 'xaxis', 'yaxis'
            ]);
            expect(pt.curveNumber).toEqual(0);
            expect(pt.pointNumber).toEqual(11);
            expect(pt.x).toEqual(0.125);
            expect(pt.y).toEqual(2.125);

            var evt = futureData.event;
            expect(evt.clientX).toEqual(pointPos[0]);
            expect(evt.clientY).toEqual(pointPos[1]);
        });
    });

    describe('modified click events', function() {
        var clickOpts = {
                altKey: true,
                ctrlKey: true,
                metaKey: true,
                shiftKey: true
            },
            futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1], clickOpts);
            expect(futureData).toBe(undefined);
        });

        it('should contain the correct fields', function() {
            click(pointPos[0], pointPos[1], clickOpts);
            expect(futureData.points.length).toEqual(1);

            var pt = futureData.points[0];
            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber',
                'x', 'y', 'xaxis', 'yaxis'
            ]);
            expect(pt.curveNumber).toEqual(0);
            expect(pt.pointNumber).toEqual(11);
            expect(pt.x).toEqual(0.125);
            expect(pt.y).toEqual(2.125);

            var evt = futureData.event;
            expect(evt.clientX).toEqual(pointPos[0]);
            expect(evt.clientY).toEqual(pointPos[1]);
            Object.getOwnPropertyNames(clickOpts).forEach(function(opt) {
                expect(evt[opt]).toEqual(clickOpts[opt], opt);
            });
        });
    });

    describe('click event with hoverinfo set to skip - plotly_click', function() {
        var futureData = null;

        beforeEach(function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mockCopy);
            modifiedMockCopy.data[0].hoverinfo = 'skip';
            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)
                .then(done);

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not register the click', function() {
            click(pointPos[0], pointPos[1]);
            expect(futureData).toEqual(null);
        });
    });

    describe('click events with hoverinfo set to skip - plotly_hover', function() {
        var futureData = null;

        beforeEach(function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mockCopy);
            modifiedMockCopy.data[0].hoverinfo = 'skip';
            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)
                .then(done);

            gd.on('plotly_hover', function(data) {
                futureData = data;
            });
        });

        it('should not register the hover', function() {
            click(pointPos[0], pointPos[1]);
            expect(futureData).toEqual(null);
        });
    });

    describe('click event with hoverinfo set to none - plotly_click', function() {
        var futureData;

        beforeEach(function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mockCopy);
            modifiedMockCopy.data[0].hoverinfo = 'none';
            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)
                .then(done);

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields despite hoverinfo: "none"', function() {
            click(pointPos[0], pointPos[1]);
            expect(futureData.points.length).toEqual(1);

            var pt = futureData.points[0];
            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber',
                'x', 'y', 'xaxis', 'yaxis'
            ]);
            expect(pt.curveNumber).toEqual(0);
            expect(pt.pointNumber).toEqual(11);
            expect(pt.x).toEqual(0.125);
            expect(pt.y).toEqual(2.125);
        });
    });

    describe('click events with hoverinfo set to none - plotly_hover', function() {
        var futureData;

        beforeEach(function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mockCopy);
            modifiedMockCopy.data[0].hoverinfo = 'none';
            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)
                .then(done);

            gd.on('plotly_hover', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields despite hoverinfo: "none"', function() {
            click(pointPos[0], pointPos[1]);
            expect(futureData.points.length).toEqual(1);

            var pt = futureData.points[0];
            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber',
                'x', 'y', 'xaxis', 'yaxis'
            ]);
            expect(pt.curveNumber).toEqual(0);
            expect(pt.pointNumber).toEqual(11);
            expect(pt.x).toEqual(0.125);
            expect(pt.y).toEqual(2.125);

            var evt = futureData.event;
            expect(evt.clientX).toEqual(pointPos[0]);
            expect(evt.clientY).toEqual(pointPos[1]);
        });
    });

    describe('plotly_unhover event with hoverinfo set to none', function() {
        var futureData;

        beforeEach(function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mockCopy);
            modifiedMockCopy.data[0].hoverinfo = 'none';
            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)
                .then(done);

            gd.on('plotly_unhover', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields despite hoverinfo: "none"', function(done) {
            move(pointPos[0], pointPos[1], blankPos[0], blankPos[1]).then(function() {
                expect(futureData.points.length).toEqual(1);

                var pt = futureData.points[0];
                expect(Object.keys(pt)).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber',
                    'x', 'y', 'xaxis', 'yaxis'
                ]);
                expect(pt.curveNumber).toEqual(0);
                expect(pt.pointNumber).toEqual(11);
                expect(pt.x).toEqual(0.125);
                expect(pt.y).toEqual(2.125);

                var evt = futureData.event;
                expect(evt.clientX).toEqual(blankPos[0]);
                expect(evt.clientY).toEqual(blankPos[1]);
            }).then(done);
        });
    });

    describe('double click events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_doubleclick', function(data) {
                futureData = data;
            });

        });

        it('should return null', function(done) {
            doubleClick(pointPos[0], pointPos[1]).then(function() {
                expect(futureData).toBe(null);
                done();
            });
        });
    });

    describe('drag interactions', function() {
        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                // Do not let the notifier hide the drag elements
                var tooltip = document.querySelector('.notifier-note');
                if(tooltip) tooltip.style.display = 'None';

                done();
            });
        });

        it('on nw dragbox should update the axis ranges', function(done) {
            var node = document.querySelector('rect.nwdrag');
            var pos = getRectCenter(node);

            expect(node.classList[0]).toBe('drag');
            expect(node.classList[1]).toBe('nwdrag');
            expect(node.classList[2]).toBe('cursor-nw-resize');

            expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
            expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

            drag(pos[0], pos[1], pos[0] + 10, pos[1] + 50).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-3.08579746, 2.156130559]);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.99100863, 1.86546098]);

                return drag(pos[0], pos[1], pos[0] - 10, pos[1] - 50);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.99100863, 1.10938115]);

                done();
            });
        });

        it('on ne dragbox should update the axis ranges', function(done) {
            var node = document.querySelector('rect.nedrag');
            var pos = getRectCenter(node);

            expect(node.classList[0]).toBe('drag');
            expect(node.classList[1]).toBe('nedrag');
            expect(node.classList[2]).toBe('cursor-ne-resize');

            expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
            expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

            drag(pos[0], pos[1], pos[0] + 50, pos[1] + 50).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-3.01196749, 1.72466470]);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.99100863, 1.86546098]);

                return drag(pos[0], pos[1], pos[0] - 50, pos[1] - 50);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-3.01196749, 2.08350047]);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.99100863, 1.10938115]);

                done();
            });
        });

        it('on sw dragbox should update the axis ranges', function(done) {
            var node = document.querySelector('rect.swdrag');
            var pos = getRectCenter(node);

            expect(node.classList[0]).toBe('drag');
            expect(node.classList[1]).toBe('swdrag');
            expect(node.classList[2]).toBe('cursor-sw-resize');

            expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
            expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

            drag(pos[0], pos[1], pos[0] + 10, pos[1] + 50).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-3.08579746, 2.15613055]);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.36094210, 1.38938271]);

                return drag(pos[0], pos[1], pos[0] - 10, pos[1] - 50);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-3.00958227, 2.15613055]);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.71100706, 1.38938271]);

                done();
            });
        });

        it('on se dragbox should update the axis ranges', function(done) {
            var node = document.querySelector('rect.sedrag');
            var pos = getRectCenter(node);

            expect(node.classList[0]).toBe('drag');
            expect(node.classList[1]).toBe('sedrag');
            expect(node.classList[2]).toBe('cursor-se-resize');

            expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
            expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

            drag(pos[0], pos[1], pos[0] + 50, pos[1] + 50).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-3.01196749, 1.72466470]);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.36094210, 1.38938271]);

                return drag(pos[0], pos[1], pos[0] - 50, pos[1] - 50);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-3.01196749, 2.08350047]);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.71100706, 1.38938271]);

                done();
            });
        });

        it('on ew dragbox should update the xaxis range', function(done) {
            var node = document.querySelector('rect.ewdrag');
            var pos = getRectCenter(node);

            expect(node.classList[0]).toBe('drag');
            expect(node.classList[1]).toBe('ewdrag');
            expect(node.classList[2]).toBe('cursor-ew-resize');

            expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
            expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

            drag(pos[0], pos[1], pos[0] + 50, pos[1] + 50).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-3.375918058, 1.792179992]);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                return drag(pos[0], pos[1], pos[0] - 50, pos[1] - 50);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-3.01196749, 2.15613055]);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                done();
            });
        });

        it('on w dragbox should update the xaxis range', function(done) {
            var node = document.querySelector('rect.wdrag');
            var pos = getRectCenter(node);

            expect(node.classList[0]).toBe('drag');
            expect(node.classList[1]).toBe('wdrag');
            expect(node.classList[2]).toBe('cursor-w-resize');

            expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
            expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

            drag(pos[0], pos[1], pos[0] + 50, pos[1] + 50).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-3.40349007, 2.15613055]);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                return drag(pos[0], pos[1], pos[0] - 50, pos[1] - 50);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-2.93933740, 2.15613055]);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                done();
            });
        });

        it('on e dragbox should update the xaxis range', function(done) {
            var node = document.querySelector('rect.edrag');
            var pos = getRectCenter(node);

            expect(node.classList[0]).toBe('drag');
            expect(node.classList[1]).toBe('edrag');
            expect(node.classList[2]).toBe('cursor-e-resize');

            expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
            expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

            drag(pos[0], pos[1], pos[0] + 50, pos[1] + 50).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-3.01196749, 1.7246647]);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                return drag(pos[0], pos[1], pos[0] - 50, pos[1] - 50);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-3.01196749, 2.0835004]);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                done();
            });
        });

        it('on ns dragbox should update the yaxis range', function(done) {
            var node = document.querySelector('rect.nsdrag');
            var pos = getRectCenter(node);

            expect(node.classList[0]).toBe('drag');
            expect(node.classList[1]).toBe('nsdrag');
            expect(node.classList[2]).toBe('cursor-ns-resize');

            expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
            expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

            drag(pos[0], pos[1], pos[0] + 10, pos[1] + 50).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.59427673, 1.78611460]);

                return drag(pos[0], pos[1], pos[0] - 10, pos[1] - 50);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                done();
            });
        });

        it('on s dragbox should update the yaxis range', function(done) {
            var node = document.querySelector('rect.sdrag');
            var pos = getRectCenter(node);

            expect(node.classList[0]).toBe('drag');
            expect(node.classList[1]).toBe('sdrag');
            expect(node.classList[2]).toBe('cursor-s-resize');

            expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
            expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

            drag(pos[0], pos[1], pos[0] + 10, pos[1] + 50).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.3609421011, 1.3893827]);

                return drag(pos[0], pos[1], pos[0] - 10, pos[1] - 50);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.7110070646, 1.3893827]);

                done();
            });
        });

        it('on n dragbox should update the yaxis range', function(done) {
            var node = document.querySelector('rect.ndrag');
            var pos = getRectCenter(node);

            expect(node.classList[0]).toBe('drag');
            expect(node.classList[1]).toBe('ndrag');
            expect(node.classList[2]).toBe('cursor-n-resize');

            expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
            expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

            drag(pos[0], pos[1], pos[0] + 10, pos[1] + 50).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.991008630, 1.86546098]);

                return drag(pos[0], pos[1], pos[0] - 10, pos[1] - 50);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.991008630, 1.10938115]);

                done();
            });
        });

    });

    describe('double click interactions', function() {
        var setRangeX = [-3, 1],
            setRangeY = [-0.5, 1];

        var zoomRangeX = [-2, 0],
            zoomRangeY = [0, 0.5];

        var update = {
            'xaxis.range[0]': zoomRangeX[0],
            'xaxis.range[1]': zoomRangeX[1],
            'yaxis.range[0]': zoomRangeY[0],
            'yaxis.range[1]': zoomRangeY[1]
        };

        function setRanges(mockCopy) {
            mockCopy.layout.xaxis.autorange = false;
            mockCopy.layout.xaxis.range = setRangeX.slice();

            mockCopy.layout.yaxis.autorange = false;
            mockCopy.layout.yaxis.range = setRangeY.slice();

            return mockCopy;
        }

        it('when set to \'reset+autorange\' (the default) should work when \'autorange\' is on', function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                return Plotly.relayout(gd, update);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                return doubleClick(blankPos[0], blankPos[1]);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                done();
            });
        });

        it('when set to \'reset+autorange\' (the default) should reset to set range on double click', function(done) {
            mockCopy = setRanges(mockCopy);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                return Plotly.relayout(gd, update);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                return doubleClick(blankPos[0], blankPos[1]);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                done();
            });
        });

        it('when set to \'reset+autorange\' (the default) should autosize on 1st double click and reset on 2nd', function(done) {
            mockCopy = setRanges(mockCopy);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                return doubleClick(blankPos[0], blankPos[1]);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                return doubleClick(blankPos[0], blankPos[1]);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                done();
            });
        });

        it('when set to \'reset+autorange\' (the default) should autosize on 1st double click and zoom when immediately dragged', function(done) {
            mockCopy = setRanges(mockCopy);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                return doubleClick(blankPos[0], blankPos[1]);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                return drag(100, 100, 200, 200, DBLCLICKDELAY / 2);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-2.6480169249531356, -1.920115790911955]);
                expect(gd.layout.yaxis.range).toBeCloseToArray([0.4372261777201992, 1.2306899598686027]);

                done();
            });
        });

        it('when set to \'reset+autorange\' (the default) should follow updated auto ranges', function(done) {
            var updateData = {
                x: [[1e-4, 0, 1e3]],
                y: [[30, 0, 30]]
            };

            var newAutoRangeX = [-4.482371794871794, 3.4823717948717943],
                newAutoRangeY = [-0.8892256657741471, 1.6689872212461876];

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                return Plotly.relayout(gd, update);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                return Plotly.restyle(gd, updateData);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                return doubleClick(blankPos[0], blankPos[1]);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(newAutoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(newAutoRangeY);

                return doubleClick(blankPos[0], blankPos[1]);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(newAutoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(newAutoRangeY);

                done();
            });
        });

        it('when set to \'reset\' should work when \'autorange\' is on', function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout, { doubleClick: 'reset' }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                return Plotly.relayout(gd, update);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                return doubleClick(blankPos[0], blankPos[1]);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                done();
            });
        });

        it('when set to \'reset\' should reset to set range on double click', function(done) {
            mockCopy = setRanges(mockCopy);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout, { doubleClick: 'reset' }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                return Plotly.relayout(gd, update);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                return doubleClick(blankPos[0], blankPos[1]);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                done();
            });
        });

        it('when set to \'reset\' should reset on all double clicks', function(done) {
            mockCopy = setRanges(mockCopy);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout, { doubleClick: 'reset' }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                return doubleClick(blankPos[0], blankPos[1]);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                done();
            });
        });

        it('when set to \'autosize\' should work when \'autorange\' is on', function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout, { doubleClick: 'autosize' }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                return Plotly.relayout(gd, update);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                return doubleClick(blankPos[0], blankPos[1]);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                done();
            });
        });

        it('when set to \'autosize\' should set to autorange on double click', function(done) {
            mockCopy = setRanges(mockCopy);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout, { doubleClick: 'autosize' }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                return Plotly.relayout(gd, update);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                return doubleClick(blankPos[0], blankPos[1]);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                done();
            });
        });

        it('when set to \'autosize\' should reset on all double clicks', function(done) {
            mockCopy = setRanges(mockCopy);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout, { doubleClick: 'autosize' }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                return doubleClick(blankPos[0], blankPos[1]);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                done();
            });
        });

    });

    describe('zoom interactions', function() {
        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        it('on main dragbox should update the axis ranges', function(done) {
            expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
            expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

            drag(93, 93, 393, 293).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-2.69897000, -0.515266602]);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.30069513, 1.2862324246]);

                return drag(93, 93, 393, 293);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-2.56671754, -1.644025966]);
                expect(gd.layout.yaxis.range).toBeCloseToArray([0.159513853, 1.2174655634]);

                done();
            });
        });
    });

    describe('scroll zoom interactions', function() {

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout, { scrollZoom: true }).then(done);
        });

        it('zooms in on scroll up', function() {

            var plot = gd._fullLayout._plots.xy.plot;

            mouseEvent('mousemove', 393, 243);
            mouseEvent('scroll', 393, 243, { deltaX: 0, deltaY: -1000 });

            var transform = plot.attr('transform');

            var mockEl = {
                attr: function() {
                    return transform;
                }
            };

            var translate = Drawing.getTranslate(mockEl),
                scale = Drawing.getScale(mockEl);

            expect([translate.x, translate.y]).toBeCloseToArray([61.070, 97.712]);
            expect([scale.x, scale.y]).toBeCloseToArray([1.221, 1.221]);
        });
    });

    describe('pan interactions', function() {
        beforeEach(function(done) {
            mockCopy.layout.dragmode = 'pan';

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        it('on main dragbox should update the axis ranges', function(done) {
            expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
            expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

            drag(93, 93, 393, 293).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-5.19567089, -0.02757284]);
                expect(gd.layout.yaxis.range).toBeCloseToArray([0.595918934, 2.976310280]);

                return drag(93, 93, 393, 293);
            }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-7.37937429, -2.21127624]);
                expect(gd.layout.yaxis.range).toBeCloseToArray([2.182846498, 4.563237844]);

                done();
            });
        });


        it('should move the plot when panning', function() {
            var start = 100,
                end = 300,
                plot = gd._fullLayout._plots.xy.plot;

            mouseEvent('mousemove', start, start);
            mouseEvent('mousedown', start, start);
            mouseEvent('mousemove', end, end);

            expect(plot.attr('transform')).toBe('translate(250, 280) scale(1, 1)');

            mouseEvent('mouseup', end, end);
        });
    });
});


describe('Test click interactions on a pie plot:', function() {
    var mock = require('@mocks/pie_simple.json');

    var mockCopy, gd;

    var blankPos = [10, 10],
        pointPos;

    beforeAll(function(done) {
        jasmine.addMatchers(customMatchers);

        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            pointPos = getClientPosition('g.slicetext');
            destroyGraphDiv();
            done();
        });
    });

    beforeEach(function() {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
    });

    afterEach(destroyGraphDiv);

    describe('click events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1]);
            expect(futureData).toBe(undefined);
        });

        it('should contain the correct fields', function() {
            click(pointPos[0], pointPos[1]);
            expect(futureData.points.length).toEqual(1);

            var pt = futureData.points[0];
            expect(Object.keys(pt)).toEqual([
                'v', 'label', 'color', 'i', 'hidden', 'vTotal', 'text', 't',
                'trace', 'r', 'cx', 'cy', 'px1', 'pxmid', 'midangle', 'px0',
                'largeArc', 'cxFinal', 'cyFinal'
            ]);
            expect(typeof pt.color).toEqual(typeof '#1f77b4', 'points[0].color');
            expect(pt.cx).toEqual(200, 'points[0].cx');
            expect(pt.cxFinal).toEqual(200, 'points[0].cxFinal');
            expect(pt.cy).toEqual(160, 'points[0].cy');
            expect(pt.cyFinal).toEqual(160, 'points[0].cyFinal');
            expect(pt.hidden).toEqual(false, 'points[0].hidden');
            expect(pt.i).toEqual(4, 'points[0].i');
            expect(pt.label).toEqual('4', 'points[0].label');
            expect(pt.largeArc).toEqual(0, 'points[0].largeArc');
            expect(pt.midangle).toEqual(1.0471975511965976, 'points[0].midangle');
            expect(pt.px0).toEqual([0, -60], 'points[0].px0');
            expect(pt.px1).toEqual([51.96152422706632, 29.999999999999986], 'points[0].px1');
            expect(pt.pxmid).toEqual([51.96152422706631, -30.000000000000007], 'points[0].pxmid');
            expect(pt.r).toEqual(60, 'points[0].r');
            expect(typeof pt.t).toEqual(typeof {}, 'points[0].t');
            expect(pt.text).toEqual('33.3%', 'points[0].text');
            expect(typeof pt.trace).toEqual(typeof {}, 'points[0].trace');
            expect(pt.v).toEqual(5, 'points[0].v');
            expect(pt.vTotal).toEqual(15, 'points[0].vTotal');

            var evt = futureData.event;
            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });

    describe('modified click events', function() {
        var clickOpts = {
                altKey: true,
                ctrlKey: true,
                metaKey: true,
                shiftKey: true
            },
            futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1], clickOpts);
            expect(futureData).toBe(undefined);
        });

        it('should contain the correct fields', function() {
            click(pointPos[0], pointPos[1], clickOpts);
            expect(futureData.points.length).toEqual(1);

            var pt = futureData.points[0];
            expect(Object.keys(pt)).toEqual([
                'v', 'label', 'color', 'i', 'hidden', 'vTotal', 'text', 't',
                'trace', 'r', 'cx', 'cy', 'px1', 'pxmid', 'midangle', 'px0',
                'largeArc', 'cxFinal', 'cyFinal'
            ]);
            expect(typeof pt.color).toEqual(typeof '#1f77b4', 'points[0].color');
            expect(pt.cx).toEqual(200, 'points[0].cx');
            expect(pt.cxFinal).toEqual(200, 'points[0].cxFinal');
            expect(pt.cy).toEqual(160, 'points[0].cy');
            expect(pt.cyFinal).toEqual(160, 'points[0].cyFinal');
            expect(pt.hidden).toEqual(false, 'points[0].hidden');
            expect(pt.i).toEqual(4, 'points[0].i');
            expect(pt.label).toEqual('4', 'points[0].label');
            expect(pt.largeArc).toEqual(0, 'points[0].largeArc');
            expect(pt.midangle).toEqual(1.0471975511965976, 'points[0].midangle');
            expect(pt.px0).toEqual([0, -60], 'points[0].px0');
            expect(pt.px1).toEqual([51.96152422706632, 29.999999999999986], 'points[0].px1');
            expect(pt.pxmid).toEqual([51.96152422706631, -30.000000000000007], 'points[0].pxmid');
            expect(pt.r).toEqual(60, 'points[0].r');
            expect(typeof pt.t).toEqual(typeof {}, 'points[0].t');
            expect(pt.text).toEqual('33.3%', 'points[0].text');
            expect(typeof pt.trace).toEqual(typeof {}, 'points[0].trace');
            expect(pt.v).toEqual(5, 'points[0].v');
            expect(pt.vTotal).toEqual(15, 'points[0].vTotal');

            var evt = futureData.event;
            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
            Object.getOwnPropertyNames(clickOpts).forEach(function(opt) {
                expect(evt[opt]).toEqual(clickOpts[opt], 'event.' + opt);
            });
        });
    });

    describe('hover events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_hover', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields', function() {
            mouseEvent('mouseover', pointPos[0], pointPos[1]);

            var point0 = futureData.points[0],
                evt = futureData.event;
            expect(point0).toEqual(evt, 'points');
            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });

    describe('unhover events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_unhover', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields', function() {
            mouseEvent('mouseout', pointPos[0], pointPos[1]);

            var point0 = futureData.points[0],
                evt = futureData.event;
            expect(point0).toEqual(evt, 'points');
            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });
});


describe('Test click interactions on a ternary plot:', function() {
    var mock = require('@mocks/ternary_simple.json');

    var mockCopy, gd;

    var blankPos = [10, 10],
        pointPos;

    beforeAll(function(done) {
        jasmine.addMatchers(customMatchers);

        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            pointPos = getClientPosition('path.point');
            destroyGraphDiv();
            done();
        });
    });

    beforeEach(function() {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
    });

    afterEach(destroyGraphDiv);

    describe('click events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1]);
            expect(futureData).toBe(undefined);
        });

        it('should contain the correct fields', function() {
            click(pointPos[0], pointPos[1]);

            var pt = futureData.points[0],
                evt = futureData.event;

            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'x', 'y',
                'xaxis', 'yaxis'
            ]);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            expect(pt.x).toEqual(undefined, 'points[0].x');
            expect(pt.y).toEqual(undefined, 'points[0].y');
            expect(typeof pt.xaxis).toEqual(typeof {}, 'points[0].xaxis');
            expect(typeof pt.yaxis).toEqual(typeof {}, 'points[0].yaxis');

            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });

    describe('modified click events', function() {
        var clickOpts = {
                altKey: true,
                ctrlKey: true,
                metaKey: true,
                shiftKey: true
            },
            futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1], clickOpts);
            expect(futureData).toBe(undefined);
        });

        it('should contain the correct fields', function() {
            click(pointPos[0], pointPos[1], clickOpts);

            var pt = futureData.points[0],
                evt = futureData.event;

            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'x', 'y',
                'xaxis', 'yaxis'
            ]);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            expect(pt.x).toEqual(undefined, 'points[0].x');
            expect(pt.y).toEqual(undefined, 'points[0].y');
            expect(typeof pt.xaxis).toEqual(typeof {}, 'points[0].xaxis');
            expect(typeof pt.yaxis).toEqual(typeof {}, 'points[0].yaxis');

            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
            Object.getOwnPropertyNames(clickOpts).forEach(function(opt) {
                expect(evt[opt]).toEqual(clickOpts[opt], 'event.' + opt);
            });
        });
    });

    describe('hover events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_hover', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields', function() {
            mouseEvent('mousemove', blankPos[0], blankPos[1]);
            mouseEvent('mousemove', pointPos[0], pointPos[1]);

            var pt = futureData.points[0],
                evt = futureData.event,
                xaxes0 = futureData.xaxes[0],
                xvals0 = futureData.xvals[0],
                yaxes0 = futureData.yaxes[0],
                yvals0 = futureData.yvals[0];

            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'x', 'y',
                'xaxis', 'yaxis'
            ]);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            expect(pt.x).toEqual(undefined, 'points[0].x');
            expect(pt.y).toEqual(undefined, 'points[0].y');
            expect(typeof pt.xaxis).toEqual(typeof {}, 'points[0].xaxis');
            expect(typeof pt.yaxis).toEqual(typeof {}, 'points[0].yaxis');

            expect(xaxes0).toEqual(pt.xaxis, 'xaxes[0]');
            expect(xvals0).toEqual(-0.0016654247744483342, 'xaxes[0]');
            expect(yaxes0).toEqual(pt.yaxis, 'yaxes[0]');
            expect(yvals0).toEqual(0.5013, 'xaxes[0]');

            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });

    describe('unhover events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_unhover', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields', function() {
            mouseEvent('mousemove', blankPos[0], blankPos[1]);
            mouseEvent('mousemove', pointPos[0], pointPos[1]);
            mouseEvent('mouseout', pointPos[0], pointPos[1]);

            var pt = futureData.points[0],
                evt = futureData.event;

            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'x', 'y',
                'xaxis', 'yaxis'
            ]);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            expect(pt.x).toEqual(undefined, 'points[0].x');
            expect(pt.y).toEqual(undefined, 'points[0].y');
            expect(typeof pt.xaxis).toEqual(typeof {}, 'points[0].xaxis');
            expect(typeof pt.yaxis).toEqual(typeof {}, 'points[0].yaxis');

            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });
});


describe('dragbox', function() {

    afterEach(destroyGraphDiv);

    it('should scale subplot and inverse scale scatter points', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/bar_line.json'));

        function assertScale(node, x, y) {
            var scale = Drawing.getScale(node);
            expect(scale.x).toBeCloseTo(x, 1);
            expect(scale.y).toBeCloseTo(y, 1);
        }

        Plotly.plot(createGraphDiv(), mock).then(function() {
            var node = d3.select('rect.nedrag').node();
            var pos = getRectCenter(node);

            assertScale(d3.select('.plot').node(), 1, 1);

            d3.selectAll('.point').each(function() {
                assertScale(this, 1, 1);
            });

            mouseEvent('mousemove', pos[0], pos[1]);
            mouseEvent('mousedown', pos[0], pos[1]);
            mouseEvent('mousemove', pos[0] + 50, pos[1]);

            setTimeout(function() {
                assertScale(d3.select('.plot').node(), 1.14, 1);

                d3.select('.scatterlayer').selectAll('.point').each(function() {
                    assertScale(this, 0.87, 1);
                });
                d3.select('.barlayer').selectAll('.point').each(function() {
                    assertScale(this, 1, 1);
                });

                mouseEvent('mouseup', pos[0] + 50, pos[1]);
                done();
            }, DBLCLICKDELAY / 4);
        });
    });

});
