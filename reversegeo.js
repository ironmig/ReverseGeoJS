function reverseGeo(lat, lon, callback, find) {
    //Valid find string: 'city','postcode','country','state'
    var res = {};
    find = find || ['city', 'postcode', 'country', 'state'];
    var ofind = function (y) { //converts find string to array of possible openstreetmap results corrosponding
        switch (y) {
            case 'city':
                return ['city', 'village', 'town'];
            default:
                return [y];
        }
    };
    var gfind = function (x) { //converts find string to array of possible google maps results corrosponding
        switch (x) {
            case 'city':
                return ['locality'];
            case 'postcode':
                return ['postal_code'];
            case 'state':
                return ['administrative_area_level_1'];
            default:
                return [x];
        }
    };
    var gsearch = function (gcall) {
        var req = new XMLHttpRequest();
        req.open('GET', 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lon, true); //sets type and address of ajax request
        req.onreadystatechange = function () {
            if (req.readyState === 4 && req.status === 200) { //when a response has been received with no http error
                //results structure: response -> Results array - > results[0] object -> address_components
                var data = JSON.parse(req.responseText); //parse response json into an object
                //if (data.status === "OK") { //If status element of google's api response is "OK", attempt to parse for response
                var results = data.results;
                for (var i = 0; i < results.length; i++) { //for each result
                    for (var g = 0; g < results[i].address_components.length; g++) { //for each element in the address_components of each result
                        var cur = results[i].address_components[g]; //caches current element
                        for (var k = 0; k < find.length; k++) { //for each remaining find
                            var look = gfind(find[k]);
                            for (var m = 0; m < look.length; m++) { //for each possible google result that will satifsfy current find term
                                if (cur.types.indexOf(look[m]) !== -1) { //if this term is found in the types array
                                    res[find[k]] = cur.long_name;
                                    find.splice(k, 1);
                                    break;
                                }
                            }
                        }
                    }
                }
                //} else { //If response json does not have okay feild, define error and do not parse data

                //}
                gcall(); //in all cases, call the callback function, passing the parsed data as the first argument and the error is aplicable as the second
            }
        };
        req.send();
    };
    var osearch = function (ocall) {
        var req = new XMLHttpRequest();
        var server = 'http://open.mapquestapi.com/nominatim/v1/reverse.php'; //A valid nominatim reverse geocoding server
        req.open('GET', server + '/reverse?format=json&lat=' + lat + '&lon=' + lon, true);
        req.send();
        req.onreadystatechange = function () {
            if (req.readyState === 4 && req.status === 200) {
                data = JSON.parse(req.responseText).address;
                for (var i = 0; i < find.length; i++) { //for all reaming find terms
                    var look = ofind(find[i]);
                    for (var g = 0; g < look.length; g++) { //for all possible open street maps value that satisfy this find term
                        if (data[look[g]]) { //if this term is in the data
                            res[find[i]] = data[look[g]];
                            find.splice(i, 1);
                            break;
                        }
                    }
                }
                ocall();
            }
        };
    };
    gsearch(function () {
        if (find.length === 0) callback(res);
        else osearch(function () {
            callback(res);
        });
    });
}
