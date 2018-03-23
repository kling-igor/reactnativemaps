import React, { Component } from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import MapView, { Callout, Marker, ProviderPropType, PROVIDER_GOOGLE } from 'react-native-maps';
import Geocoder from './Geocoder'
import {v4} from 'uuid'


let { width, height } = Dimensions.get('window')
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.006
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

const API_KEY = 'AIzaSyAEoP8nFpwQaxIJzalsEU6pXYB5JnR_T5c';

Geocoder.setApiKey(API_KEY);

// let zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2)

const zoom = longitudeDelta => Math.round(Math.log(360 / longitudeDelta) / Math.LN2)


export default class App extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      region:{
        latitude: 53.54149059188792,
        longitude: 49.36498571187258,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      },
      poi: null,
      address: null,
      markers:[
        {
          latitude: 53.541,
          longitude: 49.365,
          address: 'NO ADDRESS'
        },
        // {
        //   latitude: 53.54149059188792,
        //   longitude: 49.36498571187258,
        //   address: ''
        // }
      ]
    }

    this.onRegionChange = this.onRegionChange.bind(this)
    // this.onPoiClick = this.onPoiClick.bind(this)

    const {region:{latitude, longitude}} = this.state

    console.log(`lat: ${latitude} lng: ${longitude}`)


    // TODO если к окончанию обновления изменится массив маркеров - то проблема!!!!

    const updateMarkerAddress = (index, markers) => {

      if (!markers[index]) return

      const {latitude, longitude} = markers[index]

      console.log(`REQUESTING ADDRES FOR lat: ${latitude},  lang:${longitude}`)


      Geocoder.getFromLatLng(latitude, longitude).then(
        json => {
          // console.log('JSON:', json)
          const address = json.results[0].formatted_address;
          console.log('ADDRESS:', address)

          const updatedMarkers = [...markers.slice(0, index), 
            {
              latitude,
              longitude,
              address
            },
            ...markers.slice(index + 1)]

          this.setState({
            markers: updatedMarkers
          }, () =>{

            console.log('UPDATED MARKERS:', this.state.markers)

            if (index < this.state.markers.length - 1) {
              setTimeout(updateMarkerAddress, 0, index + 1, [...this.state.markers])
            }
          })
        },
        error => {
          console.error(error)
        })
    }

    updateMarkerAddress(0, [...this.state.markers])

  }

  // onPoiClick(e) {
  //   console.log('On poi click')

  //   const poi = e.nativeEvent;

  //   this.setState({
  //     poi
  //   })
  // }

	onRegionChange(region) {
    console.log(`region: ${JSON.stringify(region)}, zoom: ${zoom(region.longitudeDelta)}`)
    // this.setState({
    //   region:{
    //     latitude: region.latitude || this.state.latitude,
    //     longitude: region.longitude || this.state.longitude,
    //     latitudeDelta: LATITUDE_DELTA,
    //     longitudeDelta: LONGITUDE_DELTA
    //   }
    // })
	}

  componentDidMount() {
		this.watchID = navigator.geolocation.watchPosition((position) => {
		// Create the object to update this.state.mapRegion through the onRegionChange function
      this.setState({
        region:{
          latitude: position.coords.latitude || this.state.latitude,
          longitude: position.coords.longitude || this.state.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA
        }
      })
		})
	}

  componentWillUnmount() {
		if (this.watchID) navigator.geolocation.clearWatch(this.watchID);
	}

  // standard, satellite, hybrid, terrain


  // title={`${this.state.region.longitude.toFixed(3) } / ${ this.state.region.latitude.toFixed(3)}`}
  // onDragEnd={e => console.log(`placed to: ${e.nativeEvent.coordinate}`)}
  render() {
    return (
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          mapType={'standard'}
          showsUserLocation={true}
          followUserLocation={true}
          region={this.state.region}
          onRegionChangeComplete={this.onRegionChange}
        >
          {this.state.poi && (
            <Marker
              coordinate={this.state.poi.coordinate}
            >
              <Callout>
                <View>
                  <Text>Place Id: { this.state.poi.placeId }</Text>
                  <Text>Name: { this.state.poi.name }</Text>
                </View>
              </Callout>
            </Marker>  
          )}

          {this.state.markers.map(marker => (
            <MapView.Marker
              dragable
              title={`${marker.address}`}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude
              }}
              calloutOffset={{
                x: -50,
                y: -50
              }}
              key={v4()}
            >
          </MapView.Marker>
          ))}
        </MapView>
      </View>
    )
  }
}




const styles = StyleSheet.create ({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
	map: {
		...StyleSheet.absoluteFillObject,
	}
})
