$(document).ready(function() {

    
// disabled for testing
// window.onload = function() {
//     $('.detailedForecast').hide();
//     getLocation();
// }

// for testing window load event only
window.addEventListener('load',function() {
    console.log('test window load');
});

// pro api options
// const apiUrl2 = 'https://pro.openweathermap.org/'
// 'data/2.5/forecast/hourly?' // 4-day forecast with 1-hour intervals, provide cnt=1-96

// one successful call
// 'data/2.5/forecast/daily?',  // 16-day forecast with daily intervals, provide cnt=1-16; 401 unauthorized

// syntax for 16 day forecast with daily intervals
// api.openweathermap.org/data/2.5/forecast/daily?lat={lat}&lon={lon}&cnt={cnt}&appid={API key}
// let callUrl = apiUrl + callType + coordsStr + key + units; // set inside function, keep for syntax reference

const locCoords = [];
let coordsStr = '';

const callTypes = [
    'data/2.5/weather?', // Current weather
    'data/2.5/forecast?', // 5-day forecast with 3-hour intervals
    'data/2.5/air_pollution?' // Air pollution
]

const apiUrl = 'https://api.openweathermap.org/'
// let cntStr = '&cnt=' + cnt // number of daily forecasts, 1-16
const units = '&units=imperial'; // provide options for metric, imperial, standard

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const daysOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
let t = new Date().getDay();
let today = daysOfWeek[t];
const monthsOfYear = ['January','February','March','April','May','June','July','August','September','October','November','December'];
let formattedDate = '';

const weatherIconBase = `https://openweathermap.org/img/wn/`;

$('#getCurrentWeather').click(getCurrentWeather);
$('#getForecast').click(getForecast);

function getLocation() {
    console.log('fetching location...');
    let lat;
    let lon;
    navigator.geolocation.getCurrentPosition((position) => {
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        console.log ('lat is ' + lat + '; ' + 'lon is ' + lon);
        if (!lat || !lon) { // default to Portage, IN
            lat = 41.5662081;
            lon = -87.2022016;
            console.log ('lat is ' + lat + '; ' + 'lon is ' + lon);
        }
        locCoords.push(lat);
        locCoords.push(lon);
        coordsStr = 'lat=' + locCoords[0] + '&lon=' + locCoords[1]; // update if user changes location
        console.log('coordsStr = ' + coordsStr);
    });
}

function mmToInches(mm) {
    return mm / 25.4;
}

function formatDate(data) {
    let day = daysOfWeek[new Date(data.dt * 1000).getDay()]
    let month = monthsOfYear[new Date(data.dt * 1000).getMonth()]
    let date = new Date(data.dt * 1000).getDate()
    let year = new Date(data.dt * 1000).getFullYear()
    formattedDate = day + ', ' + month + ' ' + date + ', ' + year;
    return formattedDate;
}

function formatTime(data) {
    let month = new Date(data.dt * 1000).getMonth() + 1;
    let date = new Date(data.dt * 1000).getDate();
    let year = new Date(data.dt * 1000).getFullYear();
    let hours = (new Date(data.dt * 1000).getHours()).toString().padStart(2, '0');
    let minutes = (new Date(data.dt * 1000).getMinutes()).toString().padStart(2, '0');
    let seconds = (new Date(data.dt * 1000).getSeconds()).toString().padStart(2, '0');
    // let formattedTime = month + '/' + date + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds;
    let formattedTime = hours + ':' + minutes + ':' + seconds;
    return formattedTime;
}

async function getCurrentWeather() {
    console.log('coordsStr' + coordsStr);
    let callType = callTypes[0];
    let callUrl = apiUrl + callType + coordsStr + key + units;
    console.log(callUrl);
    try {
        const response = await fetch(callUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }    
        const data = await response.json();
        $('#currentWeatherText').html(
            formatDate(data) + '<br>' +
            data.weather[0].description + ' ' + '<br>' +
            data.main.temp + '°F, ' + 'Feels like: ' + data.main.feels_like + '°F' + '<br>' + 
            'Humidity: ' + data.main.humidity + '%' + '<br>' + 
            'Wind speed: ' + data.wind.speed + ' mph' + '<br>' + 
            'Pressure: ' + data.main.pressure + ' hPa' + '<br>' + 
            'Sunrise: ' + new Date(data.sys.sunrise * 1000).toLocaleTimeString() + ', Sunset: ' + new Date(data.sys.sunset * 1000).toLocaleTimeString()
        );
        $('#currentWeatherIcon').html(
            '<img src=' + weatherIconBase + data.weather[0].icon + '.png>'
        );
        $('#currentWeatherIcon img').css({
            'max-width':'100%',
            'width':'auto'
        });
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);  
    }  
}    

async function getForecast() {
    let callType = callTypes[1];
    let coordsStr = 'lat=' + locCoords[0] + '&lon=' + locCoords[1];
    let callUrl = apiUrl + callType + coordsStr + key + units;
    let days = [];
    $('#forecast').html('');
    try {
        const response = await fetch(callUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        for (let i = 0; i < data.list.length; i++) {
            let day = daysOfWeek[new Date(data.list[i].dt * 1000).getDay()];
            let time = formatTime(data.list[i]);
            // console.log(day, time);
            // console.log(data.list[i]);
            let castDate = daysOfWeek[new Date(data.list[i].dt * 1000).getDay()];
            if (castDate === today) { // skip today's forecast
                continue;
            }
            else {
                if (!days.some(obj => obj.name === day)) { // check if day already exists
                    let fcastDay = { // create object for each day
                        name: day,
                        hi: data.list[i].main.temp_max,
                        lo: data.list[i].main.temp_min,
                        pop: data.list[i].pop,
                        icon: (data.list[i].weather[0].icon).slice(0, -1)
                    };
                    days.push(fcastDay);
                } else {
                    let d = days.length - 1;
                    if (data.list[i].main.temp_max > days[d].hi) {
                        days[d].hi = data.list[i].main.temp_max;
                    }
                    if (data.list[i].main.temp_min < days[d].lo) {
                        days[d].lo = data.list[i].main.temp_min;
                    }
                    if (data.list[i].pop > days[d].pop) {
                        days[d].pop = data.list[i].pop;
                    }
                    if (((data.list[i].weather[0].icon).slice(0, -1)) > days[d].icon) {
                        days[d].icon = (data.list[i].weather[0].icon).slice(0, -1);
                    }
                }
            }
        }
        for (let i = 0; i < days.length; i++) {
            let d = i + 1;
            let precip = (days[i].pop * 100).toFixed(2)
            let dayDiv = $('<div>').attr({
                'class': 'days',
                'id': 'day' + d,
                'data-param': d
            });
            dayDiv.html(
                days[i].name + '<br>' +
                '<img src=' + weatherIconBase + days[i].icon + 'd' + '.png>' + '<br>' +
                'Hi: ' + days[i].hi + '°F ' + '<br>' + 'Lo: ' + days[i].lo + '°F' + '<br>' +
                'Precipitation: ' + precip + '%'
                // 'Precipitation: ' + days[i].pop.toFixed(2) * 100 + '%'
            );
            // dayDiv.css({
            //     // 'height':'80%',
            //     'justify-content':'center'
            // });
            $('#forecast').append(dayDiv);
        }
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

async function detailedForecast(day) {
    $('.detailedForecast').show();
    $('#mainScreen').hide();

    // construct api call
    let coordsStr = 'lat=' + locCoords[0] + '&lon=' + locCoords[1];
    var callUrl = apiUrl + callTypes[1] + coordsStr + key + units;

    // compare 'day' parameter with value for today
    let today = new Date().getDay();
    if (day + today <= 6) {
        day += today;
    }
    else {
        day = day + today - 7;
    }
    $('#detailedCaption').html('Detailed Forecast information for ' + daysOfWeek[day]);
    var castSteps = [];
    try {
        const response = await fetch(callUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        for (let i = 0; i < data.list.length; i++) { // loop through each data entry
            let d = new Date(data.list[i].dt * 1000).getDay();
            let t = formatTime(data.list[i]);
            let imgUrl = weatherIconBase + data.list[i].weather[0].icon + '.png';
            if (d === day) { // create table cell
                let castStep = $('<td>', {
                    'class': 'forecastSteps',
                    'id': data.list[i].dt,
                    'data-param': d
                });
                let cellWrapper = $('<div>', {
                    'class': 'forecastWrapper',
                    'id': 'wrapper_' + data.list[i].dt
                });
                cellWrapper.css({
                    'box-sizing':'border-box',
                    'width':'100%',
                    'height':'100%',
                    'display':'flex',
                    'align-items':'center'
                });
                let imgDiv = $('<div>',{
                    'class': 'forecastSteps forecastImg',
                    'id':'img' + data.list[i].dt
                });
                let txtDiv = $('<div>',{
                    'class': 'forecastSteps forecastTxt',
                    'id':'txt' + i
                });
                imgDiv.html(
                    '<img src=' + imgUrl + '>'
                );
                imgDiv.css({
                    'width':'40%',
                });
                txtDiv.html(
                    t + '<br>' +
                    data.list[i].weather[0].description + '<br>' +
                    'Hi: ' + data.list[i].main.temp_max + '°F' + '<br>' + 
                    'Lo: ' + data.list[i].main.temp_min + '°F' + '<br>' +
                    'Humid: ' + data.list[i].main.humidity + '%' + '<br>' +
                    'Precip: ' + data.list[i].pop.toFixed(2) * 100 + '%'
                );
                txtDiv.css({
                    'width':'60%'
                });
                cellWrapper.append(imgDiv,txtDiv);
                castStep.append(cellWrapper)
                castSteps.push(castStep);
            }
        }
        // add css for <td> sizing
        for (let c = 0; c < castSteps.length; c++) {
            while (c < castSteps.length/2) {
                $('#detailedRow1').append(castSteps[c]);
                c++;
            }
            while (c >= castSteps.length/2 && c < castSteps.length) {
                $('#detailedRow2').append(castSteps[c]);
                c++;
            }
        }
        $('.detailedRow').css({
            'border-radius':'4px',
            'background-color':'lightblue',
            'border-style':'inset',
            'height':'40%'
        });
        $('td').css({
            'width':'calc(100%/(' + castSteps.length + '/2) - 10%)',
            'border-style':'double groove',
            'border-color':'lightgreen',
            'border-width':'12px',
            'border-radius':'16px',
            'border-spacing':'10px',
            'padding':'10px'
        });
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}
    
$('.forecast').on('click', '.days', function() {
    let day = $(this).data('param');
    return detailedForecast(day);
});

});
