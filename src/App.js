import { useRef, useEffect, useState } from 'react'
import * as tt from '@tomtom-international/web-sdk-maps'
import * as ttapi from '@tomtom-international/web-sdk-services'
import './App.css'
import '@tomtom-international/web-sdk-maps/dist/maps.css'
import CSVConverter from './CSVConverter';

const App = () => {
  const mapElement = useRef()
  const [map, setMap] = useState({})
  const [latitude, setLatitude] = useState(9.7131)
  const [longitude, setLongitude] = useState(76.6833)
  const [coordinates, setCoordinates] = useState([]);

  const getArray = (data) => {
    const processedArray = data; // You might perform some processing here
    setCoordinates(processedArray);
  };

  


  const convertToPoints = (lngLat) => {
    return {
      point: {
        latitude: lngLat.lat,
        longitude: lngLat.lng
      }
    }
  }

  const drawRoute = (geoJason, map) => {
    if (map.getLayer('route')) {
      map.removeLayer('route')
      map.removeSource('route')
    }
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: geoJason
      },
      paint: {
        'line-color': 'red',
        'line-width': 6
      }
    })
  }

  const addDeliveryMarker = (lngLat, map) => {
    const element = document.createElement('div')
    element.className = 'marker-delivery'
    new tt.Marker({
      element: element
    })
      .setLngLat(lngLat)
      .addTo(map)
  }

  useEffect(() => {
    const origin = {
      lng: longitude,
      lat: latitude
    }
    const destinations = []
    let map = tt.map({
      key: "9RCXbCn4ZSihAnhlpYhcE6dpLy7BZDjA",
      container: mapElement.current,
      stylesVisibility: {
        trafficIncidents: true,
        trafficFlow: true
      },
      center: [longitude, latitude],
      zoom: 14
    })
    setMap(map)

    const addMarker = () => {

      const popupOffset = {
        bottom: [0, -25]
      }
      const popup = new tt.Popup({ offset: popupOffset }).setHTML('Here you are!')

      const element = document.createElement('div')
      element.className = 'marker'

      const marker = new tt.Marker({
        draggable: true,
        element: element
      })
        .setLngLat([longitude, latitude])
        .addTo(map)

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        setLongitude(lngLat.lng)
        setLatitude(lngLat.lat)
      })

      marker.setPopup(popup).togglePopup()
    }

    addMarker()

    const sortDestinations = (locations) => {
      const pointsForDestinations = locations.map((destination) => {
        return convertToPoints(destination)
      })
      const callParameters = {
        key: "9RCXbCn4ZSihAnhlpYhcE6dpLy7BZDjA",
        destinations: pointsForDestinations,
        origins: [convertToPoints(origin)]
      }

      return new Promise((resolve, reject) => {
        ttapi.services
          .matrixRouting(callParameters)
          .then((matrixAPIResults) => {
            const results = matrixAPIResults.matrix[0]
            const resultsArray = results.map((result, index) => {
              return {
                location: locations[index],
                drivingtime: result.response.routeSummary.travelTimeInSeconds,
              }
            })
            resultsArray.sort((a, b) => {
              return a.drivingtime - b.drivingtime
            })
            const sortedLocations = resultsArray.map((result) => {
              return result.location
            })
            resolve(sortedLocations)
          })
      })
    }

    // pointsForDestinations = location.map

    // return new Promise((resolve,reject)=>{
    //   ttapi.services
    //   .matrixRouting(callParameters)
    // })


    const recalculateRoutes = () => {
      sortDestinations(destinations).then((sorted) => {
        sorted.unshift(origin)

        ttapi.services
          .calculateRoute({
            key: "9RCXbCn4ZSihAnhlpYhcE6dpLy7BZDjA",
            locations: sorted,
          })
          .then((routeData) => {
            const geoJason = routeData.toGeoJson()
            drawRoute(geoJason, map)
          })
      })
    }

let nextDestinationIndex = 0;

    const addDestinationsAutomatically = (coordinates) => {
      if (coordinates.length > 0) {
        const c = coordinates;
      
        const addNextDestination = () => {
          
                if (c.length > 0 && nextDestinationIndex < c.length) {
                    const destination = c[nextDestinationIndex++];
                    destinations.push(destination);
                    addDeliveryMarker(destination, map);
                    recalculateRoutes();
                } else {
                    clearInterval(interval); // Stop adding destinations when all coordinates have been added
                }
        };

        const interval = setInterval(addNextDestination, 2000); // Add next destination every 5000 milliseconds (5 seconds)
      };
    }

addDestinationsAutomatically(coordinates);

    return
  }, [longitude, latitude,coordinates])
  return (
    <>
      {map && <div className="app">
        <div ref={mapElement} className="map" />
        <div className="searchBar">
          <h1>Change Your Warehouse location</h1>
          <input
            type="text"
            id="latitude"
            className="latitude"
            placeholder="Put in latitude"
            onChange={(e) => { setLatitude(e.target.value) }}
          />

          <input
            type="text"
            id="longitude"
            className="longitude"
            placeholder="Put in Longitude"
            onChange={(e) => { setLongitude(e.target.value) }}
          />

          <div className="csvUpload">
        <h1>Upload your delivery file</h1>
        <CSVConverter onConvert={getArray} />
      </div>
  
        </div>
      </div>}
    </>
  )
}



export default App;
