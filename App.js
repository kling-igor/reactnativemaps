import React, { Component } from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import MapView, { Callout, Marker, ProviderPropType, PROVIDER_GOOGLE } from 'react-native-maps';
import Geocoder from './Geocoder'

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
        latitude: 53.556,
        longitude: 49.295,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      },
      poi: null
    }

    this.onRegionChange = this.onRegionChange.bind(this)
    // this.onPoiClick = this.onPoiClick.bind(this)

    const {region:{latitude, longitude}} = this.state

    console.log(`lat: ${latitude} lng: ${longitude}`)

    Geocoder.getFromLatLng(latitude, longitude).then(
      json => {
        const address_component = json.results[0].address_components[0];
        console.log('ADDRESS:', json)
      },
      error => {
        console.error(error)
      }
    );





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


          <MapView.Marker
            dragable
            title={`${this.state.region.longitude.toFixed(3) } / ${ this.state.region.latitude.toFixed(3)}`}
            coordinate={{
              latitude: this.state.region.latitude,
              longitude: this.state.region.longitude
            }}
            calloutOffset={{
              x: -50,
              y: -50
            }}
            onDragEnd={e => console.log(`placed to: ${e.nativeEvent.coordinate}`)}
          >
          </MapView.Marker>
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
