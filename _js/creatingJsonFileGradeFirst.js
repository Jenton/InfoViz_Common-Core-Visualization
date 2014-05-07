
d3.tsv("./_data/CCSS_standards.tsv", function(data) {
var newData = { name :"Common Core Standards", children : [] },
    levels = ["subject","grade","domain","cluster"];

//console.log(newData);
// For each data row, loop through the expected levels traversing the output tree
data.forEach(function(d){
    // Keep this as a reference to the current level
    // console.log("d " + d);
    var depthCursor = newData.children;
    // console.log("depthCursor" + depthCursor);
    // Go down one level at a time
    levels.forEach(function( property, depth ){
        // console.log("property " + property);
        // Look to see if a branch has already been created
        var index;
        depthCursor.forEach(function(child,i){
            // console.log("d[property] " + d[property]);
            // console.log("child.name " + child.name);
            // console.log("child.domain " + child.domain);
            // console.log("child.cluster " + child.cluster);
            if ( d[property] == child.name ) {index = i};
        });
        // Add a branch if it isn't there
        //console.log("isNaN(index) " + isNaN(index));
        if ( isNaN(index) ) {
            depthCursor.push({ name : d[property], type: property, children : []});
            index = depthCursor.length - 1;
        }
        // Now reference the new child array as we go deeper into the tree
        depthCursor = depthCursor[index].children;
        // This is a leaf, so add the last element to the specified branch
        if ( depth === levels.length - 1 ) depthCursor.push({ name : d.standardName, standardText : d.stateStandard, type : 'standard' });
    });
});

//console.log(newData);
//use stringify to get the object to text and create an offline json file
textData = JSON.stringify(newData);
console.log(textData);
//-----

//console.log(JSON.stringify(newData, null, 4));
// console.log(JSON.stringify(newData));
});
