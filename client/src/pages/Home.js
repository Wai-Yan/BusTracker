import React, { Component, Fragment } from "react";
import { Col, Row, Container } from "../components/Grid";
import { List, ListItem } from "../components/List";
// import { Input, TextArea, FormBtn } from "../components/Form";
import Search from "../components/Search";
import MapRender from "../components/Map"
import FavNav from "../components/FavNav"
import SaveLines from "../components/SaveLine"
import API from "../utils/API";
import RouteSaveBtn from "../components/RouteSaveBtn"
import AutoCompleteFilters from "../components/Autocomplete"
import DropdownFav from "../components/DropdownFav"
import DropdownActive from "../components/DropdownActive"
import MenuItem from 'material-ui/MenuItem';
import { withAlert } from "react-alert";
import GeoLocation from "../components/GeoLocation";
import "./Home.css";

class Home extends Component {
  state = {
    result: {},
    search: "10A",
    routeShape0: [],
    routeShape1: [],
    buses: [],
    allRoutes: [],
    firstBus: {},
    mapCenter: {},
    check: false,
    zoom: 16,
    stops0: [],
    stops1: [],
    validSearch: "10A",
    isLoggedIn: false,
    usersRoutes: [],
    checked: false,
    clickedMarker: null,
    predictionsInfo0: [],
    predictionsInfo1: [],
    countDown: 15,
    increment: null,
    userLocation: null,
    dataSource: []
  };

  componentDidMount(query) {
    this.searchRoutes0();
    console.log("compWillMount")
    this.checkLoginStatus();
    this.timer();
    this.searchAllRoutes();
  };

  componentWillUnmount() {
    if (this.state.countDown < 1) {
        clearInterval(this.state.increment)
    }
  }

  componentWillUpdate() {
    if (this.state.countDown < 1) {
      this.timerReset();
      this.searchBuses();
      // this.closeNav();
    }
  }

  checkLoginStatus = () => {
    var userID = localStorage.getItem('googleID');

    // Grabs from db the user's currently favorited routes
    if (userID)
      API.getUsersRoutes(userID).
        then((result) => {
          const theirSaved = result.data[0].routes;
          this.setState({usersRoutes: theirSaved})

          // Check if current search in bookmarks
          if (theirSaved.includes(this.state.validSearch)) {

            // Make the heart blue, "Unsave"
            this.setState({checked: true});
          }

          else {
            // Make heart white, "Save"
            this.setState({checked: false});
          }
        });
  }

  zoomToThisBus = (location) => {
    this.setState({mapCenter: location})
  };
  timer = () =>  {
      this.state.increment = setInterval( () =>
        this.setState({
          countDown: this.state.countDown - 1
        }), 1000);
      console.log("this.state.increment: ",this.state.increment)
  };
  timerReset = () => {
    this.setState({
        buses: [],
        firstBus: {}
      });
    this.setState({countDown: 15});
  }
  showPosition = (position) => {
    this.setState({userLocation: {
      lat: position.coords.latitude,
      lng: position.coords.longitude}});
      this.setState({mapCenter: {
        lat: position.coords.latitude,
        lng: position.coords.longitude}});
    console.log("Latitude: " + position.coords.latitude +
      "<br>Longitude: " + position.coords.longitude);
  };
  getLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(this.showPosition)
    } else {
        this.props.alert.show("Geolocation is not supported by this browser.");
    }
  };

  searchAllRoutes = () => {
    let busRoutesArr = [];
    let that = this;
    API.searchAll()
      .then(res => {
      res.data.Routes.forEach(item =>
        busRoutesArr.push(item.RouteID)
      )
      that.setState({dataSource: busRoutesArr})
      console.log("routes", that.state.dataSource)
    })
  }

  searchRoutes0 = () => {
    API.routeSearch(this.state.search)
      .then(res => {
      let ShapeDefined = [];
      res.data.Direction0.Shape.forEach(item =>
        ShapeDefined.push({
          lat: parseFloat(item.Lat),
          lng: parseFloat(item.Lon)
        })
      )
      if (ShapeDefined != []) {
        {
          this.props.alert.success("Search was successful! Loading Route...");
        }
      }
      //this.setState({routeShape0: ShapeDefined}),
      this.setState({routeShape0: ShapeDefined, stops0: ShapeDefined, stops1: ShapeDefined, mapCenter: ShapeDefined[0]}),
      this.searchRouteStops0(),
      this.searchRoutes1(),
      this.searchRouteStops1(),
      this.searchBuses(),
      console.log("SearchRoutes", res)

      this.setState({validSearch: this.state.search})

      // Check if favorited
      if (this.state.usersRoutes.includes(this.state.validSearch)) {
        this.setState({checked: true})
      }

      else {
        this.setState({checked: false})
      }
    })
      .catch(err => {
        this.props.alert.error("Not a proper route search, path cannot be displayed!"),
        this.setState({routeShape0: []}),
        this.setState({routeShape1: []}),
        this.setState({stops0: []}),
        this.setState({stops1: []}),
        this.setState({buses: []})
      })
  };
  searchRoutes1 = () => {
    API.routeSearch(this.state.search)
      .then(res => {
      let ShapeDefined = [];
      res.data.Direction1.Shape.forEach(item =>
        ShapeDefined.push({
          lat: parseFloat(item.Lat),
          lng: parseFloat(item.Lon)
        })
      ),
      this.setState({routeShape1: ShapeDefined}),
      console.log("SearchRoutes", res)
      this.setState({validSearch: this.state.search})
      console.log("We SHOULD see F13 below...")
      console.log(this.state.validSearch);
    })
      .catch(err => console.log(err));
  };

//work on tomorrow for bus stops
  searchRouteStops0 = () => {
    API.routeSearch(this.state.search)
      .then(res => {
      let RouteStops = [];
      let firstStopCenter;
      let stopLat = res.data.Direction0.Stops[0].Lat;
      let stopLng = res.data.Direction0.Stops[0].Lon;
      res.data.Direction0.Stops.forEach(item =>
        RouteStops.push({
        location: {
          lat: parseFloat(item.Lat),
          lng: parseFloat(item.Lon)
        },
        StopID: Number(item.StopID),
        Name: String(item.Name),
        Routes: String(item.Routes)
        })
      ),
      this.setState({stops0: RouteStops}),
      console.log(this.state.stops0)
      firstStopCenter = {
          lat: parseFloat(stopLat),
          lng: parseFloat(stopLng)
      }
      this.setState({ mapCenter: firstStopCenter })
    })
      .catch(err => console.log(err));
  };
  searchRouteStops1 = () => {
    API.routeSearch(this.state.search)
      .then(res => {
        console.log("stops1", res)
      let RouteStops = [];
      res.data.Direction1.Stops.forEach(item =>
        RouteStops.push({
        location: {
          lat: parseFloat(item.Lat),
          lng: parseFloat(item.Lon)
        },
        StopID: Number(item.StopID),
        Name: String(item.Name),
        Routes: String(item.Routes)
        })
      ),
      this.setState({stops1: RouteStops}),
      console.log("stops1",this.state.stops1)
    })
      .catch(err => console.log(err));
  };

  searchBuses = () => {
    API.busPositions(this.state.search)
      .then(res => {

      let busesArray = [];
      let firstBusCenter;
      let busLat = res.data.BusPositions[0].Lat;
      let busLng = res.data.BusPositions[0].Lon;

      res.data.BusPositions.forEach(item =>
        busesArray.push({
        position: {
          lat: parseFloat(item.Lat),
          lng: parseFloat(item.Lon)
        },
        tripHeadSign: String(item.TripHeadsign),
        directionText: String(item.DirectionText),
        deviation: parseFloat(item.Deviation),
        dropdownText: "Bus heading " + String(item.DirectionText) + " towards " + String(item.TripHeadsign)
      })
      ),
      this.setState({ buses: busesArray}),
      console.log(res),
      //Grab First Bus in Array
      firstBusCenter = {
          lat: parseFloat(busLat),
          lng: parseFloat(busLng)
        }
      this.setState({ firstBus: firstBusCenter })
      console.log(this.state.firstBus)
    })
      .catch(err => console.log(err));
  };

  // for the heart
  updateSaved() {
    var theirRoutes = this.state.usersRoutes.slice();
    var userID = localStorage.getItem('googleID');

    // User clicked on blank heart, wants to SAVE
    if (this.state.checked == false) {

      theirRoutes.push(this.state.validSearch);
      this.setState({ usersRoutes: theirRoutes });

      API.saveRoute(userID, theirRoutes);
    }

    // User clicked on blue heart, wants to REMOVE
    if (this.state.checked == true) {
      var index = theirRoutes.indexOf(this.state.validSearch);

      if (index > -1) {
        theirRoutes.splice(index, 1);
      }

      this.setState({ usersRoutes: theirRoutes});

      API.saveRoute(userID, theirRoutes);
    }

    this.setState((oldState) => {
      return {
        checked: !oldState.checked,
      };
    });
  }

  removeRoute = () => {
    var theirRoutes = this.state.usersRoutes.slice();

    var index = theirRoutes.indexOf(this.state.validSearch);

    if (index > -1) {
      theirRoutes.splice(index, 1);
    }

    this.setState({ usersRoutes: theirRoutes});
  }

   //checkStopPrediction keeps getting called after Marker is clicked
  checkStopPrediction0 = (stopId) => {
    console.log('checkStopPrediction0', stopId)
    API.stopBusPrediction(stopId)
      .then(res => {
      let predictionsArray = [];
      res.data.Predictions.forEach(item =>
        predictionsArray.push({
          DirectionNum: String(item.DirectionNum),
          DirectionText: String(item.DirectionText),
          MinutesAwayPrediction: parseFloat(item.Minutes),
          RouteID: String(item.RouteID),
          TripID: String(item.TripID),
        })
      )
      this.setState({predictionsInfo0: predictionsArray})
      return
      console.log("Predictions for Location:", this.state.predictionsInfo)
    })
      .catch(err => console.log(err));
  };

  checkStopPrediction1 = (stopId) => {
    console.log('checkStopPrediction1', stopId)
    API.stopBusPrediction(stopId)
      .then(res => {
      let predictionsArray = [];
      res.data.Predictions.forEach(item =>
        predictionsArray.push({
          DirectionNum: String(item.DirectionNum),
          DirectionText: String(item.DirectionText),
          MinutesAwayPrediction: parseFloat(item.Minutes),
          RouteID: String(item.RouteID),
          TripID: String(item.TripID),
        })
      )
      this.setState({predictionsInfo1: predictionsArray})
      return
      console.log("Predictions for Location:", this.state.predictionsInfo)
    })
      .catch(err => console.log(err));
  };

  handleInputChange = (newValue) => {
    this.setState({
      'search': newValue
    });
  };

  handleFormSubmit = () => {
    this.searchRoutes0();
    console.log("Submit Route Shape", this.state.routeShape0)
  };

//   openNav = () => {
//     document.getElementById("mySidenav").style.width = "250px";
//     document.getElementById("main").style.marginLeft = "250px";
//   }
//
//   closeNav = () => {
//     document.getElementById("mySidenav").style.width = "0";
//     document.getElementById("main").style.marginLeft = "0";
// }
//
//   openNavBus = () => {
//     document.getElementById("mySideNavBus").style.width = "250px";
//     document.getElementById("main").style.marginLeft = "250px";
//   }
//
//   closeNavBus = () => {
//     document.getElementById("mySideNavBus").style.width = "0";
//     document.getElementById("main").style.marginLeft = "0";
//   }

  render() {
    return (
      <div>
        <Container>
          <AutoCompleteFilters
          dataSource={this.state.dataSource}
          handleInputChange={this.handleInputChange}
          handleFormSubmit={this.handleFormSubmit}
          />
          <br />
          <div>
          <h2>Tracking route {this.state.search}
          </h2>
          <SaveLines
          updateSaved={this.updateSaved.bind(this)}
          checked={this.state.checked}
          status={this.state.checked}
          />
          </div>
          {/*<div
            className="nav-open"
            onClick={this.openNav}>&#9776; View your saved lines
          </div>*/}
          <div>
          <DropdownFav />
          {this.state.buses.length ?
            <DropdownActive>
            {this.state.buses.map((bus, index) => (
              <ul>
              <MenuItem
                value={bus.position}
                primaryText={bus.dropdownText}
                onClick={() => {this.zoomToThisBus(bus.position)}}
              />
              </ul>
            ))
            }
            </DropdownActive>
           :
           <DropdownActive>
            <MenuItem value="0" primaryText="There are currently no buses in service" disabled={true} />
          </DropdownActive>
        }
          </div>
          {/*{this.state.buses.length ? (
            <div
              className="nav-open"
              onClick={this.openNavBus}> &#9776; View active Buses
            </div>
          ) : (
            <div></div>
          )}
          {this.state.buses.length ?
            (<List closeNav={this.closeNavBus}>
              {this.state.buses.map((bus,index) => (
                <ListItem
                key={index}
                position={bus.position}>
                  This bus is headed to {bus.tripHeadSign}, going {bus.directionText}
                  <button
                  onClick={()=> this.zoomToThisBus(bus.position)}>
                  Zoom To
                  </button>
                </ListItem>
              )
            )
          } </List>
          ) : (
            <h3>No Buses Currently In Service</h3>
          )}*/}
          <MapRender
            googleMapURL="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places"
            loadingElement={<div style={{ height: `100%` }} />}
            containerElement={<div style={{ height: `400px` }} />}
            mapElement={<div style={{ height: `100%` }} />}
            stops0={this.state.stops0}
            stops1={this.state.stops1}
            userLocation={this.state.userLocation}
            center={this.state.mapCenter}
            defaultZoom={16}
            zoomTo={this.state.zoom}
            markers={this.state.buses}
            timer={this.state.countDown}
            path0={this.state.routeShape0}
            path1={this.state.routeShape1}
            predictions0={this.checkStopPrediction0}
            predictionInfo0={this.state.predictionsInfo0}
            predictions1={this.checkStopPrediction1}
            predictionInfo1={this.state.predictionsInfo1}
            />
            <FavNav
            closeNav={this.closeNav}
            />
            <br />
            <GeoLocation
            userLocation={this.getLocation}
            />
            These are the user's routes: {this.state.usersRoutes} This is their latest valid search {this.state.validSearch}

        </Container>
      </div>
    )
  }
}
export default withAlert(Home);
