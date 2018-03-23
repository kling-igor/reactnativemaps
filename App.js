import React, { Component } from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';


let { width, height } = Dimensions.get('window')
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.006
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

// let zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2)


export default class App extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      region:{
        latitude: 53.556,
        longitude: 49.295,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      }
    }

    this.onRegionChange = this.onRegionChange.bind(this)
  }

	onRegionChange(region) {
    console.log(`region: ${JSON.stringify(region)}, zoom: ${Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2)}`)
    // this.setState({
    //   ...this.state,
    //   region,
    //   latitude: latitude || this.state.latitude,
    //   longitude: longitude || this.state.longitude,
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

  render() {
    return (
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.mapContainer}
        mapType={'satellite'}
        showsUserLocation={true}
        followUserLocation={true}
        region={this.state.region}
        onRegionChangeComplete={this.onRegionChange}
      >
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
    )
  }
}


const styles = StyleSheet.create ({
	mapContainer: {
		...StyleSheet.absoluteFillObject,
	}
})
