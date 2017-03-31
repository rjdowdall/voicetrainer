function drawBuffer(width, height, context, data) {
  var step = Math.ceil(data.length / width);
  var amp = height / 2;
  context.fillStyle = "silver";
  context.clearRect(0, 0, width, height);
  for (var i=0; i < width; i++){
    var min = 1.0;
    var max = -1.0;
    for (j=0; j<step; j++) {
      var datum = data[(i*step)+j];
      if (datum < min) {
        min = datum;
      }
      if (datum > max) {
        max = datum;
      }
    }
    context.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
  }
}

var parseTime = d3.timeParse("%d-%b-%y");

class D3Plot {
    constructor(frequencies, selector){
        var self = this;
        var svg = d3.select(selector),
            margin = {top: 20, right: 20, bottom: 30, left: 50}

        this.width = +svg.attr("width") - margin.left - margin.right
        this.height = +svg.attr("height") - margin.top - margin.bottom

        this.g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        this.x = d3.scaleLog().base(10)
            .rangeRound([0, this.width*.9]);

        this.y = d3.scaleLog().base(10)
            .rangeRound([this.height, 0]);

        this.frequencies = frequencies;

        this.g.append("g")
              .attr("transform", "translate(0," + this.height + ")")
              .call(d3.axisBottom(this.x))
            .select(".domain")
              .remove();

        this.g.append("g")
              .call(d3.axisLeft(this.y))
            .append("text")
              .attr("fill", "#000")
              .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", "0.71em")
              .attr("text-anchor", "end")
              .text("");

        this.line = d3.line()
            .x(function(d) { return self.x(d[0]); })
            .y(function(d) { return self.y(d[1]); });


        /*this.line = d3.line()
            .x(function(d) { return self.x(d[0]); })
            .y(function(d) { return self.y(d[1]); });
*/
        this.y.domain([3, 200]);
        //this.x.domain([0.00001, _.max(self.frequencies)]);
        //this.x.domain([0.00001, _.max(self.frequencies)]);      
        this.x.domain(d3.extent(frequencies));
        //this.y.domain(0, 200);


    }


    draw(data){
        var self = this;
        
        var mav = movingAverage(data, 20);
        var zipdata = _.zip(self.frequencies, mav)
        var zipdataNonzero = _.filter(zipdata,
                function(d){ return d[1] > 0; }
        );

        //self.x.domain(d3.extent(zipdata, function(d) { return d[0]; }));
        //self.y.domain(d3.extent(zipdata, function(d) { return d[1]; }));

        self.g.selectAll("path").remove();
        self.g.append("path")
              //.datum(zipdata)
              .attr("fill", "none")
              .attr("stroke", "steelblue")
              .attr("stroke-linejoin", "round")
              .attr("stroke-linecap", "round")
              .attr("stroke-width", 1.5)
              .attr("d", self.line(zipdataNonzero));

    }

}

var movingAverage = function(arr, size) {
    var win, i, newarr = [];
    for(i = size-1; i <= arr.length; i++) {
      win = arr.slice(i - size, i);
      if (win.length === size) {
        newarr.push(_.mean(win));
      }
    }
    return newarr;
  };

//var plot = new D3Plot()
//plot.draw()
