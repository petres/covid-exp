import d3 from "./d3";

const sourceFile = "data/n.csv";

// taken from https://stackoverflow.com/a/563442/871585
Date.prototype.addDays = function(days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.diffDays = function(date) {
    return Math.ceil((this - date) / (1000 * 60 * 60 * 24))
}

// const svgWidth  = 1200;
const svgWidth  = window.innerWidth > 1200 ? window.innerWidth : 1200;

const svgHeight = 600;

const margin = {top: 60, right: 120, bottom: 90, left: 120},
      width	 = svgWidth - margin.left - margin.right,
      height = svgHeight - margin.top - margin.bottom;

const contextMargin = {top: 0, right: 0, bottom: 20, left: 20},
      contextWidth = 500 - contextMargin.left - contextMargin.right,
      contextHeight = 40;

const formatDate = d3.timeFormat("%a, %d. %b %Y")
const parseDate = d3.timeParse("%Y-%m-%d")


const forecastDays = 30;
const approxDays = 44;
const approxLag = 4;


const vis = d3.select("#timeline").append("svg")
    .attr("id", "t-svg")
    //.attr("width", width + margin.left + margin.right)
    .attr("width", '100%')
    .attr("height", height + margin.top + margin.bottom)


const context = d3.select("#context").append("svg")
    //.attr("width", '100%')
    .attr("width", contextWidth + contextMargin.left + contextMargin.right)
    .attr("height", contextHeight + contextMargin.top + contextMargin.bottom)
    .append('g')
    .attr("class", "context")
    .attr("transform", `translate(${contextMargin.left}, ${contextMargin.top})`)

const focus = vis.append("g")
    .attr("class", "focus")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)


const rect = vis.append("rect")
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

const gx3 = focus.append("g")
    .attr("class", "x axis")

const gya = focus.append("g")
    .attr("class", "y axis cases")

const gya_i = focus.append("g")
    .attr("class", "y axis incidence")
//    .attr("transform", `translate(-60, 0)`);

const gy2a = focus.append("g")
    .attr("class", "y axis growth")
    .attr("transform", `translate(${width}, 0)`);

const gyg = focus.append("g")
    .attr("class", "y grid")



// text label for the y axis
focus.append("g")
    .attr("class", "y axis cases")
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", 0 - (height / 2))
    .style("text-anchor", "middle")
    .text("Cases");

focus.append("g")
    .attr("class", "y axis incidence")
    .append("text")
    .attr("transform", "rotate(90)")
    .attr("y", -40)
    .attr("x", (height / 2))
    .style("text-anchor", "middle")
    .text("7-Day-Incidence");


focus.append("g")
    .attr("class", "y axis growth")
    .append("text")
    .attr("transform", "rotate(90)")
    .attr("y", -(width + 40))
    .attr("x", (height / 2))
    .style("text-anchor", "middle")
    .text("Mean Daily Growthrate");
/* --- */


/* Data Rows */

// focus
const lines = focus.append("g")
    .attr("class", "lines")

const lineMeanF = lines.append("path")
    .attr("class", "line-mean-f");

const lineMean = lines.append("path")
    .attr("class", "line-mean");

const lineGrowth = lines.append("path")
    .attr("class", "line-growth");

const lineGrowth1 = lines.append("line")
    .attr("class", "line-growth-1")
    .attr("x1", 0)
    .attr("x2", width);

const lineGrowthF = lines.append("line")
    .attr("class", "line-growth-f");

const lineDay = lines.append("path")
    .attr("class", "line-day");

const pointsDay = lines.append("g")
    .attr('class', 'points-day')

// context
const contextLines = context.append("g")
    .attr("class", "lines")

const contextLineMeanF = contextLines.append("path")
    .attr('class', 'line-mean-f')

const contextLineMean = contextLines.append("path")
    .attr('class', 'line-mean')



/* --- */


/* Day Selection Elements */

const labelPosOffsetBottom = height + 20;
const labelLineHeight = 15;
const labelWidth = 50;

const dayFocused = focus.append('g')
    .attr('class', 'dayFocused')

dayFocused.append('line')
    .attr("class", 'down')
    .attr("y1", 0)
    .attr("y2", labelPosOffsetBottom)

dayFocused.append('line')
    .attr("class", 'left')
    .attr("x1", 0)

dayFocused.append('line')
    .attr("class", 'right')
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

dayFocused.append('text')
    .attr("class", 'third')
    .attr("y", labelPosOffsetBottom + labelLineHeight*4)
/* --- */


/* Approximation Elements */

const approx = focus.append('g')
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
    .attr("y2", height + 15)

const handleEnd = approx.append('line')
    .attr("class", 'handle end')
    .attr("y1", height)
    .attr("y2", height + 15)

/* --- */

d3.csv(sourceFile).then(function(rawData) {
    const baseData = rawData.map(d => {
        return {
            date: parseDate(d.d),
            y_day: parseInt(d.n),
            y: parseFloat(d.n7),
            v: parseFloat(d.n7),
            i: parseFloat(d.n7)*7/parseInt(d.p)*100000,
            p: parseInt(d.p),
            g: d.n7g == 'Inf' ? Infinity : parseFloat(d.n7g),
        }
    });

    const extEnd = baseData[baseData.length - 1].date.addDays(forecastDays)

    const dates = d3.timeDays(baseData[0].date, extEnd)
    const d2i = Object.assign({}, ...dates.map((x, i) => ({[x]: i})));

    const calcApprox = function(start = null, end = null) {
        start = start ? start : approxStart;
        end = end ? end : approxEnd;

        const countDays = d3.timeDays(start, end).length;
        if (countDays < 1)
            return;

        if (!(end in d2i && d2i[end] in baseData))
            return;

        approxStart = start;
        approxEnd = end;

        const valueStart = baseData[d2i[approxStart]].y;
        const valueEnd = baseData[d2i[approxEnd]].y;

        approxR = Math.pow(valueEnd/valueStart, 1/countDays)

        // Create right data format for lines
        extData = baseData.map(a => ({...a}));
        extra = [];
        let approxRp = 1
        d3.timeDays(approxStart, extEnd).forEach(date => {
            let i = d2i[date];
            let entry = null
            let forecast = valueStart * approxRp;
            if (i >= extData.length) {
                entry = {
                    date: date,
                    f_v: forecast,
                    v: forecast,
                    p: extData[extData.length - 1].p
                };
            } else {
                entry = extData[i]
                entry.f_v = forecast;
            }

            entry.f_i = entry.f_v*7/entry.p*100000,

            extData[i] = entry;
            extra.push(entry);

            approxRp = approxRp*approxR;
        })
    }

    let approxEnd = null;
    let approxStart = null;
    let extra = null;
    let extData = null;
    let approxR = null;



    // calcApprox(parseDate("2021-02-09"), parseDate("2021-03-23"))
    calcApprox(parseDate("2021-07-06"), parseDate("2021-07-12"))
    //calcApprox(baseData[baseData.length - 1 - approxLag - approxDays].date, baseData[baseData.length - 1 - approxLag].date)

    //const dataXrange = d3.extent(baseData, function(d) { return d.date; });
    const highestValue = d3.max(baseData, function(d) { return d.y_day; });
    const dataXrange = [d3.min(baseData, function(d) { return d.date; }), d3.max(baseData, function(d) { return d.date; }).addDays(forecastDays)]
    // console.log(d3.max(baseData, function(d) { return d.date; }).addDays(forecastDays))

    const x = d3.scaleTime()
        .range([0, width])
        .domain(dataXrange);

    const yScales = {
        linear: d3.scaleLinear()
            .range([height, 0])
            .domain([0, highestValue * 1.05]),
        log: d3.scaleLog()
            .range([height, 0])
            .domain([1, highestValue * 2])
    }

    let yScale = yScales.log;

    let growhtF = 1.21;
    const y2 = d3.scaleLog()
        .range([height, 0])
        .domain([1/growhtF, growhtF]);

    lineGrowth1.attr('y1', y2(1))
        .attr('y2', y2(1))

    const xContext = d3.scaleTime()
        .range([0, contextWidth])
        .domain(dataXrange);

    const yContext = d3.scaleLinear()
        .range([contextHeight, 0])
        .domain([0, highestValue * 1.05]);

    const xContextAxis = d3.axisBottom()
        .tickSize(-contextHeight)
        .scale(xContext)
        .ticks(5)

    const xAxis = (g, x, name, format = null, padding = 4) => g
        .attr("class", `x axis ${name}`)
        .style("opacity", 1)
        .call(d3.axisTop(x).tickSize(-(height)).ticks(d3[name], format).tickSizeOuter(0).tickPadding(padding))

    const y2Axis = d3.axisRight(y2)
        .ticks(10, v => d3.format(".0%")(v - 1));

    gy2a.call(y2Axis)
        .call(g => g.select(".domain").remove())

    let xScale = x;

    // focus x axis labels
    let ignoreBrushEvent = false;
    let ignoreZoomEvent = false;

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

    function redrawContextApprox() {
        contextLineMeanF.datum(extra)
            .attr("d",  d3.line()
                .x(d => xContext(d.date))
                .y(d => yContext(d.f_v))
                .curve(d3.curveMonotoneX))
    }

    function redraw(xz) {
        xScale = xz;
        let days = xz.invert(width).diffDays(xz.invert(0));

        if (days > 300) {
            gx1.call(xAxis, xz, 'timeYear', null, 16);
            gx2.call(xAxis, xz, 'timeMonth', "%b");
            gx3.style("opacity", 0)
        } else {
            gx1.call(xAxis, xz, 'timeMonth', "%b", 16);
            gx2.call(xAxis, xz, 'timeWeek', "%d");
            gx3.call(xAxis, xz, 'timeYear', "");
        }

        pointsDay.selectAll("circle")
            .attr("cx", function(d) { return xz(d.date); });

        lineMean.datum(baseData)
            .attr("d",  d3.line()
                .x(d => xz(d.date))
                .y(d => yScale(d.y))
                .curve(d3.curveMonotoneX))

        // console.log(baseData)
        lineGrowth.datum(baseData.filter(d => d.g))
            .attr("d",  d3.line()
                .x(d => xz(d.date))
                .y(d => y2(d.g))
                .curve(d3.curveMonotoneX))

        lineGrowthF
            .attr("x1", xz(approxStart))
            .attr("x2", xz(extEnd))
            .attr("y1", y2(approxR))
            .attr("y2", y2(approxR))

        lineDay.datum(baseData)
            .attr("d",  d3.line()
                .x(d => xz(d.date))
                .y(d => yScale(d.y_day))
                .curve(d3.curveMonotoneX))

        lineMeanF.datum(extra)
            .attr("d",  d3.line()
                .x(d => xz(d.date))
                .y(d => yScale(d.f_v))
                .curve(d3.curveMonotoneX))

        const approxStartX = xz(approxStart);
        const approxEndX = xz(approxEnd);

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

        const xz = x.copy().domain([xContext.invert(event.selection[0]), xContext.invert(event.selection[1])]);
        redraw(xz);

        const s = xz.domain();
        const s_orig = xContext.domain();
        const newS = (s_orig[1]-s_orig[0])/(s[1]-s[0]);
        const t = (s[0]-s_orig[0])/(s_orig[1]-s_orig[0]);
        const trans = width*newS*t;

        const tr = d3.zoomIdentity.translate(-trans,0).scale(newS);
        zoom.transform(rect, tr);
    };

    function zoomed(event) {
        ignoreBrushEvent = true;
        if (ignoreZoomEvent)
            return;

        const xz = event.transform.rescaleX(x);
        redraw(xz);

        brush.move(context.select('.brush'), [xContext(xz.invert(0)), xContext(xz.invert(width))])
    };

    focus.append("g")
        .attr("class", "x2 axis")
       	.attr("transform", `translate(0, ${height})`)
        .call(d3.axisTop(x).tickValues([]).tickSizeOuter(0))

    const focusEvent = function(d) {
        d = d ? d : dayFocused.datum();
        if (!d)
            return;

        const xc = xScale(d.date);
        const yc = yScale(d.v);



        dayFocused.datum(d)
        dayFocused.select('.down')
            .attr('x1', xc)
            .attr('x2', xc)

        dayFocused.select('.bottom')
            .attr('x1', xc - labelWidth/2)
            .attr('x2', xc + labelWidth/2)

        dayFocused.select('.left')
            .attr('x2', xc)
            .attr('y1', yc)
            .attr('y2', yc)

        dayFocused.select('.right').style('visibility', 'hidden')
        if (d.g) {
            const y2c = y2(d.g);
            dayFocused.select('.right')
                .style('visibility', 'visible')
                .attr('x1', xc)
                .attr('y1', y2c)
                .attr('y2', y2c)
        }

        if (false) { // calc intersection dates
            const lower = extData.map(t => t.v <= d.v);
            const higher = extData.map(t => t.v > d.v);

            const ddd = dates.slice(0, -1).filter((e, i) => {
                return (lower[i] == higher[i+1] && e != d.date);
            })

            console.log(ddd.map(d => d3.timeFormat("%Y-%m-%d")(d)))
        }

        dayFocused.select('.date')
            .attr('x', xc)
            .text(formatDate(d.date))

        dayFocused.select('.first')
            .attr('x', xc)
            .text(`Count: ${d.y_day} | Mean Count (7 days): ${d3.format(".0f")(d.y)}`)

        dayFocused.select('.second')
            .attr('x', xc)
            .text(`7-Day Incidence: ${d3.format(".2f")(d.i)}`)

        if (d.f_v) {
            dayFocused.select('.third')
                .attr('x', xc)
                .text(`Estimation: ${d3.format(".0f")(d.f_v)} | ${d3.format(".2f")(d.f_i)}`)
        } else {
            dayFocused.select('.third')
                .text('')
        }
    }

    pointsDay
        .selectAll("circle")
        .data(baseData)
        .enter().append("circle")
        .attr("cy", function(d) { return yScale(d.y_day); })

    contextLineMean
        .datum(baseData)
        .attr("d",  d3.line()
            .x(d => xContext(d.date))
            .y(d => yContext(d.y)))

    redrawContextApprox();

    context.append("g")
        .attr("class", "x2 axis")
        .attr("transform", `translate(0, ${contextHeight})`)
        .call(xContextAxis);

    context.append("g")
        .attr("class", "x2 axis")
        .call(d3.axisBottom(xContext).tickValues([]).tickSizeOuter(0))

    context.append("g")
        .attr("class", "x brush")
        .call(brush)

    rect.call(zoom).on("mousemove", function(event) {
        // const d = xScale.invert(event.x)
        const d = xScale.invert(event.offsetX - margin.left)
        //console.log(d)
        const dsi = d3.bisectCenter(dates, d)
        // console.log(extData[dsi])
        focusEvent(extData[dsi])
    });

    function dragged(event, d) {
        const dsi = d3.bisectCenter(dates, xScale.invert(event.x))
        if (d == 'start')
            calcApprox(dates[dsi]);
        else
            calcApprox(null, dates[dsi]);
        redraw(xScale);
        redrawContextApprox();
        //d3.select(this).raise().attr("cx", d.x = event.x).attr("cy", d.y = event.y);
    }

    handleStart
        .on('click', event => { if (event.defaultPrevented) return; })
        .call(d3.drag().on("drag", e => { dragged(e, 'start')}));

    handleEnd
        .on('click', event => { if (event.defaultPrevented) return; })
        .call(d3.drag().on("drag", e => { dragged(e, 'end')}));

    const yAxis = (g, y) => g
        .call(d3.axisLeft()
            .ticks(5, d3.format(",.0f"))
            .scale(y))
            // .tickFormat()
        .call(g => g.select(".domain").remove())

    const yAxis_i = (g, y) => {
        let y_i = y.copy()
        y_i.domain(y.domain().map(v => v*7/8901064*100000))
        g.call(d3.axisRight()
            .ticks(7, d3.format(",.0f"))
            .scale(y_i))
            //.tickFormat(d3.format(",.0f")))
         .call(g => g.select(".domain").remove())
    }

    const yGrid = (g, y) => g
        .call(d3.axisLeft()
            .scale(y)
            .ticks(5)
            .tickSize(-width)
            .tickFormat(''))
        .call(g => g.select(".domain").remove())

    gya.call(yAxis, yScale)
    gya_i.call(yAxis_i, yScale)
    gyg.call(yGrid, yScale)

    d3.selectAll("#buttons input").on("change", event => {
        yScale = yScales[event.target.value];
        pointsDay
            .selectAll("circle")
            .attr("cy", function(d) { return yScale(d.y_day); });
        gya.call(yAxis, yScale)
        gya_i.call(yAxis_i, yScale)
        gyg.call(yGrid, yScale)
        redraw(xScale);
    });

    // init with view params
    brush.move(context.select('.brush'), [xContext(parseDate('2020-06-01')), xContext(dataXrange[1])])
    focusEvent(extData[extData.length - forecastDays])
});
