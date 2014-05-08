function gradeFirst(gradeDomainSwitch, viewerWidth, viewerHeight){

//remove all elements and start with a blank slate


//treeJSON = d3.json("./_data/flare.json", function(error, treeData) {
treeJSON = d3.text("./_data/flareGradeFirst.txt", function(error, treeData) {
    // Calculate total nodes, max label length
    treeData = JSON.parse(treeData);
    var totalNodes = 0;
    var maxLabelLength = 0;
    // variables for drag/drop
    var selectedNode = null;
    var draggingNode = null;
    // panning variables
    var panSpeed = 200;
    var panBoundary = 20; // Within 20px from edges will pan when dragging.
    // Misc. variables
    var i = 0;
    var duration = 750;
    var root;

    // size of the diagram
    /*var viewerWidth = $(document).width()-50;
    var viewerHeight = $(document).height()-100;*/

    var tree = d3.layout.tree()
        .size([viewerHeight, viewerWidth]);

    // Jenton Edit: setting the filter column's height and width
    $(function() {
        $( "#filter-column").
        width(200)
        .height(viewerHeight);
    });

    // define a d3 diagonal projection for use by the node paths later on.
    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });

    // A recursive helper function for performing some setup by walking through all nodes

    function visit(parent, visitFn, childrenFn) {
        if (!parent) return;

        visitFn(parent);

        var children = childrenFn(parent);
        if (children) {
            var count = children.length;
            for (var i = 0; i < count; i++) {
                visit(children[i], visitFn, childrenFn);
            }
        }
    }

    // Call visit function to establish maxLabelLength. This will recursively go through 
    // every node to see which node has the longest length, and store it in the maxLabelLength variable
    visit(treeData, function(d) {
        totalNodes++;
        maxLabelLength = Math.max(d.name.length, maxLabelLength);

    }, function(d) {
        return d.children && d.children.length > 0 ? d.children : null;
    });


    // sort the tree according to the node names
    // jenton edit: need to sort the grades by a specific order.
    // need an array for this?
    // reference: http://stackoverflow.com/questions/6591556/how-to-sort-list-items-using-custom-sort-order-in-jquery

    var gradeOrder = ['grade: k', 'grade: 1', 'grade: 2', 'grade: 3', 'grade: 4', 'grade: 5', 'grade: 6 - 8', 'grade: 6', 'grade: 7', 'grade: 8', 'grade: hsn', 'grade: hsa', 'grade: hsf', 'grade: hsm', 'grade: hsg', 'grade: hss', 'grade: 9 - 10', 'grade: 11 - 12'];
    function sortTree() {
        tree.sort(function(a, b) {
            
            if ($.inArray(a.name.toLowerCase(),gradeOrder) != -1 && $.inArray(b.name.toLowerCase(),gradeOrder) != -1 ) { 
                var indexA = $.inArray( a.name.toLowerCase(), gradeOrder);
                var indexB = $.inArray( b.name.toLowerCase(), gradeOrder);
                return ( indexA < indexB) ? -1 : ( indexA > indexB) ? 1 : 0;
            }
            return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;

        });
    }

    // Sort the tree initially incase the JSON isn't in a sorted order.
    sortTree();

    // TODO: Pan function, can be better implemented.

    function pan(domNode, direction) {
        var speed = panSpeed;
        if (panTimer) {
            clearTimeout(panTimer);
            translateCoords = d3.transform(svgGroup.attr("transform"));
            if (direction == 'left' || direction == 'right') {
                translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                translateY = translateCoords.translate[1];
            } else if (direction == 'up' || direction == 'down') {
                translateX = translateCoords.translate[0];
                translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
            }
            scaleX = translateCoords.scale[0];
            scaleY = translateCoords.scale[1];
            scale = zoomListener.scale();
            svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
            d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
            zoomListener.scale(zoomListener.scale());
            zoomListener.translate([translateX, translateY]);
            panTimer = setTimeout(function() {
                pan(domNode, speed, direction);
            }, 50);
        }
    }

    // Define the zoom function for the zoomable tree

    function zoom() {
        svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }


    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);


    // define the baseSvg, attaching a class for styling and the zoomListener
    var baseSvg = d3.select("#tree-container").append("svg")
        .attr("width", viewerWidth-200)
        .attr("height", viewerHeight)
        .attr("class", "overlay")
        .call(zoomListener);

    // Helper functions for collapsing and expanding nodes.

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function expand(d) {
        if (d._children) {
            d.children = d._children;
            d.children.forEach(expand);
            d._children = null;
        }
    }

    var overCircle = function(d) {
        selectedNode = d;
        updateTempConnector();
    };
    var outCircle = function(d) {
        selectedNode = null;
        updateTempConnector();
    };

    // Function to update the temporary connector indicating dragging affiliation
    var updateTempConnector = function() {
        var data = [];
        if (draggingNode !== null && selectedNode !== null) {
            // have to flip the source coordinates since we did this for the existing connectors on the original tree
            data = [{
                source: {
                    x: selectedNode.y0,
                    y: selectedNode.x0
                },
                target: {
                    x: draggingNode.y0,
                    y: draggingNode.x0
                }
            }];
        }
        var link = svgGroup.selectAll(".templink").data(data);

        link.enter().append("path")
            .attr("class", "templink")
            .attr("d", d3.svg.diagonal())
            .attr('pointer-events', 'none');

        link.attr("d", d3.svg.diagonal());

        link.exit().remove();
    };

    // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.

    function centerNode(source) {
        scale = zoomListener.scale();
        x = -source.y0;
        y = -source.x0;
        // console.log("x: " + x);
        // console.log("y: " + y);
        x = x * scale + viewerWidth / 2;
        y = y * scale + viewerHeight / 2;
        // console.log("x: " + x);
        // console.log("y: " + y);
        d3.select('g').transition()
            .duration(duration)
            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
        zoomListener.scale(scale);
        zoomListener.translate([x, y]);
    }

    // Toggle children function

    function toggleChildren(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        return d;
    }

    // Toggle children on click.
    function click(d) {
        if (d3.event.defaultPrevented) return; // click suppressed
        console.log(d);
        console.log(d.parent);
        
        d = toggleChildren(d);

        //console.log($(".nodeCircle").find("tspan").text());

        update(d);
        // Jenton Edit: Don't centerNode if the node has no children (standards node)
        if (d.standardText) { // only the leaf has the standardText, so this check works
            $("#breadcrumb").html(d.parent.parent.parent.parent.name + " > " + d.parent.parent.parent.name + " > " + d.parent.parent.name + " > " + d.parent.name + " > " + d.name);
            centerNode(d);
        } else if (d.type == "cluster") {
            $(".hover-text").remove(); // clear the hover text div of any old content when clicking any nodes besides the leaf
            $("#breadcrumb").html(d.parent.parent.parent.name + " > " + d.parent.parent.name + " > " + d.parent.name + " > " + d.name);
            $("#clusterFilter").find('option[value="' + d.name + '"]').attr("selected", true);
            centerNode(d);
        } else if (d.type == "domain") {
            $(".hover-text").remove(); // clear the hover text div of any old content when clicking any nodes besides the leaf
            $("#breadcrumb").html(d.parent.parent.name + " > " + d.parent.name + " > " + d.name);
            centerNode(d);
            
            //getting the parent index
            console.log(d.parent);
            var subjectKey;
            var subjectNextLevelKey;
            var key;
            //getting the index for the current depth and using that to populate the fields in the filter
            d.parent.children.forEach(function(data, index){
                console.log("data name: " + data.name);
                console.log("d.name: " + d.name);
                if (data.name == d.name){
                    key = parseInt(index);
                }
            })
            d.parent.parent.children.forEach(function(data, index){
                console.log("data name: " + data.name);
                console.log("d.name: " + d.name);
                if (data.name == d.parent.name){
                    subjectNextLevelKey = parseInt(index);
                }    
            })
            d.parent.parent.parent.children.forEach(function(data, index){
                console.log("data name: " + data.name);
                console.log("d.name: " + d.name);
                if (data.name == d.parent.parent.name){
                    subjectKey = parseInt(index);
                }    
            })
                console.log("subjectKey: " + subjectKey);
                console.log("key: " + key);
                populateClusters(subjectKey, subjectNextLevelKey, key);
                console.log(d.name.toLowerCase());
                //changing the entries in the filter
                $("#subjectFilter").find('option[value="' + d.parent.parent.name + '"]').attr("selected", true);
                $("#gradeFilter").find('option[value="' + d.parent.name + '"]').attr("selected", true);
                $("#domainFilter").find('option[value="' + d.name + '"]').attr("selected", true);


        } else if (d.type == "grade") { // clicked node is a grade
            $(".hover-text").remove(); // clear the hover text div of any old content when clicking any nodes besides the leaf
            $("#breadcrumb").html(d.parent.name + " > " + d.name);
            centerNode(d);
            
            //getting the parent index
            var subjectKey;
            var key;
            //getting the index for the current depth and using that to populate the appropriate fields in the filter
            d.parent.children.forEach(function(data, index){
                if (data.name == d.name){
                    key = parseInt(index);
                }
            })
            d.parent.parent.children.forEach(function(data, index){
                if (data.name == d.parent.name){
                    subjectKey = parseInt(index);
                }    
            })
                populateDomains(subjectKey, key);

                $("#subjectFilter").find('option[value="' + d.parent.name + '"]').attr("selected", true);
                $("#gradeFilter").find('option[value="' + d.name + '"]').attr("selected", true);

        } else { //clicked node is a subject
            $(".hover-text").remove(); // clear the hover text div of any old content when clicking any nodes besides the leaf
            $("#breadcrumb").html(d.name);
            centerNode(d);

            //getting the parent index
            console.log(d.parent);
            //getting the index for the current depth and using that to populate the fields in the filter
            d.parent.children.forEach(function(data, index){
                console.log("data name: " + data.name);
                console.log("d.name: " + d.name);
                if (data.name == d.name){
                    populateGrades(index);
                    $("#subjectFilter").find('option[value="' + d.name + '"]').attr("selected", true);

                }
            })
        }
    }

    function update(source) {
        // Compute the new height, function counts total children of root node and sets tree height accordingly.
        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
        // This makes the layout more consistent.
        var levelWidth = [1];
        var childCount = function(level, n) {

            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, root);
        var newHeight = d3.max(levelWidth) * 35; // jenton edit: 38 pixels per line for the height spread (default was 25)
        tree = tree.size([newHeight, viewerWidth]);

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Set widths between levels based on maxLabelLength.
        nodes.forEach(function(d) {
            d.y = (d.depth * (maxLabelLength *3.4)); //maxLabelLength * 10px
            // alternatively to keep a fixed scale one can set a fixed depth per level
            // Normalize for fixed-depth by commenting out below line
            //Jenton Edit: enabled the line below to create a fixed scale, for the horizontal spread
            //d.y = (d.depth * 250); //250px per level.
        });

        // Update the nodes…
        node = svgGroup.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            //.call(dragListener)
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on('click', click) //Jenton Edit: adding mouse over tooltip functionality
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

            console.log(source);
        nodeEnter.append("circle")
            .attr('class', 'nodeCircle')
            .attr("r", 0)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        // Jenton Edit: I changed the -10 : 10 ternary operator to -20 : 20 to make the text labels farther from the circles
        // Jenton Edit: This code changes the placement of the text
        nodeEnter.append("text")
            //.attr("x", function(d) { // original
            //    return d.children || d._children ? -20 : 20;
            //}) 
            .attr("x", function(d) { // change the text on the end nodes so it shows up to the left of the end node
                return d.children || d._children ? -20 : -20;
            })
            .attr("dy", ".35em")
            .attr('class', 'nodeText')
            //.attr("text-anchor", function(d) {
            //    return d.children || d._children ? "end" : "start";
            //})
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "end";
            })
            .text(function(d) {
                return d.name;
            })
            .style("fill-opacity", 0);

            // Jenton Edit: Code to have two lines of text for nodes with longer text
            // Source: http://stackoverflow.com/questions/20810659/breaking-text-from-json-into-several-lines-for-displaying-labels-in-a-d3-force-l
        /*var maxLength = 35;
        var separation = 3;
        var textX = 0;
        nodeEnter.append("text")
            .attr("dy", "0.35em")
            .attr('class', 'nodeText')
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "end";
            })
            .each(function (d) {
            var lines = wordwrap2(d.name, maxLength).split('\n');
            for (var i = 0; i < lines.length; i++) {
                if(i == 1){
                    separation = 14;
                } else {separation = 3;}
                d3.select(this)
                    .append("tspan")
                    .attr("dy", separation)
                    .attr("x", function(d) { // change the text on the end nodes so it shows up to the left of the end node
                        return d.children || d._children ? -20 : -20;
                    })
                    .text(lines[i]);
            }
        });*/

        function wordwrap2( str, width, brk, cut ) {
            brk = brk || '\n';
            width = width || 75;
            cut = cut || false;
            if (!str) { return str; }
            var regex = '.{1,' +width+ '}(\\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)');
            return str.match( RegExp(regex, 'g') ).join( brk );
        }

        // Update the text to reflect whether node has children or not.
        // Jenton Edit: I changed the -10 : 10 ternary operator to -20 : 20 to make the text labels farther from the circles
  /*      node.select('text')
            .attr("x", function(d) {
                return d.children || d._children ? -20 : 20;
            })
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            });*/

        // Change the circle fill depending on whether it has children and is collapsed
        // also where color is
        node.select("circle.nodeCircle")
            .attr("r", 13) // Jenton Edit: Changes area of circle
            //.attr("r", 4.5)
            .style("fill", function(d) {
                //return d._children ? "lightsteelblue" : "#fff";
                console.log(d.standardText);
                if (d.type == "grade") { // only the leaf has the standardText, so this check works
                    console.log("grade name: " + d.name);
                    if(d.name == "Grade: K") { return d._children ? "#6edff9" : "#fff";}
                    else if (d.name == "Grade: 1") { return d._children ? "#2be2d0" : "#fff";}
                    else if (d.name == "Grade: 2") { return d._children ? "#409edd" : "#fff";}
                    else if (d.name == "Grade: 3") { return d._children ? "#3232c9" : "#fff";}
                    else if (d.name == "Grade: 4") { return d._children ? "#ae76ff" : "#fff";}
                    else if (d.name == "Grade: 5") { return d._children ? "#7228c9" : "#fff";}
                    else if (d.name == "Grade: 6 - 8") { return d._children ? "#f77e11" : "#fff";}
                    else if (d.name == "Grade: 6") { return d._children ? "#ffe566" : "#fff";}
                    else if (d.name == "Grade: 7") { return d._children ? "#f7b31c" : "#fff";}
                    else if (d.name == "Grade: 8") { return d._children ? "#e2110c" : "#fff";}
                    else if (d.name == "Grade: 9 - 10") { return d._children ? "#1c421c" : "#fff";}                    
                    else if (d.name == "Grade: 11 - 12") { return d._children ? "#39b54a" : "#fff";}
                    else if (d.name == "Grade: HSN") { return d._children ? "#39b54a" : "#fff";}
                    else if (d.name == "Grade: HSA") { return d._children ? "#106b10" : "#fff";}
                    else if (d.name == "Grade: HSF") { return d._children ? "#a3e867" : "#fff";}
                    else if (d.name == "Grade: HSG") { return d._children ? "#1c421c" : "#fff";}
                    else if (d.name == "Grade: HSS") { return d._children ? "#0f8476" : "#fff";}                
                } else if (d.type == "domain") { // only the leaf has the standardText, so this check works
                    console.log("domain name: " + d.parent.name);
                    if(d.parent.name == "Grade: K") { return d._children ? "#6edff9" : "#fff";}
                    else if (d.parent.name == "Grade: 1") { return d._children ? "#2be2d0" : "#fff";}
                    else if (d.parent.name == "Grade: 2") { return d._children ? "#409edd" : "#fff";}
                    else if (d.parent.name == "Grade: 3") { return d._children ? "#3232c9" : "#fff";}
                    else if (d.parent.name == "Grade: 4") { return d._children ? "#ae76ff" : "#fff";}
                    else if (d.parent.name == "Grade: 5") { return d._children ? "#7228c9" : "#fff";}
                    else if (d.parent.name == "Grade: 6 - 8") { return d._children ? "#f77e11" : "#fff";}
                    else if (d.parent.name == "Grade: 6") { return d._children ? "#ffe566" : "#fff";}
                    else if (d.parent.name == "Grade: 7") { return d._children ? "#f7b31c" : "#fff";}
                    else if (d.parent.name == "Grade: 8") { return d._children ? "#e2110c" : "#fff";}
                    else if (d.parent.name == "Grade: 9 - 10") { return d._children ? "#1c421c" : "#fff";}
                    else if (d.parent.name == "Grade: 11 - 12") { return d._children ? "#39b54a" : "#fff";}
                    else if (d.parent.name == "Grade: HSN") { return d._children ? "#39b54a" : "#fff";}
                    else if (d.parent.name == "Grade: HSA") { return d._children ? "#106b10" : "#fff";}
                    else if (d.parent.name == "Grade: HSF") { return d._children ? "#a3e867" : "#fff";}
                    else if (d.parent.name == "Grade: HSG") { return d._children ? "#1c421c" : "#fff";}
                    else if (d.parent.name == "Grade: HSS") { return d._children ? "#0f8476" : "#fff";}                

                } else if (d.type == "cluster") { // only the leaf has the standardText, so this check works
                    console.log("grade name: " + d.parent.parent.name);
                    if(d.parent.parent.name == "Grade: K") { return d._children ? "#6edff9" : "#fff";}
                    else if (d.parent.parent.name == "Grade: 1") { return d._children ? "#2be2d0" : "#fff";}
                    else if (d.parent.parent.name == "Grade: 2") { return d._children ? "#409edd" : "#fff";}
                    else if (d.parent.parent.name == "Grade: 3") { return d._children ? "#3232c9" : "#fff";}
                    else if (d.parent.parent.name == "Grade: 4") { return d._children ? "#ae76ff" : "#fff";}
                    else if (d.parent.parent.name == "Grade: 5") { return d._children ? "#7228c9" : "#fff";}
                    else if (d.parent.parent.name == "Grade: 6 - 8") { return d._children ? "#f77e11" : "#fff";}
                    else if (d.parent.parent.name == "Grade: 6") { return d._children ? "#ffe566" : "#fff";}
                    else if (d.parent.parent.name == "Grade: 7") { return d._children ? "#f7b31c" : "#fff";}
                    else if (d.parent.parent.name == "Grade: 8") { return d._children ? "#e2110c" : "#fff";}
                    else if (d.parent.parent.name == "Grade: 9 - 10") { return d._children ? "#1c421c" : "#fff";}
                    else if (d.parent.parent.name == "Grade: 11 - 12") { return d._children ? "#39b54a" : "#fff";}
                    else if (d.parent.parent.name == "Grade: HSN") { return d._children ? "#39b54a" : "#fff";}
                    else if (d.parent.parent.name == "Grade: HSA") { return d._children ? "#106b10" : "#fff";}
                    else if (d.parent.parent.name == "Grade: HSF") { return d._children ? "#a3e867" : "#fff";}
                    else if (d.parent.parent.name == "Grade: HSG") { return d._children ? "#1c421c" : "#fff";}
                    else if (d.parent.parent.name == "Grade: HSS") { return d._children ? "#0f8476" : "#fff";}                
                   
                } else {
                    return d._children ? "#4a4f4f" : "#fff";
                }
            })
            .style("stroke", function(d){
                if (d.type == "grade") { // only the leaf has the standardText, so this check works                    
                    if (d.name == "Grade: K") { return d._children ? "#4a4f4f" : "#6edff9";}
                    else if (d.name == "Grade: 1") { return d._children ? "#4a4f4f" : "#2be2d0";}
                    else if (d.name == "Grade: 2") { return d._children ? "#4a4f4f" :  "#409edd";}
                    else if (d.name == "Grade: 3") { return d._children ? "#4a4f4f" :  "#3232c9";}
                    else if (d.name == "Grade: 4") { return d._children ? "#4a4f4f" :  "#ae76ff";}
                    else if (d.name == "Grade: 5") { return d._children ? "#4a4f4f" :  "#7228c9";}
                    else if (d.name == "Grade: 6 - 8") { return d._children ? "#4a4f4f" :  "#f77e11";}
                    else if (d.name == "Grade: 6") { return d._children ? "#4a4f4f" :  "#ffe566";}
                    else if (d.name == "Grade: 7") { return d._children ? "#4a4f4f" :  "#f7b31c";}
                    else if (d.name == "Grade: 8") { return d._children ? "#4a4f4f" :  "#e2110c";}
                    else if (d.name == "Grade: 9 - 10") { return d._children ? "#4a4f4f" :  "#1c421c";}
                    else if (d.name == "Grade: 11 - 12") { return d._children ? "#4a4f4f" :  "#39b54a";}
                    else if (d.name == "Grade: HSN") { return d._children ? "#4a4f4f" : "#39b54a";}
                    else if (d.name == "Grade: HSA") { return d._children ? "#4a4f4f" : "#106b10";}
                    else if (d.name == "Grade: HSF") { return d._children ? "#4a4f4f" : "#a3e867";}
                    else if (d.name == "Grade: HSG") { return d._children ? "#4a4f4f" : "#1c421c";}
                    else if (d.name == "Grade: HSS") { return d._children ? "#4a4f4f" : "#0f8476";}                
                } else if (d.type == "domain") {    
                    if (d.parent.name == "Grade: K") { return d._children ? "#4a4f4f" : "#6edff9";}
                    else if (d.parent.name == "Grade: 1") { return d._children ? "#4a4f4f" : "#2be2d0";}
                    else if (d.parent.name == "Grade: 2") { return d._children ? "#4a4f4f" :  "#409edd";}
                    else if (d.parent.name == "Grade: 3") { return d._children ? "#4a4f4f" :  "#3232c9";}
                    else if (d.parent.name == "Grade: 4") { return d._children ? "#4a4f4f" :  "#ae76ff";}
                    else if (d.parent.name == "Grade: 5") { return d._children ? "#4a4f4f" :  "#7228c9";}
                    else if (d.parent.name == "Grade: 6 - 8") { return d._children ? "#4a4f4f" :  "#f77e11";}
                    else if (d.parent.name == "Grade: 6") { return d._children ? "#4a4f4f" :  "#ffe566";}
                    else if (d.parent.name == "Grade: 7") { return d._children ? "#4a4f4f" :  "#f7b31c";}
                    else if (d.parent.name == "Grade: 8") { return d._children ? "#4a4f4f" :  "#e2110c";}
                    else if (d.parent.name == "Grade: 9 - 10") { return d._children ? "#4a4f4f" :  "#1c421c";}
                    else if (d.parent.name == "Grade: 11 - 12") { return d._children ? "#4a4f4f" :  "#39b54a";}
                    else if (d.parent.name == "Grade: HSN") { return d._children ? "#4a4f4f" : "#39b54a";}
                    else if (d.parent.name == "Grade: HSA") { return d._children ? "#4a4f4f" : "#106b10";}
                    else if (d.parent.name == "Grade: HSF") { return d._children ? "#4a4f4f" : "#a3e867";}
                    else if (d.parent.name == "Grade: HSG") { return d._children ? "#4a4f4f" : "#1c421c";}
                    else if (d.parent.name == "Grade: HSS") { return d._children ? "#4a4f4f" : "#0f8476";}                

                } else if (d.type == "cluster") { // only the leaf has the standardText, so this check works
                    if (d.parent.parent.name == "Grade: K") { return d._children ? "#4a4f4f" : "#6edff9";}
                    else if (d.parent.parent.name == "Grade: 1") { return d._children ? "#4a4f4f" : "#2be2d0";}
                    else if (d.parent.parent.name == "Grade: 2") { return d._children ? "#4a4f4f" :  "#409edd";}
                    else if (d.parent.parent.name == "Grade: 3") { return d._children ? "#4a4f4f" :  "#3232c9";}
                    else if (d.parent.parent.name == "Grade: 4") { return d._children ? "#4a4f4f" :  "#ae76ff";}
                    else if (d.parent.parent.name == "Grade: 5") { return d._children ? "#4a4f4f" :  "#7228c9";}
                    else if (d.parent.parent.name == "Grade: 6 - 8") { return d._children ? "#4a4f4f" :  "#f77e11";}
                    else if (d.parent.parent.name == "Grade: 6") { return d._children ? "#4a4f4f" :  "#ffe566";}
                    else if (d.parent.parent.name == "Grade: 7") { return d._children ? "#4a4f4f" :  "#f7b31c";}
                    else if (d.parent.parent.name == "Grade: 8") { return d._children ? "#4a4f4f" :  "#e2110c";}
                    else if (d.parent.parent.name == "Grade: 9 - 10") { return d._children ? "#4a4f4f" :  "#1c421c";}
                    else if (d.parent.parent.name == "Grade: 11 - 12") { return d._children ? "#4a4f4f" :  "#39b54a";}
                    else if (d.parent.parent.name == "Grade: HSN") { return d._children ? "#4a4f4f" : "#39b54a";}
                    else if (d.parent.parent.name == "Grade: HSA") { return d._children ? "#4a4f4f" : "#106b10";}
                    else if (d.parent.parent.name == "Grade: HSF") { return d._children ? "#4a4f4f" : "#a3e867";}
                    else if (d.parent.parent.name == "Grade: HSG") { return d._children ? "#4a4f4f" : "#1c421c";}
                    else if (d.parent.parent.name == "Grade: HSS") { return d._children ? "#4a4f4f" : "#0f8476";}                
                } else if (d.standardText) {
                    if(d.parent.parent.parent.name == "Grade: K") { return "#6edff9";}
                    else if (d.parent.parent.parent.name == "Grade: 1") { return "#2be2d0";}
                    else if (d.parent.parent.parent.name == "Grade: 2") { return "#409edd";}
                    else if (d.parent.parent.parent.name == "Grade: 3") { return "#3232c9";}
                    else if (d.parent.parent.parent.name == "Grade: 4") { return "#ae76ff";}
                    else if (d.parent.parent.parent.name == "Grade: 5") { return "#7228c9";}
                    else if (d.parent.parent.parent.name == "Grade: 6 - 8") { return "#f77e11";}
                    else if (d.parent.parent.parent.name == "Grade: 6") { return "#ffe566";}
                    else if (d.parent.parent.parent.name == "Grade: 7") { return "#f7b31c";}
                    else if (d.parent.parent.parent.name == "Grade: 8") { return "#e2110c";}
                    else if (d.parent.parent.parent.name == "Grade: 9 - 10") { return "#1c421c";}
                    else if (d.parent.parent.parent.name == "Grade: 11 - 12") { return "#39b54a";}
                    else if (d.parent.parent.parent.name == "Grade: HSN") { return "#39b54a";}
                    else if (d.parent.parent.parent.name == "Grade: HSA") { return "#106b10";}
                    else if (d.parent.parent.parent.name == "Grade: HSF") { return "#a3e867";}
                    else if (d.parent.parent.parent.name == "Grade: HSG") { return "#1c421c";}
                    else if (d.parent.parent.parent.name == "Grade: HSS") { return "#0f8476";}                
                } else {
                    return "#4a4f4f";
                }
            });

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Fade the text in
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 0);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        // Update the links…
        var link = svgGroup.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = baseSvg.append("g");

    // Define the root
    root = treeData;
    root.x0 = viewerHeight / 2;
    root.y0 = 0;

	// Collapse all children of roots children before rendering.
 	 root.children.forEach(function(child){
 	 collapse(child);
    });
    

    //////////////////////////
    // Initialization Start //
    //////////////////////////

    // Layout the tree initially and center on the root node.
    // Jenton Edit: Loading the tree graph on the Subject Level
    update(root);

    var subjectLevel = toggleChildren(root.children[0]); //Jenton Edit: toggling the first element in the children of the root, which is English   
    //Jenton Edit: update the tree to reflect the toggle
    update(subjectLevel);
    //Jenton Edit: center the tree on the selection
    centerNode(subjectLevel);

    //////////////////////////////
    // Initializing the Filter //
    /////////////////////////////

    //setting up variables
    subjectLabels = ["English", "Math"];
    options = [0, 1];
    gradeDomainSwitchValues = ["grade", "domain"];
    gradeDomainSwitchLabels = ["Grade First", "Domain First"];
    gradeDomainSwitchOptions = [0,1];
    var gradeDomainDefaultSwitch = 0;

    $(".gradeDomainSwitch").prepend("<h4><small id='gradeDomainSwitch'>Showing Grade First</small></h4>")
    $("#switchButton").val('Switch to Domain First');
    $("#depth2").text("Grade");
    $("#depth3").text("Domain");

    //building the subject dropwdown menu (from http://stackoverflow.com/questions/16611541/return-data-based-on-dropdown-menu)    
    d3.select(".subjectFilter")
        .append("select").attr("id", "subjectFilter")
        .selectAll("option")
        .data(options)
        .enter()
        .append("option").attr("value", function(d){ return subjectLabels[d];}) 
        // Provide available text for the dropdown options
        .text(function(d) {return subjectLabels[d];})

    // Build grade dropdown placeholder
    d3.select(".gradeFilter")
        .append("select").attr("id", "gradeFilter");

    //populate grades for subject on first load
    var key = $("#subjectFilter")[0].selectedIndex;
    console.log(key);
    populateGrades(key);

    //swap filter titles for grade and domain
    $("#secondLevel").text("Grade");
    $("#thirdLevel").text("Domain");

    // Build domain dropdown placeholder
    d3.select(".domainFilter")
        .append("select").attr("id", "domainFilter");

    // Build cluster dropdown placeholder
    d3.select(".clusterFilter")
        .append("select").attr("id", "clusterFilter");

    // Jenton Edit: setting the hover text div's height and width
    console.log("svg width: " + $("svg").width());
    $(function() {
        $( "#standard-hover-div")
        .width($("svg").width()-12)
        //.height(viewerHeight/7)
    });

    // Jenton Edit: setting the breadcrumb div's height and width
    $(function() {
        $( "#breadcrumb")
        .width($("svg").width()-12)
        .html(root.children[0].name);
        //.height(viewerHeight/8)
    });
    //////////////////////////
    // Initialization End   //
    //////////////////////////

    function zoomed() {
      container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    function zoomWithSlider(scale) {
            var svg = d3.select("body").select("svg");
            var container = svg.select("g");
            console.log($(this));
            //var container = svg.select($(this).nodeCircle);
            var h = svg.attr("height"), w = svg.attr("width");
            
            // Note: works only on the <g> element and not on the <svg> element
        // which is a common mistake
            // container.attr("transform",
            //         "translate(" + w/2 + ", " + h/2 + ") " +
            //         "scale(" + scale + ") " +
            //         "translate(" + (-w/2) + ", " + (-h/2) + ")");
            //scale = zoomListener.scale();
            container.attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
            zoomListener.scale(scale);
            zoomListener.translate([x,y]);
    }

    // Jenton Edit: Show tooltip on mouseover : http://stackoverflow.com/questions/19297808/how-to-display-name-of-node-when-mouse-over-on-node-in-collapsible-tree-graph
    function mouseover(d) {
        
        $("#standard-hover-div").append(function() {
            if (d.standardText) { //if logic to only show text when standardText exists
                //$("#standard-hover-div").show();
                $(".hover-text").remove(); // clear the hover text div of any old content when mouse hovering
                $("#breadcrumb").html(d.parent.parent.parent.parent.name + " > " + d.parent.parent.parent.name + " > " + d.parent.parent.name + " > " + d.parent.name + " > " + d.name);
                return "<p class='hover-text'>Standard Code: " + d.name + "<br />Standard Text: " + d.standardText + "</p>"; // append an element to the hover text div
           };
        });
    }

    // Toggle children on click.
    // Jenton Edit: Doesn't do anything right now. Only for the tooltip that appears next to node
    function mouseout(d) {
        d3.select(this).select("text.hover").remove();
        //$("#standard-hover-div").hide();
        
    }

    //populate grade dropdown function
    function populateGrades(key){
        var numberOfGrades = root.children[key].children.length; //create an array based on how many grades in subject
        console.log(numberOfGrades);
        var gradeOptions = [0]; //creating an array with a 0 element to account for the dummy, 'select a grade' element
        var gradeLabels = ['select a grade'];

        for (var i = 0; i < numberOfGrades; i++) {
            gradeOptions.push(i+1);
            gradeLabels.push(root.children[key].children[i].name);
        }
        console.log(gradeOptions);
        console.log(gradeLabels);

        //clear out whatever's in the grade filter
        d3.select("#gradeFilter")
            .selectAll("option").remove();

        //append in the pertinent grades to the dropdown
        d3.select("#gradeFilter")
            .selectAll("option")
            .data(gradeOptions)
            .enter()
            .append("option").attr("value", function(d){ return gradeLabels[d];}) 
            // Provide available text for the dropdown options
            .text(function(d) {return gradeLabels[d];})
    }

    //populate domain dropdown function (if grade is first)
    function populateDomains(subjectKey, gradeKey){
        console.log("subjectKey: " + subjectKey);
        console.log("gradeKey: " + gradeKey);
        console.log(root.children[subjectKey].children[gradeKey]);
        
        //when opening up the domains, since the nodes are usually hidden, children.length doesn't exist in the node.
        // wherease _children.length does exist. 
        // this might mess up if some nodes are open and some nodes are not?
        try {
            var numberOfDomains = root.children[subjectKey].children[gradeKey].children.length; //create an array based on how many domains in the selected grade
        } catch (e) {
            // statements to handle TypeError exceptions
            var numberOfDomains = root.children[subjectKey].children[gradeKey]._children.length; //create an array based on how many domains in the selected grade
        } 
        
        console.log("number of Domains: " + numberOfDomains);
        var domainOptions = [0]; //creating an array with a 0 element to account for the dummy, 'select a domain' element
        var domainLabels = [];

        for (var i = 0; i < numberOfDomains; i++) {
            domainOptions.push(i+1);
            try {
                domainLabels.push(root.children[subjectKey].children[gradeKey]._children[i].name);
            } catch (e) {
                domainLabels.push(root.children[subjectKey].children[gradeKey].children[i].name);
            }
        }
        console.log(domainOptions);
        console.log(domainLabels);
        domainLabels.sort();
        domainLabels.unshift('select a domain'); //adding the 'select a domain' text to the beginning of the array

        //clear out whatever's in the domain filter
        d3.select("#domainFilter")
            .selectAll("option").remove();

        //append in the pertinent domains to the dropdown
        d3.select("#domainFilter")
            .selectAll("option")
            .data(domainOptions)
            .enter()
            .append("option").attr("value", function(d){ return domainLabels[d];}) 
            // Provide available text for the dropdown options
            .text(function(d) {return domainLabels[d];})
    }

    //populate cluster dropdown function
    function populateClusters(subjectKey, gradeKey, domainKey){
        console.log("subjectKey: " + subjectKey);
        console.log("gradeKey: " + gradeKey);
        console.log("domainKey: " + domainKey);
        console.log(root.children[subjectKey].children[gradeKey].children[domainKey]);
        
        //when opening up the cluster, since the nodes are usually hidden, children.length doesn't exist in the node.
        // wherease _children.length does exist. 
        // this might mess up if some nodes are open and some nodes are not?
        try {
            var numberOfClusters = root.children[subjectKey].children[gradeKey].children[domainKey].children.length; //create an array based on how many clusters in the selected grade
        } catch (e) {
            // statements to handle TypeError exceptions
            var numberOfClusters = root.children[subjectKey].children[gradeKey].children[domainKey]._children.length; //create an array based on how many clusters in the selected grade
        } 
        
        console.log("number of Clusters: " + numberOfClusters);
        var clusterOptions = [0]; //creating an array with a 0 element to account for the dummy, 'select a domain' element
        var clusterLabels = [];

        for (var i = 0; i < numberOfClusters; i++) {
            clusterOptions.push(i+1);
            try {
                clusterLabels.push(root.children[subjectKey].children[gradeKey].children[domainKey]._children[i].name);
            } catch (e) {
                clusterLabels.push(root.children[subjectKey].children[gradeKey].children[domainKey].children[i].name);
            }
        }
        console.log(clusterOptions);
        console.log(clusterLabels);
        clusterLabels.sort();
        clusterLabels.unshift('select a domain');

        //clear out whatever's in the cluster filter
        d3.select("#clusterFilter")
            .selectAll("option").remove();

        //append in the pertinent cluster to the dropdown
        d3.select("#clusterFilter")
            .selectAll("option")
            .data(clusterOptions)
            .enter()
            .append("option").attr("value", function(d){ return clusterLabels[d];}) 
            // Provide available text for the dropdown options
            .text(function(d) {return clusterLabels[d];})
    }

//Subject filter change listener
d3.select('#subjectFilter')
    .on("change", function() {

    key = this.selectedIndex;
    console.log(key);
    $("#breadcrumb").html(root.children[key].name);


    root.children.forEach(function(d, i) {
        console.log(i);
        //close the open subject node when switching subjects
        if (i == key) {
            var openSelectedSubject = toggleChildren(root.children[key]);
            update(openSelectedSubject);
            centerNode(openSelectedSubject);
            
        } else {
            collapse(root.children[i]);
            update(root.children[i]);
        }
    });

    console.log(root.children[key].children);
 
    //clear out whatever's in the domain and cluster filter
    d3.select("#domainFilter")
        .selectAll("option").remove();
    d3.select("#clusterFilter")
        .selectAll("option").remove();
    //populate grade dropdown
    populateGrades(key);
});

//listener for grade dropdown change
d3.select('#gradeFilter')
    .on("change", function() {

    //var subjectKey = d3.select('#subjectFilter').value();
    console.log($("#subjectFilter"));
    var subjectKey = $("#subjectFilter")[0].selectedIndex;
    console.log("SubjectKey: " + subjectKey);

    var key = this.selectedIndex-1; // minus 1 because otherwise, it opens the wrong node
    console.log("value: " + this.value);
    console.log("key: " +key);

    $("#breadcrumb").html(root.children[subjectKey].name + " > " + root.children[subjectKey].children[key].name );

    //clear out whatever's in the domain and cluster filter
    d3.select("#clusterFilter")
        .selectAll("option").remove();
    populateDomains(subjectKey,key);
    

    
    root.children[subjectKey].children.forEach(function(d, i) {
        console.log(i);
        //close the open subject node when switching subjects
        if (i == key) {
            //d is the same as root.children[subjectKey].children[i]
            console.log(d);
            //console.log(root.children[subjectKey].children[i])
            var openSelectedSubject = toggleChildren(d);
            //console.log(openSelectedSubject);
            update(openSelectedSubject);
            centerNode(openSelectedSubject);            
            
        } else {            
                collapse(d);
                update(d);
        }
        });

    });

//listener for domain dropdown change
d3.select('#domainFilter')
    .on("change", function() {

    //var subjectKey = d3.select('#subjectFilter').value();
    console.log($("#subjectFilter"));
    
    var subjectKey = $("#subjectFilter")[0].selectedIndex;
    var gradeKey = $("#gradeFilter")[0].selectedIndex-1;
    
    var key = this.selectedIndex-1; // minus 1 because otherwise, it opens the wrong node
    console.log("key: " + key);
    console.log("key value: " + this.value);
    console.log("SubjectKey: " + subjectKey);
    console.log("SubjectKey Value: " + $("#subjectFilter")[0].value);
    console.log("GradeKey: " + gradeKey);
    console.log("GradeKey Value: " + $("#gradeFilter")[0].value);

    $("#breadcrumb").html(root.children[subjectKey].name + " > " + root.children[subjectKey].children[gradeKey].name + " > " + root.children[subjectKey].children[gradeKey].children[key].name );

    populateClusters(subjectKey,gradeKey,key);
          
    root.children[subjectKey].children[gradeKey].children.forEach(function(d, i) {
        if (i == key) {        
            var openSelectedSubject = toggleChildren(d);
            update(openSelectedSubject);
            centerNode(openSelectedSubject);          
            } else {            
                collapse(d);
                update(d); 
            }
    })
 
})

//listener for cluster dropdown change
d3.select('#clusterFilter')
    .on("change", function() {

    //var subjectKey = d3.select('#subjectFilter').value();
    console.log($("#subjectFilter"));
    
    var subjectKey = $("#subjectFilter")[0].selectedIndex;
    var gradeKey = $("#gradeFilter")[0].selectedIndex-1;
    var domainKey = $("#domainFilter")[0].selectedIndex-1;
    
    var key = this.selectedIndex-1; // minus 1 because otherwise, it opens the wrong node
    console.log("key: " + key);
    console.log("key value: " + this.value);
    console.log("SubjectKey: " + subjectKey);
    console.log("SubjectKey Value: " + $("#subjectFilter")[0].value);
    console.log("GradeKey: " + gradeKey);
    console.log("GradeKey Value: " + $("#gradeFilter")[0].value);
    console.log("DomainKey: " + domainKey);
    console.log("DomainKey Value: " + $("#domainFilter")[0].value);

    $("#breadcrumb").html(root.children[subjectKey].name + " > " + root.children[subjectKey].children[gradeKey].name + " > " + root.children[subjectKey].children[gradeKey].children[domainKey].name + " > " + root.children[subjectKey].children[gradeKey].children[domainKey].children[key].name );

          
    root.children[subjectKey].children[gradeKey].children[domainKey].children.forEach(function(d, i) {
        if (i == key) {        
            var openSelectedSubject = toggleChildren(d);
            update(openSelectedSubject);
            centerNode(openSelectedSubject);          
            } else {            
                collapse(root.children[subjectKey].children[gradeKey].children[domainKey].children[i]);
                update(root.children[subjectKey].children[gradeKey].children[domainKey].children[i]); 
            }
    })
 
})

//toggle for grade or domain first switch
$("#switchButton").on('click', function() {
    if (gradeDomainSwitch == 0) {
        $("svg").remove();
        $("#gradeDomainSwitch").remove();
        $("#subjectFilter").remove();
        $("#gradeFilter").remove();
        $("#domainFilter").remove();
        $("#clusterFilter").remove();
        gradeDomainSwitch = 1;
        domainFirst(gradeDomainSwitch, viewerWidth, viewerHeight);
    };
});

$("#closeAllNodesButton").on('click', function(){
    // Collapse all children of roots children before rendering.
    root.children.forEach(function(child){
        collapse(child);
    });
    update(root);
    centerNode(root);
    
    //To Do : When clicking the close all Nodes button, reset filters
})


//code end
});

}


