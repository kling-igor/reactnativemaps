import React, { Component } from 'react'
import { View, StyleSheet, Dimensions, Button, Text } from 'react-native'
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


const MERCATOR_OFFSET = 268435456
const MERCATOR_RADIUS = 85445659.44705395

const longitudeToPixelSpaceX = longitude => {
  return Math.round(MERCATOR_OFFSET + MERCATOR_RADIUS * longitude * Math.PI / 180.0)
}


const latitudeToPixelSpaceY = latitude => {
  return Math.round(MERCATOR_OFFSET - MERCATOR_RADIUS * Math.log((1 + Math.sin(latitude * Math.PI / 180.0)) / (1 - Math.sin(latitude * Math.PI / 180.0))) / 2.0);
}


const pixelSpaceXToLongitude = pixelX => {
  // return ((Math.round(pixelX) - MERCATOR_OFFSET) / MERCATOR_RADIUS) * 180.0 / Math.PI;
  return ((pixelX - MERCATOR_OFFSET) / MERCATOR_RADIUS) * 180.0 / Math.PI;
}


const pixelSpaceYToLatitude = pixelY => {
  // return (Math.PI / 2.0 - 2.0 * Math.atan(Math.exp((Math.round(pixelY) - MERCATOR_OFFSET) / MERCATOR_RADIUS))) * 180.0 / Math.PI;
  return (Math.PI / 2.0 - 2.0 * Math.atan(Math.exp((pixelY - MERCATOR_OFFSET) / MERCATOR_RADIUS))) * 180.0 / Math.PI;
}

const calcRegion = (latitude, longitude, zoomLevel, mapWidth, mapHeight) => {
  // convert center coordiate to pixel space
  const centerPixelX = MERCATOR_OFFSET + MERCATOR_RADIUS * longitude * Math.PI / 180.0
  const centerPixelY = MERCATOR_OFFSET - MERCATOR_RADIUS * Math.log((1 + Math.sin(latitude * Math.PI / 180.0)) / (1 - Math.sin(latitude * Math.PI / 180.0))) / 2.0

  // determine the scale value from the zoom level
  const zoomExponent = 20 - zoomLevel
  const zoomScale = Math.pow(2, zoomExponent)

  const scaledMapWidth = mapWidth * zoomScale
  const scaledMapHeight = mapHeight * zoomScale

  // figure out the position of the top-left pixel
  const topLeftPixelX = centerPixelX - (scaledMapWidth / 2)
  const topLeftPixelY = centerPixelY - (scaledMapHeight / 2)

  // find delta between left and right longitudes
  const minLng = pixelSpaceXToLongitude(topLeftPixelX)
  const maxLng = pixelSpaceXToLongitude(topLeftPixelX + scaledMapWidth)
  const longitudeDelta = maxLng - minLng

  // find delta between top and bottom latitudes
  const minLat = pixelSpaceYToLatitude(topLeftPixelY)
  const maxLat = pixelSpaceYToLatitude(topLeftPixelY + scaledMapHeight)
  const latitudeDelta = -1 * (maxLat - minLat);

  return { latitude: Number.parseFloat(latitude.toFixed(6)), longitude: Number.parseFloat(longitude.toFixed(6)), latitudeDelta, longitudeDelta }
}


class MapStore {
  width
  height
  @observable viewRatio
  @observable.ref center = { lat: 55.75149154293644, lng: 37.611341682501916 }

  blockLoop
  usingDeltas = false
  // @observable.ref deltas = {}
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
    const ratio = this.viewRatio // TODO НЕ УДАЛЯТЬ!!!! от него зависит правильность работы всего модуля!!! 

    const region = calcRegion(this.center.lat, this.center.lng, this.zoom, this.width, this.height)

    console.log('REGION:', region)

    return region

    // return { latitude: 55.75149154293644, longitude: 37.611341682501916, latitudeDelta: 0.006182923187338929, longitudeDelta: 0.010986328125 }
  }

  @action
  onLayout(event) {
    const { width, height } = event.nativeEvent.layout
    this.width = width
    this.height = height

    this.viewRatio = width / height
    console.log('on layout:', this.width, this.height);
    // console.log('RATIO:', this.viewRatio)
  }

  @action
  setCenter(lat, lng) {
    this.center = { lat, lng }
  }

  @action
  setZoom(zoom) {
    this.zoom = zoom
  }

  // for web google-maps
  @action
  setCenterAndZoom(lat, lng, zoom) {
    transaction(() => {
      if (lat !== this.center.lat || lng !== this.center.lng) {
        this.center = { lat, lng }
      }
      if (zoom !== this.zoom) {
        this.zoom = zoom
      }
    })
  }

  // for native google-maps
  @action
  setRegion(lat, lng, latitudeDelta, longitudeDelta) {
    transaction(() => {
      this.usingDeltas = true
      this.center = { lat, lng }
      this.deltas = { latitudeDelta, longitudeDelta }
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

// let mapRef

const MapRenderer = observer(({ style, mapStore, onRegionChangeComplete, onPress }) => (
  <MapView
    // ref={ref => { mapRef = ref }}
    style={styles.map}
    provider={PROVIDER_GOOGLE}
    mapType='standard'
    minZoomLevel={0}
    maxZoomLevel={20}
    rotateEnabled={false}
    pitchEnabled={false}
    showsPointsOfInterest={false}
    initialRegion={mapStore.region}
    region={mapStore.region}
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

    this.onLayout = this.props.mapStore.onLayout.bind(this.props.mapStore)
  }

  componentWillReact() {
    console.log("MapScreen re-render, since the store has changed!");
  }

  onRegionChangeComplete = region => {
    const { latitude, longitude, longitudeDelta } = region
    const zoom = Number.parseFloat((Math.log(360 / longitudeDelta) / Math.LN2).toFixed(2))
    // console.log('ZOOM:', zoom)

    console.log(`onRegionChangeComplete: ${JSON.stringify(region)} zoom:${zoom}`)
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

  button1 = () => {
    this.props.mapStore.setCenterAndZoom(55.7503, 37.6728, 10)
  }

  button2 = () => {
    this.props.mapStore.setCenterAndZoom(53.5107, 49.4714, 10)
  }

  render() {
    const { mapStore, style } = this.props
    return (
      <View style={[style, styles.container]}>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Button
            style={{ backgroundColor: 'yellow' }}
            onPress={this.button1}
            title="Туда"
            color="#841584"
          />
          <Button
            onPress={this.button2}
            title="Сюда"
            color="#123456"
          />
        </View>
        <Text>{this.props.mapStore.zoom} : {this.props.mapStore.center.lat}, {this.props.mapStore.center.lng} </Text>
        <View style={styles.map} onLayout={this.onLayout}>
          {mapStore.viewRatio ? <MapRenderer mapStore={this.props.mapStore} onRegionChangeComplete={this.onRegionChangeComplete} onPress={this.onPress} /> : null}
        </View>
      </View >)
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  map: {
    width: 512,
    height: 512
  }
})

const store = new MapStore

export default () => (
  <Provider mapStore={store}>
    <MapScreen />
  </Provider>
)
