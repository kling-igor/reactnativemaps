/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  StyleSheet
} from 'react-native';
import MapView from 'react-native-maps';

const App = () => (
  <MapView
    provider={'google'}
    style={StyleSheet.absoluteFillObject}
    mapType={'satellite'}
    showsUserLocation={true}
    initialRegion={{
      latitude: 53.31,
      longitude: 49.25,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421
    }}
  >
    <MapView.Marker
      title="Greenwich"
      coordinate={{
        latitude: 53.31,
        longitude: 49.25
      }}
      calloutOffset={{
        x: -50,
        y: -50
      }}
    />
  </MapView>
)

export default App  
