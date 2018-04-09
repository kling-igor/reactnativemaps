import React, { Component } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import MapView, { Callout, Marker, ProviderPropType, PROVIDER_GOOGLE } from 'react-native-maps'
import PropTypes from 'prop-types'
import { observable, computed, action, autorun, transaction, when, spy } from 'mobx'
import { observer, inject, PropTypes as PropTypesMobX, Provider, Observer } from 'mobx-react'
import v4 from 'uuid'

spy((event) => {
  if (event.type === 'action') {
    console.log(`[SPY]: ${event.name} with args: `, event.arguments)
  }
})


class MapStore {
  width
  height
  @observable viewRatio
  @observable.ref center = { lat: 55.75149154293644, lng: 37.611341682501916 }
  @observable zoom = 15

  @observable.ref markers = []

  // ready = computed(() => {
  //   console.log('!!!viewRatio:', this)
  //   return false
  //   // return this.viewRatio
  // }, { context: this })

  // get ready() {
  //     console.log('!!!READY:', this.viewRatio)
  //     return this.viewRatio !== undefined
  //   }

  @computed get region() {
    console.log('---REGION---')

    const ratio = this.viewRatio

    console.log('RATIO:', ratio)
    console.log('WIDTH:', this.width)
    console.log('ZOOM:', this.zoom);

    if (ratio) {
      // console.log('READY!!!')
      const latitudeDelta = this.width * 360 / (Math.exp(this.zoom * Math.LN2) * 256)
      const longitudeDelta = latitudeDelta * ratio

      return { latitude: this.center.lat, longitude: this.center.lng, latitudeDelta, longitudeDelta }
    }

    console.log('NOT READY')

    return { latitude: 55.75149154293644, longitude: 37.611341682501916, latitudeDelta: 0.006, longitudeDelta: 0.012 }
  }

  @action
  onLayout(event) {
    const { width, height } = event.nativeEvent.layout
    this.width = width
    this.height = height

    this.viewRatio = width / height
    console.log('on layout:', this.width, this.height);
    console.log('RATIO:', this.viewRatio)
  }

  @action
  setCenter(lat, lng) {
    this.center = { lat, lng }
  }

  @action
  setZoom(zoom) {
    this.zoom = zoom
  }

  @action
  setCenterAndZoom(lat, lng, zoom) {
    transaction(() => {
      this.setCenter(lat, lng)
      this.setZoom(zoom)
      console.log('setCenterAndZoom ', lat, lng, zoom)
    })
  }

  @action
  addMarker(latitude, longitude, title = 'MARKER') {
    const marker = {
      latitude,
      longitude,
      id: v4()
    }
    this.markers = [...this.markers, marker]
  }

  onMarkerPress(markerId) {
    const marker = store.markers.find(marker => marker.id === markerId)
    if (marker) {
      const { latitude, longitude } = marker
      setCenter(latitude, longitude)
    }
  }
}



const Markers = props => {
  if (!props.markers.length) return null

  const bind = (id, onClick) => () => {
    onClick(id)
  }

  return props.markers.map(marker => {
    const { latitude, longitude, id } = marker
    return <Marker coordinate={{ latitude, longitude }} key={id} onMarkerPress={bind(marker.id, props.onMarkerPress)} />
  })
}

// Markers.propTypes = {
//   markers: PropTypes.observableArray.isRequired
// }


const MapRenderer = observer(({ style, mapStore, onRegionChangeComplete, onPress }) => (
  <MapView
    style={styles.map}
    provider={PROVIDER_GOOGLE}
    mapType='standard'
    startRegion={mapStore.region}
    onRegionChangeComplete={onRegionChangeComplete}
    onPress={onPress}
  >
    <Markers markers={mapStore.markers} onMarkerPress={mapStore.onMarkerPress} />
  </MapView>
))

@inject("mapStore")
@observer
class MapScreen extends React.Component {

  static propTypes = {
    onRegionChange: PropTypes.func,
    markers: PropTypes.array
  }


  constructor(props) {
    super(props)

    this.state = {
      region: { latitude: 0, longitude: 0, latitudeDelta: 0.006, longitudeDelta: 0.012 }
    }
  }

  componentWillReact() {
    console.log("MapScreen re-render, since the store has changed!");
  }

  onRegionChangeComplete = region => {
    console.log('onRegionChangeComplete:', region)
    // this.setState({
    //   region
    // }, () => {
    //   console.log('STATE:', this.state.region)
    //   const { latitude, longitude, longitudeDelta } = region
    //   const zoom = Math.log(360 / longitudeDelta) / Math.LN2
    //   // store.setCenter(latitude, longitude)
    //   // store.setZoom(zoom)
    //   this.props.mapStore.setCenterAndZoom(latitude, longitude, zoom)
    // })

    const { latitude, longitude, longitudeDelta } = region
    const zoom = Math.log(360 / longitudeDelta) / Math.LN2
    this.props.mapStore.setCenterAndZoom(latitude, longitude, zoom)
  }

  onPress = e => {
    const { latitude, longitude } = e.nativeEvent.coordinate
    console.log(`CLICK ON MAP AT: ${latitude} ${longitude}`)
    this.props.mapStore.addMarker(latitude, longitude)
  }

  onMarkerPress = markerId => {
    console.log('on marker press:', markerId)
  }

  //startRegion={this.props.store.region}

  // startRegion={mapStore.region}

  // render() {
  //   const { mapStore, style } = this.props
  //   const ready = this.props.mapStore.viewRatio
  //   console.log('ready:', ready)
  //   return (
  //     <View style={[style, styles.container]} onLayout={mapStore.onLayout}>
  //       {true ? <MapView
  //         style={styles.map}
  //         provider={PROVIDER_GOOGLE}
  //         mapType='standard'
  //         region={mapStore.region}
  //         onRegionChangeComplete={this.onRegionChangeComplete}
  //         onPress={this.onPress}
  //       >
  //         <Markers markers={mapStore.markers} onMarkerPress={mapStore.onMarkerPress} />
  //       </MapView> : null}
  //     </View >)
  // }

  render() {
    const { mapStore, style } = this.props
    return (
      <View style={[style, styles.container]} onLayout={mapStore.onLayout.bind(mapStore)}>
        {mapStore.viewRatio ? <MapRenderer style={style} mapStore={this.props.mapStore} onRegionChangeComplete={this.onRegionChangeComplete} onPress={this.onPress} /> : null}
      </View >)
  }
}


const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  }
})

const store = new MapStore

export default () => (
  <Provider mapStore={store}>
    <MapScreen />
  </Provider>
)
