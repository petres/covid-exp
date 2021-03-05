import * as d3 from "d3";

var sourceFile = "data/n.csv";

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
var svgWidth  = 1200;
var svgHeight = 800;

var margin	= {top: 40, right: 40, bottom: 200, left: 80},
    width	= svgWidth - margin.left - margin.right,
    height	= svgHeight - margin.top - margin.bottom;

var contextMargin = {top: 40, right: 40, bottom: 20, left: 40},
    contextWidth = 500 - contextMargin.left - contextMargin.right,
    contextHeight = 40;

var formatDate = d3.timeFormat("%a, %d. %b %Y")
var parseDate = d3.timeParse("%Y-%m-%d")


var vis = d3.select("#timeline").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

var context = d3.select("#context").append("svg")
    .attr("width", contextWidth + contextMargin.left + contextMargin.right)
    .attr("height", contextHeight + contextMargin.top + contextMargin.bottom)
    .append('g')
    .attr("class", "context")
    .attr("transform", `translate(${contextMargin.left}, ${contextMargin.top})`)

var rect = vis.append("rect")
    .attr("class", "pane")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", `translate(${margin.left}, ${margin.top})`)

var focus = vis.append("g")
    .attr("class", "focus")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)

// focus.append("rect")
//     .attr("class", "op")
//     .attr("width", margin.left)
//     .attr("height", height)
//     .attr("fill", 'white')
//     .attr("opacity", 0.5)
//     .attr("transform", `translate(-${margin.left}, 0)`);

var eventFocused = focus.append('g')
    .attr('class', 'eventFocused')

eventFocused.append('line')
    .attr("class", 'down')
    .attr("y2", height + 23)

eventFocused.append('line')
    .attr("class", 'mean')
    .attr("x1", 0)
    .attr("x2", width)

eventFocused.append('line')
    .attr("class", 'bottom')
    .attr("y1", height + 23)
    .attr("y2", height + 23)

eventFocused.append('text')
    .attr("class", 'date')
    .attr("y", height + 40)
    .style('text-anchor', 'middle')

eventFocused.append('text')
    .attr("class", 'first')
    .attr("y", height + 60)
    .style('text-anchor', 'middle')

eventFocused.append('text')
    .attr("class", 'second')
    .attr("y", height + 80)
    .style('fill', 'red')
    .style('text-anchor', 'middle')

eventFocused.append('text')
    .attr("class", 'third')
    .attr("y", height + 100)
    .style('text-anchor', 'middle')


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


const handle_start = approx.append('line')
    .attr("class", 'handle start')
    .attr("y1", height)
    .attr("y2", height + 10)

approx.append('line')
    .attr("class", 'handle end')
    .attr("y1", height)
    .attr("y2", height + 10)



d3.csv(sourceFile).then(function(dataset) {
    dataset.forEach(d => {
        d.date = parseDate(d.d);
        d.yd = parseInt(d.n);
        d.y = parseInt(d.n7)/7;
        d.v = d.y
    });

    var full = Object.assign({}, ...dataset.map((x) => ({[x.date]: x})));

    var t_p = 17
    var t_o = 2

    var t_e = dataset[dataset.length - 1 - t_o]
    var t_s = dataset[dataset.length - 1 - t_o - t_p]

    var t_g = Math.pow(t_e.y/t_s.y, 1/t_p)



    var extra = d3.timeDays(t_s.date, t_e.date.addDays(49)).map((d, i) => {
        let v = t_s.y * Math.pow(t_g, i)
        return {
            date: d,
            p: v,
            v: v
        }
    })

    extra.forEach(d => {
        if (d.date in full) {
            full[d.date].p = d.p
        } else {
            full[d.date] = d
        }
    });

    // var dates = dataset.map(d => d.date)
    //var bisectDate = d3.bisector(function(d) { return d.date; }).center;


    full = Object.entries(full).map(d => d[1]).sort((a, b) => a.date - b.date)
    //console.log(full)

    var dates = full.map(d => d.date)


    //var dataXrange = d3.extent(dataset, function(d) { return d.date; });
    var dataYrange = [0, d3.max(dataset, function(d) { return d.yd; })*1.05];
    var dataXrange = [d3.min(dataset, function(d) { return d.date; }), parseDate("2021-05-01")]

    var x = d3.scaleTime()
        .range([0, width])
        .domain(dataXrange);

    var y = d3.scaleLinear()
        .range([height, 0])
        .domain(dataYrange);



    var yAxis = d3.axisLeft()
        .scale(y);

    var x2 = d3.scaleTime()
        .range([0, contextWidth])
        .domain(dataXrange);

    var y2 = d3.scaleLinear()
        .range([contextHeight, 0])
        .domain(y.domain());

    var x2Axis = d3.axisBottom()
        .tickSize(-contextHeight)
        .scale(x2)
        .ticks(8)


    const xAxis = (g, x, name, format = null, padding = 4) => g
        .attr("class", `x axis ${name}`)
        .attr("opacity", 1)
        .call(d3.axisTop(x).tickSize(-(height)).ticks(d3[name], format).tickSizeOuter(0).tickPadding(padding))

    //    .call(d3.axisTop(x).tickSize(-(height)).ticks(4).tickSizeOuter(0).tickPadding(6))
    var xScale = x;


    const gx1 = focus.append("g")
    const gx2 = focus.append("g")

    var xScale = x;


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


    function redraw(xz) {
        xScale = xz;
        var days = (xz.invert(width) - xz.invert(0))/(1000 * 60 * 60 * 24)

        gx1.attr('opacity', 0)
        gx2.attr('opacity', 0)

        if (days > 1000) {
            gx1.call(xAxis, xz, 'timeYear');
        } else if (days > 700) {
            gx1.call(xAxis, xz, 'timeYear');
            gx2.call(xAxis, xz, 'timeMonth', "");
        } else if (days > 400) {
            gx1.call(xAxis, xz, 'timeYear', null, 16);
            gx2.call(xAxis, xz, 'timeMonth', "%b");
        } else {
            gx1.call(xAxis, xz, 'timeYear', null, 16);
            gx2.call(xAxis, xz, 'timeMonth', "%b %Y");
        }

        // focus.select("g.weekly").selectAll("circle")
        //     .data(dataset)
        //     .attr("cx", function(d) { return xz(d.date); });

        focus.select("g.daily").selectAll("circle")
            .attr("cx", function(d) { return xz(d.date); });

        line.datum(dataset)
            .attr("d",  d3.line()
                .x(d => xz(d.date))
                .y(d => y(d.y))
                .curve(d3.curveMonotoneX))

        lineD.datum(dataset)
            .attr("d",  d3.line()
                .x(d => xz(d.date))
                .y(d => y(d.yd))
                .curve(d3.curveMonotoneX))

        extraLine.datum(extra)
            .attr("d",  d3.line()
                .x(d => xz(d.date))
                .y(d => y(d.p))
                .curve(d3.curveMonotoneX))

        approx.selectAll('.start')
            .attr('x1', xz(t_s.date))
            .attr('x2', xz(t_s.date))

        approx.selectAll('.end')
            .attr('x1', xz(t_e.date))
            .attr('x2', xz(t_e.date))

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
        if (!d)
            d = eventFocused.datum();

        if (!d)
            return;

        var xc = xScale(d.date);

        var yc = y(d.v);


        eventFocused.datum(d)
        eventFocused.select('.down')
            .attr('x1', xc)
            .attr('x2', xc)
            .attr('y1', yc)

        var size = 100

        eventFocused.select('.bottom')
            .attr('x1', xc - size/2)
            .attr('x2', xc + size/2)

        eventFocused.select('.mean')
            .attr('y1', yc)
            .attr('y2', yc)

        let lower = full.map(t => t.v <= d.v);
        let higher = full.map(t => t.v > d.v);

        let ddd = dates.slice(0, -1).filter((e, i) => {
            return (lower[i] == higher[i+1] && e != d.date);
        })

        
        console.log(ddd)




        eventFocused.select('.date')
            .attr('x', xc)
            .text(formatDate(d.date))


        eventFocused.select('.first')
            .attr('x', xc)
            .text(`Mean Count (last 7 days): ${d3.format(".0f")(d.y)}`)

        if (d.p) {
            var text = d.y ? 'Interpolation' : 'Extrapolation';
            eventFocused.select('.second')
                .attr('x', xc)
                .text(`${text}: ${d3.format(".0f")(d.p)}`)
        } else {
            eventFocused.select('.second')
                .text('')
        }

        // eventFocused.select('.third')
        //     .attr('x', xc)
        //     .text(`Count: ${d3.format(".0f")(d.yd)}`)


        eventFocused.style("opacity", .9);
        //
        // eventFocused
        //     .transition()
        //         .duration(200)
        //         .style("opacity", .9);
    }

    var defocusEvent = function() {
        // eventFocused
        //     .transition()
        //         .duration(200)
        //         .style("opacity", 0);
    }

    focus.append("g")
        .attr('class', 'daily')
        .selectAll("circle")
        .data(dataset)
        .enter().append("circle")
        .attr("cy", function(d) { return y(d.yd); })

    focus.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .call(g => g.select(".domain").remove())

    focus.append("g")
        .attr("class", "y grid")
        .call(d3.axisLeft()
            .scale(y).tickSize(-width).tickFormat(''))

    context.append("path")
        .attr('class', 'line')
        .datum(dataset)
        .attr("d",  d3.line()
            .x(d => x2(d.date))
            .y(d => y2(d.y)))


    context.append("g")


    var line = focus.append("path")
        .attr("fill", "none")
        .attr("class", "line");

    var lineD = focus.append("path")
        .attr("fill", "none")
        .attr("class", "lined");

    var extraLine = focus.append("path")
        .attr("fill", "none")
        .attr("class", "extra")
        .attr("stroke", 'red')
        .attr("stroke-width", 1)

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

    rect.call(zoom).on("mousemove", function(e) {
        var d = xScale.invert(e.offsetX - margin.left)
        //console.log(d)
        var dsi = d3.bisectCenter(dates, d)
        focusEvent(full[dsi])
    });


    handle_start.on('click', e => {console.log('clicked')})

    brush.move(context.select('.brush'), [x2(parseDate('2020-10-20')), x2(parseDate('2021-05-01'))])

    focusEvent(full[full.length - 49])
});
