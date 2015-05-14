/**
 * Draggable points plugin
 * Author: Torstein Honsi
 * License: MIT License
 *
 */
 (function (Highcharts) {

        var addEvent = Highcharts.addEvent,
            each = Highcharts.each,
            pick = Highcharts.pick;

        /**
         * Filter by dragMin and dragMax
         */
        function filterRange(newY, series, XOrY) {
            var options = series.options,
                dragMin = pick(options['dragMin' + XOrY], undefined),
                dragMax = pick(options['dragMax' + XOrY], undefined);

            if (newY < dragMin) {
                newY = dragMin;
            } else if (newY > dragMax) {
                newY = dragMax;
            }
            return newY;
        }

        Highcharts.Chart.prototype.callbacks.push(function (chart) {

            var container = chart.container,
                dragPoint,
                dragX,
                dragY,
                dragPlotX,
                dragPlotY;

            function mouseDown(e) {
                var hoverPoint = chart.hoverPoint,
                    options,
                    originalEvent = e.originalEvent || e;

                if (hoverPoint) {
                    if (hoverPoint.options.draggableX != undefined && hoverPoint.options.draggableY != undefined){
                        options = hoverPoint.options
                    }
                    else {
                        options = hoverPoint.series.options;
                    }

                    if (options.draggableX) {
                        dragPoint = hoverPoint;
                        dragX = originalEvent.changedTouches ? originalEvent.changedTouches[0].pageX : e.pageX;
                        dragPlotX = dragPoint.plotX;
                    }

                    if (options.draggableY) {
                        dragPoint = hoverPoint;

                        dragY = originalEvent.changedTouches ? originalEvent.changedTouches[0].pageY : e.pageY;
                        dragPlotY = dragPoint.plotY + (chart.plotHeight - (dragPoint.yBottom || chart.plotHeight));
                    }

                    // Disable zooming when dragging
                    if (dragPoint) {
                        chart.mouseIsDown = false;
                    }
                    

                    
                }
            }

            function mouseMove(e) {
                e.preventDefault();

                if (dragPoint) {
                    if (dragPoint.options.draggableX != undefined && dragPoint.options.draggableY != undefined){
                        draggableX = dragPoint.options.draggableX;
                        draggableY = dragPoint.options.draggableY;
                    }
                    else {
                        draggableX = dragPoint.series.options.draggableX;
                        draggableY = dragPoint.series.options.draggableY;
                    } 

                    var originalEvent = e.originalEvent || e,
                        pageX = originalEvent.changedTouches ? originalEvent.changedTouches[0].pageX : e.pageX,
                        pageY = originalEvent.changedTouches ? originalEvent.changedTouches[0].pageY : e.pageY,
                        deltaY = dragY - pageY,
                        deltaX = dragX - pageX,
                        draggableX = draggableX,
                        draggableY = draggableY,
                        series = dragPoint.series,
                        isScatter = series.type === 'bubble' || series.type === 'scatter',
                        newPlotX = isScatter ? dragPlotX - deltaX : dragPlotX - deltaX - dragPoint.series.xAxis.minPixelPadding,
                        newPlotY = chart.plotHeight - dragPlotY + deltaY,
                        newX = dragX === undefined ? dragPoint.x : dragPoint.series.xAxis.translate(newPlotX, true),
                        newY = dragY === undefined ? dragPoint.y : dragPoint.series.yAxis.translate(newPlotY, true),
                        proceed;

                    
                    newX = filterRange(newX, series, 'X');
                    newY = filterRange(newY, series, 'Y');

                    //Check if dragPoint is allowed to be dragged pass its neighbors
                    if (dragPoint.series.options.pointsCanSwitchPlaces != undefined && !dragPoint.series.options.pointsCanSwitchPlaces){
                        points = dragPoint.series.points
                        var index = points.indexOf(dragPoint)

                        //Getting the closest left neighbor and checks if the dragPoint is dragged passed the left neighbor
                        if (index != 0) {
                            var pointBeforeDragPoint = points[index - 1]
                            if (pointBeforeDragPoint){
                                if (newX <= pointBeforeDragPoint.x){
                                    newX = pointBeforeDragPoint.x
                                }
                            }
                        }

                        //Getting the closest right neighbor and checks if the dragPoint is dragged passed the right neighbor
                        if (index != points.length){
                            var pointAfterDragPoint = points[index + 1]
                            if (pointAfterDragPoint){
                                if (newX >= pointAfterDragPoint.x){
                                    newX = pointAfterDragPoint.x
                                }
                            }
                        }                        
                    }
                    

                    // Fire the 'drag' event with a default action to move the point.
                    dragPoint.firePointEvent(
                        'drag', {
                            newX: draggableX ? newX : dragPoint.x,
                            newY: draggableY ? newY : dragPoint.y
                        }, function () {
                            proceed = true;

                            dragPoint.update({
                                x: draggableX ? newX : dragPoint.x,
                                y: draggableY ? newY : dragPoint.y
                            }, false);

                            // Hide halo while dragging (#14)
                            if (series.halo) {
                                series.halo = series.halo.destroy();
                            }

                            if (chart.tooltip) {
                                chart.tooltip.refresh(chart.tooltip.shared ? [dragPoint] : dragPoint);
                            }
                            if (series.stackKey) {
                                chart.redraw();
                            } else {
                                series.redraw();
                            }
                        }
                    );
                    // The default handler has not run because of prevented default
                    if (!proceed) {
                        drop();
                    }
                    
                }
            }

            function drop(e) {

                if (dragPoint) {
                    if (dragPoint.options.draggableX != undefined && dragPoint.options.draggableY != undefined){
                        draggableX = dragPoint.options.draggableX;
                        draggableY = dragPoint.options.draggableY;
                    }
                    else {
                        draggableX = dragPoint.series.options.draggableX;
                        draggableY = dragPoint.series.options.draggableY;
                    } 

                    if (e) {
                        var originalEvent = e.originalEvent || e,
                            pageX = originalEvent.changedTouches ? originalEvent.changedTouches[0].pageX : e.pageX,
                            pageY = originalEvent.changedTouches ? originalEvent.changedTouches[0].pageY : e.pageY,
                            draggableX = draggableX,
                            draggableY = draggableY,
                            deltaX = dragX - pageX,
                            deltaY = dragY - pageY,
                            series = dragPoint.series,
                            isScatter = series.type === 'bubble' || series.type === 'scatter',
                            newPlotX = isScatter ? dragPlotX - deltaX : dragPlotX - deltaX - dragPoint.series.xAxis.minPixelPadding,
                            newPlotY = chart.plotHeight - dragPlotY + deltaY,
                            newX = dragX === undefined ? dragPoint.x : dragPoint.series.xAxis.translate(newPlotX, true),
                            newY = dragY === undefined ? dragPoint.y : dragPoint.series.yAxis.translate(newPlotY, true);

                        newX = filterRange(newX, series, 'X');
                        newY = filterRange(newY, series, 'Y');

                        // Set newX to same value as pointBeforeDragPoint/pointAfterDragPoint to remove any potential glitches
                        if (!dragPoint.series.options.pointsCanSwitchPlaces) {
                            var index = points.indexOf(dragPoint)
                            if (index != points.length){
                                var pointBeforeDragPoint = points[index - 1]
                                if (pointBeforeDragPoint && newX <= pointBeforeDragPoint.x) {
                                    //Adding a small constant so it's easier to move the point afterwards
                                    newX = pointBeforeDragPoint.x + 0.01
                                }
                            }

                            if (index != points.length){
                                var pointAfterDragPoint = points[index + 1]
                                if (pointAfterDragPoint && newX >= pointAfterDragPoint.x) {
                                    //Subtracting a small constant so it's easier to move the point afterwards
                                    newX = pointAfterDragPoint.x - 0.01
                                }
                            }                        
                        }

                        dragPoint.update({
                            x: draggableX ? newX : dragPoint.x,
                            y: draggableY ? newY : dragPoint.y
                        });
                    }
                    dragPoint.firePointEvent('drop');
                }
                dragPoint = dragX = dragY = undefined;
            }


            // Kill animation (why was this again?)
            chart.redraw(); 

            // Add'em
            addEvent(container, 'mousemove', mouseMove);
            addEvent(container, 'touchmove', mouseMove);
            addEvent(container, 'mousedown', mouseDown);
            addEvent(container, 'touchstart', mouseDown);
            addEvent(document, 'mouseup', drop);
            addEvent(document, 'touchend', drop);
            addEvent(container, 'mouseleave', drop);
        });

        /**
         * Extend the column chart tracker by visualizing the tracker object for small points
         */
        Highcharts.wrap(Highcharts.seriesTypes.column.prototype, 'drawTracker', function (proceed) {
            var series = this,
                options = series.options;
            proceed.apply(series);

            if (options.draggableX || options.draggableY) {

                each(series.points, function (point) {


                    point.graphic.attr(point.shapeArgs.height < 3 ? {
                        'stroke': 'black',
                            'stroke-width': 2,
                            'dashstyle': 'shortdot'
                    } : {
                        'stroke-width': series.options.borderWidth,
                            'dashstyle': series.options.dashStyle || 'solid'
                    });
                });
            }
        });

    })(Highcharts);
