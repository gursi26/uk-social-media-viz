const config = {
    width: 800,
    height: 800,
    marginTop: 50,
    marginRight: 50,
    marginBottom: 50,
    marginLeft: 60
};

const colorScale = d3.scaleOrdinal()
    .domain(['Instagram', 'Youtube', 'TikTok', 'Facebook', 'Twitter/X', 'Reddit', 'Threads', 'Bluesky'])
    .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f']);

const ageGroups = ['16 - 20', '21 - 25', '26 - 30', '31 - 35', '36 - 40'];

const sizeScale = d3.scaleOrdinal()
    .domain(ageGroups)
    .range([4, 6, 8, 9, 10]);

let chartData = [];
let svg, chart;
let xScale, yScale;

function length(path) {
    return d3.create("svg:path").attr("d", path).node().getTotalLength();
}

d3.csv('social-media-uk.csv').then(data => {
    const groupedData = d3.group(data, d => d.social_media_app);
    
    chartData = Array.from(groupedData, ([app, values]) => {
        return {
            app: app,
            values: values.map(v => ({
                age_group: v.age_group,
                men: +v.men_percent,
                women: +v.women_percent
            }))
        };
    });
    
    createChart();
    
    d3.select('#replay').on('click', () => {
        d3.select('#chart svg').remove();
        createChart();
    });
    
    createLegend();
});

function createChart() {
    svg = d3.select('#chart')
        .append('svg')
        .attr('width', config.width)
        .attr('height', config.height)
        .attr('viewBox', [0, 0, config.width, config.height])
        .attr('style', 'max-width: 100%; height: auto; background: #1a1a1a;');
    
    xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([config.marginLeft, config.width - config.marginRight]);
    
    yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([config.height - config.marginBottom, config.marginTop]);
    
    svg.append('g')
        .attr('class', 'grid')
        .selectAll('line.vertical-grid')
        .data(xScale.ticks(10))
        .join('line')
        .attr('class', 'grid-line')
        .attr('x1', d => xScale(d))
        .attr('x2', d => xScale(d))
        .attr('y1', config.marginTop)
        .attr('y2', config.height - config.marginBottom);
    
    svg.append('g')
        .attr('class', 'grid')
        .selectAll('line.horizontal-grid')
        .data(yScale.ticks(10))
        .join('line')
        .attr('class', 'grid-line')
        .attr('x1', config.marginLeft)
        .attr('x2', config.width - config.marginRight)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d));
    
    svg.append('line')
        .attr('x1', xScale(0))
        .attr('y1', yScale(0))
        .attr('x2', xScale(100))
        .attr('y2', yScale(100))
        .attr('stroke', '#666')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
    
    svg.append('text')
        .attr('x', xScale(15))
        .attr('y', yScale(85))
        .attr('fill', '#777')
        .attr('font-size', '13px')
        .attr('text-anchor', 'start')
        .text('More popular')
        .append('tspan')
        .attr('x', xScale(15))
        .attr('dy', '1.2em')
        .text('among women');
    
    svg.append('text')
        .attr('x', xScale(85))
        .attr('y', yScale(15))
        .attr('fill', '#777')
        .attr('font-size', '13px')
        .attr('text-anchor', 'end')
        .text('More popular')
        .append('tspan')
        .attr('x', xScale(85))
        .attr('dy', '1.2em')
        .text('among men');
    
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${config.height - config.marginBottom})`)
        .call(d3.axisBottom(xScale).ticks(10))
        .call(g => g.append('text')
            .attr('x', config.width - config.marginRight)
            .attr('y', -10)
            .attr('fill', 'currentColor')
            .attr('font-weight', 'bold')
            .attr('text-anchor', 'end')
            .text("Men's Usage (%)"));
    
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(${config.marginLeft},0)`)
        .call(d3.axisLeft(yScale).ticks(10))
        .call(g => g.append('text')
            .attr('x', 10)
            .attr('y', config.marginTop - 10)
            .attr('fill', 'currentColor')
            .attr('font-weight', 'bold')
            .attr('text-anchor', 'start')
            .text("Women's Usage (%)"));
    
    const line = d3.line()
        .curve(d3.curveCatmullRom)
        .x(d => xScale(d.men))
        .y(d => yScale(d.women));
    
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip');
    
    chartData.forEach((appData, appIndex) => {
        const color = colorScale(appData.app);
        const lineData = appData.values;
        const pathLength = length(line(lineData));
        
        const appClass = appData.app.replace(/[^a-zA-Z]/g, '');
        const path = svg.append('path')
            .datum(lineData)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2.5)
            .attr('stroke-linejoin', 'round')
            .attr('stroke-linecap', 'round')
            .attr('stroke-dasharray', `0,${pathLength}`)
            .attr('class', `line-${appClass}`)
            .attr('d', line);
        
        path.transition()
            .duration(3000)
            .delay(appIndex * 200)
            .ease(d3.easeLinear)
            .attr('stroke-dasharray', `${pathLength},${pathLength}`);
        
        const circles = svg.append('g')
            .selectAll('circle')
            .data(lineData)
            .join('circle')
            .attr('cx', d => xScale(d.men))
            .attr('cy', d => yScale(d.women))
            .attr('r', 0)
            .attr('fill', '#1a1a1a')
            .attr('stroke', color)
            .attr('stroke-width', 2.5)
            .attr('class', `circle-${appClass}`);
        
        circles.transition()
            .delay((d, i) => {
                const segmentLength = i === 0 ? 0 : length(line(lineData.slice(0, i + 1)));
                return appIndex * 200 + (segmentLength / pathLength * 3000);
            })
            .duration(300)
            .attr('r', d => sizeScale(d.age_group));
        
        circles
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', sizeScale(d.age_group) * 1.5)
                    .attr('stroke-width', 3);
                
                tooltip
                    .style('opacity', 1)
                    .html(`
                        <strong>${appData.app}</strong><br/>
                        Age: ${d.age_group}<br/>
                        Men: ${d.men}%<br/>
                        Women: ${d.women}%
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', sizeScale(d.age_group))
                    .attr('stroke-width', 2.5);
                
                tooltip.style('opacity', 0);
            });
    });
}

function createLegend() {
    const legend = d3.select('#legend');
    
    chartData.forEach(appData => {
        const appClass = appData.app.replace(/[^a-zA-Z]/g, '');
        const item = legend.append('div')
            .attr('class', 'legend-item')
            .style('cursor', 'pointer')
            .on('mouseenter', function() {
                chartData.forEach(ad => {
                    const ac = ad.app.replace(/[^a-zA-Z]/g, '');
                    d3.selectAll(`.line-${ac}`).style('opacity', 0.1);
                    d3.selectAll(`.circle-${ac}`).style('opacity', 0.1);
                });
                
                const lineData = appData.values;
                const line = d3.line()
                    .curve(d3.curveCatmullRom)
                    .x(d => xScale(d.men))
                    .y(d => yScale(d.women));
                const pathLength = length(line(lineData));
                
                d3.selectAll(`.line-${appClass}`)
                    .style('opacity', 1)
                    .attr('stroke-dasharray', `0,${pathLength}`)
                    .transition()
                    .duration(2000)
                    .ease(d3.easeLinear)
                    .attr('stroke-dasharray', `${pathLength},${pathLength}`);
                
                d3.selectAll(`.circle-${appClass}`)
                    .style('opacity', 1)
                    .attr('r', 0)
                    .transition()
                    .delay((d, i) => {
                        const segmentLength = i === 0 ? 0 : length(line(lineData.slice(0, i + 1)));
                        return segmentLength / pathLength * 2000;
                    })
                    .duration(200)
                    .attr('r', d => sizeScale(d.age_group));
            })
            .on('mouseleave', function() {
                chartData.forEach(ad => {
                    const ac = ad.app.replace(/[^a-zA-Z]/g, '');
                    d3.selectAll(`.line-${ac}`).style('opacity', 1);
                    d3.selectAll(`.circle-${ac}`).style('opacity', 1);
                });
            });
        
        item.append('div')
            .attr('class', 'legend-color')
            .style('background-color', colorScale(appData.app));
        
        item.append('span')
            .text(appData.app);
    });
}

