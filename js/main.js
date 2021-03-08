import * as d3 from "d3";

var sourceFile = "data/n.csv";

// taken from https://stackoverflow.com/a/563442/871585
Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.diffDays = function(date) {
    return Math.ceil((this - date) / (1000 * 60 * 60 * 24))
}


var svgWidth  = 1200;
var svgHeight = 700;

var margin	= {top: 40, right: 40, bottom: 160, left: 80},
    width	= svgWidth - margin.left - margin.right,
    height	= svgHeight - margin.top - margin.bottom;

var contextMargin = {top: 0, right: 40, bottom: 20, left: 20},
    contextWidth = 500 - contextMargin.left - contextMargin.right,
    contextHeight = 40;

var formatDate = d3.timeFormat("%a, %d. %b %Y")
var parseDate = d3.timeParse("%Y-%m-%d")


var forecastDays = 40;
var approxDays = 17;
var approxLag = 2;


var vis = d3.select("#timeline").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

var context = d3.select("#context").append("svg")
    .attr("width", contextWidth + contextMargin.left + contextMargin.right)
    .attr("height", contextHeight + contextMargin.top + contextMargin.bottom)
    .append('g')
    .attr("class", "context")
    .attr("transform", `translate(${contextMargin.left}, ${contextMargin.top})`)

var focus = vis.append("g")
    .attr("class", "focus")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)


var rect = vis.append("rect")
    .attr("class", "pane")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", `translate(${margin.left}, ${margin.top})`)


/* --- */


/* Axis */
const gx1 = focus.append("g")
    .attr("class", "x axis")

const gx2 = focus.append("g")
    .attr("class", "x axis")

const gya = focus.append("g")
    .attr("class", "y axis")

const gyg = focus.append("g")
    .attr("class", "y grid")

/* --- */


/* Data Rows */

const lines = focus.append("g")
    .attr("class", "lines")

const lineMean = lines.append("path")
    .attr("class", "line-mean");

const lineDay = lines.append("path")
    .attr("class", "line-day");

const lineMeanF = lines.append("path")
    .attr("class", "line-mean-f");

const pointsDay = lines.append("g")
    .attr('class', 'points-day')

/* --- */


/* Day Selection Elements */

var labelPosOffsetBottom = height +  33;
var labelLineHeight = 15;
var labelWidth = 50;

var dayFocused = focus.append('g')
    .attr('class', 'dayFocused')

dayFocused.append('line')
    .attr("class", 'down')
    .attr("y2", labelPosOffsetBottom)

dayFocused.append('line')
    .attr("class", 'mean')
    .attr("x1", 0)
    .attr("x2", width)

dayFocused.append('line')
    .attr("class", 'bottom')
    .attr("y1", labelPosOffsetBottom)
    .attr("y2", labelPosOffsetBottom)

dayFocused.append('text')
    .attr("class", 'date')
    .attr("y", labelPosOffsetBottom + labelLineHeight)

dayFocused.append('text')
    .attr("class", 'first')
    .attr("y", labelPosOffsetBottom + labelLineHeight*2)

dayFocused.append('text')
    .attr("class", 'second')
    .attr("y", labelPosOffsetBottom + labelLineHeight*3)

/* --- */


/* Approximation Elements */

var approx = focus.append('g')
    .attr('class', 'approx')

approx.append('line')
    .attr("class", 'down start')
    .attr("y1", 0)
    .attr("y2", height)

approx.append('line')
    .attr("class", 'down end')
    .attr("y1", 0)
    .attr("y2", height)

const handleStart = approx.append('line')
    .attr("class", 'handle start')
    .attr("y1", height)
    .attr("y2", height + 10)

approx.append('line')
    .attr("class", 'handle end')
    .attr("y1", height)
    .attr("y2", height + 10)

/* --- */

d3.csv(sourceFile).then(function(rawData) {
    const baseData = rawData.map(d => {
        return {
            date: parseDate(d.d),
            yd: parseInt(d.n),
            y: parseInt(d.n7)/7,
            v: parseInt(d.n7)/7,
        }
    });

    const extEnd = baseData[baseData.length - 1].date.addDays(forecastDays)

    const dates = d3.timeDays(baseData[0].date, extEnd)
    const d2i = Object.assign({}, ...dates.map((x, i) => ({[x]: i})));

    var calcApprox = function(start = null, end = null) {
        start = start ? start : approxStart;
        end = end ? end : approxEnd;

        var countDays = d3.timeDays(start, end).length;
        if (countDays < 1)
            return;

        approxStart = start;
        approxEnd = end;

        var valueStart = baseData[d2i[approxStart]].y;
        var valueEnd = baseData[d2i[approxEnd]].y;

        var approxR = Math.pow(valueEnd/valueStart, 1/countDays)

        // Create right data format for lines
        extData = baseData.map(a => ({...a}));
        extra = [];
        var approxRp = 1
        d3.timeDays(approxStart, extEnd).forEach(date => {
            let i = d2i[date];
            let entry = null
            let forecast = valueStart * approxRp;
            if (i >= extData.length) {
                entry = {
                    date: date,
                    f: forecast,
                    v: forecast,
                };
            } else {
                entry = extData[i]
                entry.f = forecast;
            }

            extData[i] = entry;
            extra.push(entry);

            approxRp = approxRp*approxR;
        })
    }

    var approxEnd = null;
    var approxStart = null;
    var extra = null;
    var extData = null;

    calcApprox(baseData[baseData.length - 1 - approxLag - approxDays].date, baseData[baseData.length - 1 - approxLag].date)

    //var dataXrange = d3.extent(baseData, function(d) { return d.date; });
    var highestValue = d3.max(baseData, function(d) { return d.yd; });
    var dataXrange = [d3.min(baseData, function(d) { return d.date; }), approxEnd.addDays(forecastDays*2)]

    var x = d3.scaleTime()
        .range([0, width])
        .domain(dataXrange);

    var yScales = {
        linear: d3.scaleLinear()
            .range([height, 0])
            .domain([0, highestValue * 1.05]),
        log: d3.scaleLog()
            .range([height, 0])
            .domain([1, highestValue * 1.2])
    }

    var yScale = yScales.linear;

    var x2 = d3.scaleTime()
        .range([0, contextWidth])
        .domain(dataXrange);

    var y2 = d3.scaleLinear()
        .range([contextHeight, 0])
        .domain([0, highestValue * 1.05]);

    var x2Axis = d3.axisBottom()
        .tickSize(-contextHeight)
        .scale(x2)
        .ticks(8)

    const xAxis = (g, x, name, format = null, padding = 4) => g
        .attr("class", `x axis ${name}`)
        .attr("opacity", 1)
        .call(d3.axisTop(x).tickSize(-(height)).ticks(d3[name], format).tickSizeOuter(0).tickPadding(padding))

    var xScale = x;

    // focus x axis labels


    var ignoreBrushEvent = false;
    var ignoreZoomEvent = false;

    function brushend(event) { ignoreZoomEvent = false; }
    function zoomend(event) { ignoreBrushEvent = false; }

    const brush = d3.brushX()
        .extent([[0,0], [contextWidth, contextHeight]])
        .on("brush", brushed)
        .on("end", brushend)

    const zoom = d3.zoom()
        .scaleExtent([1, 50])
        .extent([[0, 0], [width, height]])
        .translateExtent([[0, -Infinity], [width, Infinity]])
        .on("zoom", zoomed)
        .on("end", zoomend);


    function updateApprox(date) {
        calcApprox(date);
        redraw(xScale);
    }

    function redraw(xz) {
        xScale = xz;
        //var days = (xz.invert(width) - xz.invert(0))/(1000 * 60 * 60 * 24)
        //gx1.attr('opacity', 0)
        //gx2.attr('opacity', 0)
        //if (days > 400) {
            gx1.call(xAxis, xz, 'timeYear', null, 16);
            gx2.call(xAxis, xz, 'timeMonth', "%b");
        //} else {
        //    gx1.call(xAxis, xz, 'timeYear', null, 16);
        //    gx2.call(xAxis, xz, 'timeMonth', "%b %Y");
        //}

        pointsDay.selectAll("circle")
            .attr("cx", function(d) { return xz(d.date); });

        lineMean.datum(baseData)
            .attr("d",  d3.line()
                .x(d => xz(d.date))
                .y(d => yScale(d.y))
                .curve(d3.curveMonotoneX))

        lineDay.datum(baseData)
            .attr("d",  d3.line()
                .x(d => xz(d.date))
                .y(d => yScale(d.yd))
                .curve(d3.curveMonotoneX))

        lineMeanF.datum(extra)
            .attr("d",  d3.line()
                .x(d => xz(d.date))
                .y(d => yScale(d.f))
                .curve(d3.curveMonotoneX))

        let approxStartX = xz(approxStart);
        let approxEndX = xz(approxEnd);

        approx.selectAll('.start')
            .attr('x1', approxStartX)
            .attr('x2', approxStartX)

        approx.selectAll('.end')
            .attr('x1', approxEndX)
            .attr('x2', approxEndX)

        focusEvent()
    }

    function brushed(event) {
        ignoreZoomEvent = true;
        if (ignoreBrushEvent)
            return;

        const xz = x.copy().domain([x2.invert(event.selection[0]), x2.invert(event.selection[1])]);
        redraw(xz);

        var s = xz.domain();
        var s_orig = x2.domain();
        var newS = (s_orig[1]-s_orig[0])/(s[1]-s[0]);
        var t = (s[0]-s_orig[0])/(s_orig[1]-s_orig[0]);
        var trans = width*newS*t;

        var tr = d3.zoomIdentity.translate(-trans,0).scale(newS);
        zoom.transform(rect, tr);
    };

    function zoomed(event) {
        ignoreBrushEvent = true;
        if (ignoreZoomEvent)
            return;

        const xz = event.transform.rescaleX(x);
        redraw(xz);

        brush.move(context.select('.brush'), [x2(xz.invert(0)), x2(xz.invert(width))])
    };

    focus.append("g")
        .attr("class", "x2 axis")
       	.attr("transform", `translate(0, ${height})`)
        .call(d3.axisTop(x).tickValues([]).tickSizeOuter(0))

    var focusEvent = function(d) {
        d = d ? d : dayFocused.datum();
        if (!d)
            return;

        var xc = xScale(d.date);
        var yc = yScale(d.v);

        dayFocused.datum(d)
        dayFocused.select('.down')
            .attr('x1', xc)
            .attr('x2', xc)
            .attr('y1', yc)

        dayFocused.select('.bottom')
            .attr('x1', xc - labelWidth/2)
            .attr('x2', xc + labelWidth/2)

        dayFocused.select('.mean')
            .attr('y1', yc)
            .attr('y2', yc)

        if (false) { // calc intersection dates
            let lower = extData.map(t => t.v <= d.v);
            let higher = extData.map(t => t.v > d.v);

            let ddd = dates.slice(0, -1).filter((e, i) => {
                return (lower[i] == higher[i+1] && e != d.date);
            })

            console.log(ddd.map(d => d3.timeFormat("%Y-%m-%d")(d)))
        }

        dayFocused.select('.date')
            .attr('x', xc)
            .text(formatDate(d.date))

        dayFocused.select('.first')
            .attr('x', xc)
            .text(`Mean Count (last 7 days): ${d3.format(".0f")(d.y)}`)

        if (d.f) {
            dayFocused.select('.second')
                .attr('x', xc)
                .text(`Estimation: ${d3.format(".0f")(d.f)}`)
        } else {
            dayFocused.select('.second')
                .text('')
        }
    }

    pointsDay
        .selectAll("circle")
        .data(baseData)
        .enter().append("circle")
        .attr("cy", function(d) { return yScale(d.yd); })

    context.append("path")
        .attr('class', 'line')
        .datum(baseData)
        .attr("d",  d3.line()
            .x(d => x2(d.date))
            .y(d => y2(d.y)))

    context.append("g")
        .attr("class", "x2 axis")
        .attr("transform", `translate(0, ${contextHeight})`)
        .call(x2Axis);

    context.append("g")
        .attr("class", "x2 axis")
        .call(d3.axisBottom(x2).tickValues([]).tickSizeOuter(0))

    context.append("g")
        .attr("class", "x brush")
        .call(brush)

    rect.call(zoom).on("mousemove", function(event) {
        // var d = xScale.invert(event.x)
        var d = xScale.invert(event.offsetX - margin.left)
        //console.log(d)
        var dsi = d3.bisectCenter(dates, d)
        // console.log(extData[dsi])
        focusEvent(extData[dsi])
    });

    function dragged(event, d) {
        var dsi = d3.bisectCenter(dates, xScale.invert(event.x))
        updateApprox(dates[dsi])
        //d3.select(this).raise().attr("cx", d.x = event.x).attr("cy", d.y = event.y);
    }

    handleStart
        .on('click', event => { if (event.defaultPrevented) return; })
        .call(d3.drag().on("drag", dragged));

    const yAxis = (g, y) => g
        .call(d3.axisLeft()
            .ticks(5)
            .scale(y))
            //.tickFormat(d3.format(",.0f")))
    //    .call(g => g.select(".domain").remove())

    const yGrid = (g, y) => g
        .call(d3.axisLeft()
            .scale(y)
            .ticks(5)
            .tickSize(-width)
            .tickFormat(''))
    //    .call(g => g.select(".domain").remove())

    gya.call(yAxis, yScale)
    gyg.call(yGrid, yScale)

    d3.selectAll("#buttons input").on("change", event => {
        yScale = yScales[event.target.value];
        pointsDay
            .selectAll("circle")
            .attr("cy", function(d) { return yScale(d.yd); });
        gya.call(yAxis, yScale)
        gyg.call(yGrid, yScale)
        redraw(xScale);
    });

    // init with view params
    brush.move(context.select('.brush'), [x2(parseDate('2020-10-20')), x2(approxEnd.addDays(forecastDays))])
    focusEvent(extData[extData.length - forecastDays])
});
